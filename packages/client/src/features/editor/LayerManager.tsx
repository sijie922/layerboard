import { useState } from 'react';
import { Modal, Button, Input, Space, Tooltip, message } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  DragOutlined,
  PlusOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import type { Area } from '@/types';

interface LayerManagerProps {
  open: boolean;
  area: Area;
  onClose: () => void;
  onLayerRenamed: (layerId: string, newLabel: string) => void;
  onLayerDeleted: (layerId: string) => void;
  onLayerReorder: (fromIdx: number, toIdx: number) => void;
  onAddLayer: () => void;
}

export default function LayerManager({
  open,
  area,
  onClose,
  onLayerRenamed,
  onLayerDeleted,
  onLayerReorder,
  onAddLayer,
}: LayerManagerProps) {
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const startEdit = (layerId: string, currentLabel: string) => {
    setEditingLayerId(layerId);
    setEditValue(currentLabel);
  };

  const confirmEdit = (layerId: string) => {
    if (editValue.trim()) {
      onLayerRenamed(layerId, editValue.trim());
    }
    setEditingLayerId(null);
  };

  const handleDragStart = (idx: number) => {
    setDragIdx(idx);
  };

  const handleDrop = (targetIdx: number) => {
    if (dragIdx !== null && dragIdx !== targetIdx) {
      onLayerReorder(dragIdx, targetIdx);
    }
    setDragIdx(null);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={
        <span style={{ color: '#e8e8f0' }}>
          📑 {area.name} · 层管理
        </span>
      }
      width={460}
      styles={{
        content: {
          background: 'rgba(18,18,42,0.92)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(124,92,252,0.25)',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        },
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {area.layers.map((layer, idx) => (
          <div
            key={layer.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(idx)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: dragIdx === idx
                ? 'rgba(124,92,252,0.25)'
                : 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(124,92,252,0.15)',
              borderRadius: 10,
              transition: 'all 0.2s',
              cursor: 'grab',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <DragOutlined style={{ color: '#666', fontSize: 14 }} />
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: idx === 0 ? '#7c5cfc' : '#555',
                  flexShrink: 0,
                }}
              />
              {editingLayerId === layer.id ? (
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onPressEnter={() => confirmEdit(layer.id)}
                  onBlur={() => confirmEdit(layer.id)}
                  size="small"
                  autoFocus
                  style={{ width: 180, borderRadius: 6 }}
                />
              ) : (
                <span
                  style={{ color: '#ccc', fontSize: 13, fontWeight: 500 }}
                  onDoubleClick={() => startEdit(layer.id, layer.label)}
                >
                  {layer.label}
                </span>
              )}
              <span style={{ fontSize: 10, color: '#555' }}>
                {layer.content.stickyNotes.length} 便签 · {layer.content.tables.length} 表格
              </span>
            </div>

            <Space size={4}>
              {editingLayerId === layer.id ? (
                <Tooltip title="确认">
                  <Button
                    type="text"
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={() => confirmEdit(layer.id)}
                    style={{ color: '#7c5cfc' }}
                  />
                </Tooltip>
              ) : (
                <Tooltip title="重命名">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => startEdit(layer.id, layer.label)}
                    style={{ color: '#888' }}
                  />
                </Tooltip>
              )}
              <Tooltip title={area.layers.length <= 1 ? '不能删除最后一层' : '删除层'}>
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  disabled={area.layers.length <= 1}
                  onClick={() => {
                    if (area.layers.length <= 1) {
                      message.warning('至少保留一层');
                      return;
                    }
                    Modal.confirm({
                      title: '删除层',
                      content: `确定删除「${layer.label}」吗？`,
                      okText: '删除',
                      cancelText: '取消',
                      okType: 'danger',
                      onOk: () => onLayerDeleted(layer.id),
                    });
                  }}
                  style={{ color: '#ff6b6b' }}
                />
              </Tooltip>
            </Space>
          </div>
        ))}

        <Button
          block
          icon={<PlusOutlined />}
          onClick={onAddLayer}
          style={{
            borderRadius: 10,
            marginTop: 8,
            border: '1px dashed rgba(124,92,252,0.4)',
            background: 'rgba(124,92,252,0.08)',
            color: '#a78bfa',
            height: 44,
          }}
        >
          添加新层
        </Button>
      </div>
    </Modal>
  );
}