import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout, Button, Space, Spin, message, Modal, Form, Input, Dropdown, Tooltip } from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  TeamOutlined,
  AppstoreOutlined,
  BlockOutlined,
  ReloadOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { Area, Layer } from '@/types';
import { getBoard, addArea, updateArea, addLayer, updateLayerContent, addGroup } from '@/api/board';
import { useBoardStore } from '@/store/boardStore';
import { useUserStore } from '@/store/userStore';
import InfiniteCanvas from './InfiniteCanvas';
import SearchBar, { type SearchResult } from '@/components/SearchBar/SearchBar';
import ThreeViewer from '@/features/viewer3d/ThreeViewer';
import ViewTransition from './ViewTransition';
import FloatingEditor from '@/features/editor/FloatingEditor';
import LayerManager from '@/features/editor/LayerManager';
import { AREA_DEFAULTS, AREA_SPACING, GROUP_COLORS } from '@/utils/constants';

const { Header, Content } = Layout;

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');
  const [renderedView, setRenderedView] = useState<'2d' | '3d'>('3d');
  const [transitioning, setTransitioning] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [areaModalOpen, setAreaModalOpen] = useState(false);
  const [editorAreaId, setEditorAreaId] = useState<string | null>(null);
  const [editorLayerIndex, setEditorLayerIndex] = useState(0);
  const [layerManagerOpen, setLayerManagerOpen] = useState(false);
  const [layerManagerAreaId, setLayerManagerAreaId] = useState<string | null>(null);
  const [groupForm] = Form.useForm();
  const [areaForm] = Form.useForm();

  const board = useBoardStore((s) => s.board);
  const setBoard = useBoardStore((s) => s.setBoard);
  const clearBoard = useBoardStore((s) => s.clearBoard);
  const selectedAreaId = useBoardStore((s) => s.selectedAreaId);
  const selectedLayerIndex = useBoardStore((s) => s.selectedLayerIndex);
  const selectArea = useBoardStore((s) => s.selectArea);
  const selectLayer = useBoardStore((s) => s.selectLayer);
  const updateAreaLocal = useBoardStore((s) => s.updateAreaLocal);

  const logout = useUserStore((s) => s.logout);

  const fetchBoard = useCallback(async () => {
    if (!boardId) return;
    setLoading(true);
    try {
      const data = await getBoard(boardId);
      setBoard(data);
    } catch {
      message.error('加载画板失败');
    } finally {
      setLoading(false);
    }
  }, [boardId, setBoard]);

  useEffect(() => {
    fetchBoard();
    return () => clearBoard();
  }, [fetchBoard, clearBoard]);

  // ---- Handlers ----
  const handleAreaDragEnd = useCallback(
    async (areaId: string, pos: { x: number; y: number }) => {
      updateAreaLocal(areaId, { position: pos });
      // Persist to server (debounced/best-effort)
      try {
        await updateArea(boardId!, areaId, { position: pos });
      } catch {
        // silent fail; local state already updated
      }
    },
    [boardId, updateAreaLocal]
  );

  const handleUpdateLayer = useCallback(
    async (areaId: string, layerId: string, content: Layer['content']) => {
      if (!board) return;
      const area = board.areas.find((a) => a.id === areaId);
      if (!area) return;
      const layer = area.layers.find((l) => l.id === layerId);
      if (!layer) return;

      // Update local state immediately
      const updatedArea: Area = {
        ...area,
        layers: area.layers.map((l) =>
          l.id === layerId ? { ...l, content } : l
        ),
      };
      setBoard({
        ...board,
        areas: board.areas.map((a) => (a.id === areaId ? updatedArea : a)),
      });

      try {
        await updateLayerContent(boardId!, areaId, layerId, content);
      } catch {
        // best-effort
      }
    },
    [board, boardId, setBoard]
  );

  const handleAddLayer = useCallback(
    async (areaId: string) => {
      try {
        const updated = await addLayer(boardId!, areaId, `第${(board?.areas.find((a) => a.id === areaId)?.layers.length ?? 0) + 1}层`);
        setBoard(updated);
        const area = updated.areas.find((a) => a.id === areaId);
        if (area) selectLayer(area.layers.length - 1);
      } catch {
        message.error('创建层失败');
      }
    },
    [boardId, board, setBoard, selectLayer]
  );

  const handleNavigate = (result: SearchResult) => {
    if (result.areaId) selectArea(result.areaId);
  };

  // ---- Create group ----
  const handleCreateGroup = async (values: { name: string; color: string }) => {
    try {
      const updated = await addGroup(boardId!, values.name, values.color);
      setBoard(updated);
      message.success('小组创建成功');
      setGroupModalOpen(false);
      groupForm.resetFields();
    } catch {
      message.error('创建小组失败');
    }
  };

  // ---- Create area ----
  const handleCreateArea = async (values: { name: string; groupId: string }) => {
    try {
      const areaCount = board?.areas.length ?? 0;
      const x = (areaCount % 4) * AREA_SPACING - (AREA_SPACING * 1.5);
      const y = Math.floor(areaCount / 4) * AREA_SPACING - (AREA_SPACING / 2);
      const updated = await addArea(boardId!, {
        name: values.name,
        groupId: values.groupId,
        position: { x, y },
        size: { width: AREA_DEFAULTS.WIDTH, height: AREA_DEFAULTS.HEIGHT },
      });
      setBoard(updated);
      message.success('区域创建成功');
      setAreaModalOpen(false);
      areaForm.resetFields();
    } catch {
      message.error('创建区域失败');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ---- Layer management ----
  const editorArea = board?.areas.find((a) => a.id === editorAreaId);
  const editorLayer = editorArea?.layers[editorLayerIndex];

  const handleLayerRenamed = useCallback(
    async (layerId: string, newLabel: string) => {
      if (!board || !editorArea) return;
      const area: Area = {
        ...editorArea,
        layers: editorArea.layers.map((l) => (l.id === layerId ? { ...l, label: newLabel } : l)),
      };
      setBoard({
        ...board,
        areas: board.areas.map((a) => (a.id === editorArea.id ? area : a)),
      });
      try {
        await updateLayerContent(boardId!, editorArea.id, layerId,
          editorArea.layers.find((l) => l.id === layerId)?.content ?? { stickyNotes: [], tables: [], drawings: [], timestamps: [] }
        );
      } catch { /* best-effort */ }
    },
    [board, editorArea, boardId, setBoard]
  );

  const handleLayerDeleted = useCallback(
    async (layerId: string) => {
      if (!board || !editorArea || editorArea.layers.length <= 1) return;
      const area: Area = {
        ...editorArea,
        layers: editorArea.layers.filter((l) => l.id !== layerId),
      };
      const updatedBoard = {
        ...board,
        areas: board.areas.map((a) => (a.id === editorArea.id ? area : a)),
      };
      setBoard(updatedBoard);
      setEditorLayerIndex(0);
      // No dedicated delete-layer API; we update the area with new layers
      try {
        await updateArea(boardId!, editorArea.id, { layers: area.layers } as never);
      } catch { /* best-effort */ }
    },
    [board, editorArea, boardId, setBoard]
  );

  const handleLayerReorder = useCallback(
    async (fromIdx: number, toIdx: number) => {
      if (!board || !editorArea) return;
      const layers = [...editorArea.layers];
      const [moved] = layers.splice(fromIdx, 1);
      layers.splice(toIdx, 0, moved!);
      const area: Area = { ...editorArea, layers };
      setBoard({
        ...board,
        areas: board.areas.map((a) => (a.id === editorArea.id ? area : a)),
      });
      try {
        await updateArea(boardId!, editorArea.id, { layers } as never);
      } catch { /* best-effort */ }
    },
    [board, editorArea, boardId, setBoard]
  );

  const handleEditorOpen = useCallback(
    (areaId: string, layerIdx = 0) => {
      selectArea(areaId);
      setEditorAreaId(areaId);
      setEditorLayerIndex(layerIdx);
    },
    [selectArea]
  );

  if (loading || !board) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--lb-bg-deep)' }}>
        <Spin size="large">
          <div style={{ color: 'var(--lb-text-secondary)', marginTop: 16 }}>加载画板中...</div>
        </Spin>
      </div>
    );
  }

  return (
    <Layout style={{ height: '100vh' }}>
      <Header
        style={{
          background: 'rgba(18, 18, 42, 0.85)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          height: 60,
          borderBottom: '1px solid rgba(124, 92, 252, 0.2)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
          zIndex: 20,
        }}
      >
        {/* Left: back + title */}
        <Space size={12}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/dashboard')}
            style={{ color: '#e8e8f0' }}
          />
          <span style={{ fontSize: 16, fontWeight: 600, color: '#e8e8f0' }}>
            🎨 {board.name}
          </span>
        </Space>

        {/* Center: search bar */}
        <SearchBar board={board} onNavigate={handleNavigate} />

        {/* Right: actions */}
        <Space size={8}>
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                {
                  key: 'group',
                  label: '新建小组',
                  icon: <TeamOutlined />,
                  onClick: () => setGroupModalOpen(true),
                },
                {
                  key: 'area',
                  label: '新建区域',
                  icon: <AppstoreOutlined />,
                  onClick: () => setAreaModalOpen(true),
                  disabled: (board.groups?.length ?? 0) === 0,
                },
              ],
            }}
          >
            <Button type="primary" icon={<PlusOutlined />} style={{ borderRadius: 8 }}>
              新建
            </Button>
          </Dropdown>

          {selectedAreaId && (
            <Tooltip title="层管理">
              <Button
                icon={<SettingOutlined />}
                onClick={() => {
                  setLayerManagerAreaId(selectedAreaId);
                  setLayerManagerOpen(true);
                }}
                style={{ borderRadius: 8 }}
              >
                层管理
              </Button>
            </Tooltip>
          )}

          <Tooltip title={viewMode === '2d' ? '切换到 3D 沙盘' : '切换到平面总览'}>
            <Button
              icon={<BlockOutlined />}
              onClick={() => {
                const next = viewMode === '2d' ? '3d' : '2d';
                setViewMode(next);
                setTransitioning(true);
              }}
              type={viewMode === '3d' ? 'primary' : 'default'}
              style={{ borderRadius: 8 }}
            >
              {viewMode === '2d' ? '3D 沙盘' : '平面总览'}
            </Button>
          </Tooltip>

          <Tooltip title="刷新">
            <Button icon={<ReloadOutlined />} onClick={fetchBoard} style={{ borderRadius: 8 }} />
          </Tooltip>

          <Dropdown
            menu={{
              items: [
                {
                  key: 'logout',
                  label: '退出登录',
                  icon: <LogoutOutlined />,
                  danger: true,
                  onClick: handleLogout,
                },
              ],
            }}
          >
            <Button type="text" icon={<UserOutlined />} shape="circle" />
          </Dropdown>
        </Space>
      </Header>

      <Content style={{ position: 'relative', overflow: 'hidden', background: 'var(--lb-canvas-bg)' }}>
        {renderedView === '2d' ? (
          <>
            <InfiniteCanvas
              board={board}
              selectedAreaId={selectedAreaId}
              selectedLayerIndex={selectedLayerIndex}
              onSelectArea={selectArea}
              onSelectLayer={selectLayer}
              onAreaDragEnd={handleAreaDragEnd}
              onUpdateLayer={handleUpdateLayer}
              onAddLayer={handleAddLayer}
            />
            {/* Empty hint */}
            {(board.areas?.length ?? 0) === 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  color: 'var(--lb-text-muted)',
                  pointerEvents: 'none',
                }}
              >
                <AppstoreOutlined style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }} />
                <div style={{ fontSize: 16 }}>点击右上角「新建」创建小组和区域</div>
                <div style={{ fontSize: 13, marginTop: 8 }}>先创建小组，再创建区域</div>
              </div>
            )}
          </>
        ) : (
          <ThreeViewer
            board={board}
            onBack={() => {
              setViewMode('2d');
              setTransitioning(true);
            }}
            onSelectArea={(areaId) => {
              handleEditorOpen(areaId, 0);
            }}
            onAddLayerToArea={(areaId) => {
              handleAddLayer(areaId);
              handleEditorOpen(areaId, (board?.areas.find((a) => a.id === areaId)?.layers.length ?? 1) - 1);
            }}
          />
        )}

        {/* 2D ↔ 3D transition overlay */}
        <ViewTransition
          active={transitioning}
          fromView={renderedView}
          toView={viewMode}
          onComplete={() => {
            setRenderedView(viewMode);
            setTransitioning(false);
          }}
        />
      </Content>

      {/* Create group modal */}
      <Modal
        title="新建小组"
        open={groupModalOpen}
        onOk={() => groupForm.submit()}
        onCancel={() => { setGroupModalOpen(false); groupForm.resetFields(); }}
        okText="创建"
        cancelText="取消"
      >
        <Form form={groupForm} layout="vertical" onFinish={handleCreateGroup} initialValues={{ color: GROUP_COLORS[0] }}>
          <Form.Item name="name" label="小组名称" rules={[{ required: true, message: '请输入小组名称' }]}>
            <Input placeholder="例如：设计组" size="large" />
          </Form.Item>
          <Form.Item name="color" label="小组标识色">
            <Space wrap>
              {GROUP_COLORS.map((c) => (
                <div
                  key={c}
                  onClick={() => groupForm.setFieldValue('color', c)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: c,
                    cursor: 'pointer',
                    border: groupForm.getFieldValue('color') === c ? '3px solid #2d3436' : '3px solid transparent',
                  }}
                />
              ))}
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Create area modal */}
      <Modal
        title="新建区域"
        open={areaModalOpen}
        onOk={() => areaForm.submit()}
        onCancel={() => { setAreaModalOpen(false); areaForm.resetFields(); }}
        okText="创建"
        cancelText="取消"
      >
        <Form form={areaForm} layout="vertical" onFinish={handleCreateArea}>
          <Form.Item name="name" label="区域名称" rules={[{ required: true, message: '请输入区域名称' }]}>
            <Input placeholder="例如：用户研究" size="large" />
          </Form.Item>
          <Form.Item name="groupId" label="所属小组" rules={[{ required: true, message: '请选择小组' }]}>
            <select
              style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #d9d9d9', fontSize: 14 }}
            >
              {(board.groups || []).map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Floating Editor */}
      {editorArea && editorLayer && (
        <FloatingEditor
          open={!!editorAreaId}
          areaName={editorArea.name}
          layer={editorLayer}
          onClose={() => { setEditorAreaId(null); }}
          onSave={(content) => handleUpdateLayer(editorArea.id, editorLayer.id, content)}
        />
      )}

      {/* Layer Manager */}
      {layerManagerAreaId && board && (
        <LayerManager
          open={layerManagerOpen}
          area={board.areas.find((a) => a.id === layerManagerAreaId)!}
          onClose={() => { setLayerManagerOpen(false); setLayerManagerAreaId(null); }}
          onLayerRenamed={handleLayerRenamed}
          onLayerDeleted={handleLayerDeleted}
          onLayerReorder={handleLayerReorder}
          onAddLayer={() => handleAddLayer(layerManagerAreaId)}
        />
      )}
    </Layout>
  );
}
