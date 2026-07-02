import { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, Button, Space, Tooltip, Input } from 'antd';
import {
  EditOutlined,
  TableOutlined,
  HighlightOutlined,
  UnorderedListOutlined,
  DeleteOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import type { Layer, StickyNote, TableWidget, DrawingData } from '@/types';
import { STICKY_COLORS } from '@/utils/constants';
import { uid } from '@/utils/helpers';

interface FloatingEditorProps {
  open: boolean;
  areaName: string;
  layer: Layer;
  onClose: () => void;
  onSave: (content: Layer['content']) => void;
}

type EditorMode = 'sticky' | 'table' | 'draw' | 'checklist';

export default function FloatingEditor({ open, areaName, layer, onClose, onSave }: FloatingEditorProps) {
  const [mode, setMode] = useState<EditorMode>('sticky');
  const [content, setContent] = useState<Layer['content']>(layer.content);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setContent(layer.content);
  }, [layer]);

  const autoSave = useCallback(
    (newContent: Layer['content']) => {
      setContent(newContent);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
        onSave(newContent);
      }, 1500);
    },
    [onSave]
  );

  const handleClose = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    onSave(content); // immediate save on close
    onClose();
  };

  // --- Sticky Notes ---
  const addStickyNote = () => {
    const color = STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)] ?? '#ffeaa7';
    const note: StickyNote = {
      id: uid(),
      position: { x: 20 + Math.random() * 100, y: 20 + Math.random() * 100 },
      size: { width: 180, height: 140 },
      content: '新便签',
      color,
      createdBy: '',
      createdAt: new Date().toISOString(),
    };
    autoSave({ ...content, stickyNotes: [...content.stickyNotes, note] });
  };

  const updateStickyNote = (id: string, text: string) => {
    autoSave({
      ...content,
      stickyNotes: content.stickyNotes.map((n) => (n.id === id ? { ...n, content: text } : n)),
    });
  };

  const deleteStickyNote = (id: string) => {
    autoSave({ ...content, stickyNotes: content.stickyNotes.filter((n) => n.id !== id) });
  };

  // --- Table ---
  const currentTable = content.tables[0] ?? null;

  const addTable = () => {
    const table: TableWidget = {
      id: uid(),
      position: { x: 10, y: 10 },
      size: { width: 400, height: 200 },
      columns: ['列 1', '列 2', '列 3'],
      rows: [['', '', ''], ['', '', ''], ['', '', '']],
    };
    autoSave({ ...content, tables: [table] });
  };

  const updateTableCell = (tableId: string, rowIdx: number, colIdx: number, value: string) => {
    autoSave({
      ...content,
      tables: content.tables.map((t) => {
        if (t.id !== tableId) return t;
        const newRows = t.rows.map((r, ri) => (ri === rowIdx ? r.map((c, ci) => (ci === colIdx ? value : c)) : r));
        return { ...t, rows: newRows };
      }),
    });
  };

  const updateColumnName = (tableId: string, colIdx: number, value: string) => {
    autoSave({
      ...content,
      tables: content.tables.map((t) => {
        if (t.id !== tableId) return t;
        const cols = [...t.columns];
        cols[colIdx] = value;
        return { ...t, columns: cols };
      }),
    });
  };

  const addTableRow = (tableId: string) => {
    autoSave({
      ...content,
      tables: content.tables.map((t) => {
        if (t.id !== tableId) return t;
        return { ...t, rows: [...t.rows, t.columns.map(() => '')] };
      }),
    });
  };

  const addTableColumn = (tableId: string) => {
    autoSave({
      ...content,
      tables: content.tables.map((t) => {
        if (t.id !== tableId) return t;
        return { ...t, columns: [...t.columns, `列 ${t.columns.length + 1}`], rows: t.rows.map((r) => [...r, '']) };
      }),
    });
  };

  // --- Drawing ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#7c5cfc');
  const [drawWidth, setDrawWidth] = useState(3);
  const [drawings, setDrawings] = useState<DrawingData[]>(content.drawings || []);

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = drawWidth;
    ctx.lineCap = 'round';
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDraw = () => setIsDrawing(false);
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const drawing: DrawingData = {
      id: uid(),
      position: { x: 0, y: 0 },
      strokes: [{ points: [{ x: 0, y: 0 }, { x: 0, y: 0 }], color: drawColor, width: drawWidth }],
    };
    setDrawings([...drawings, drawing]);
    autoSave({ ...content, drawings: [...drawings, drawing] });
  };

  // --- Checklist ---
  const [checklist, setChecklist] = useState<{ id: string; text: string; done: boolean }[]>(() => {
    // Extract from sticky notes content as checklists
    return [];
  });

  const addCheckItem = () => {
    setChecklist([...checklist, { id: uid(), text: '', done: false }]);
  };

  const toggleCheckItem = (id: string) => {
    setChecklist(checklist.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  };

  const updateCheckItem = (id: string, text: string) => {
    setChecklist(checklist.map((i) => (i.id === id ? { ...i, text } : i)));
  };

  // Mode tabs
  const modes: { key: EditorMode; icon: React.ReactNode; label: string }[] = [
    { key: 'sticky', icon: <EditOutlined />, label: '便签' },
    { key: 'table', icon: <TableOutlined />, label: '表格' },
    { key: 'draw', icon: <HighlightOutlined />, label: '画笔' },
    { key: 'checklist', icon: <UnorderedListOutlined />, label: '清单' },
  ];

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      width={700}
      closable={false}
      styles={{
        content: {
          background: 'rgba(18,18,42,0.92)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(124,92,252,0.25)',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          padding: 0,
          overflow: 'hidden',
        },
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(124,92,252,0.2)' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>{areaName}</div>
          <div style={{ fontSize: 12, color: '#9a9ab8', marginTop: 2 }}>{layer.label} · 编辑中</div>
        </div>
        <Space>
          <Tooltip title="保存并关闭">
            <Button type="primary" size="small" icon={<SaveOutlined />} onClick={handleClose} style={{ borderRadius: 8 }}>
              保存
            </Button>
          </Tooltip>
        </Space>
      </div>

      {/* Mode Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '12px 20px', borderBottom: '1px solid rgba(124,92,252,0.1)' }}>
        {modes.map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 20,
              border: mode === m.key ? '1px solid rgba(124,92,252,0.5)' : '1px solid transparent',
              background: mode === m.key ? 'rgba(124,92,252,0.2)' : 'transparent',
              color: mode === m.key ? '#fff' : '#888',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{ padding: '20px', maxHeight: '55vh', overflow: 'auto' }}>
        {/* STICKY NOTES MODE */}
        {mode === 'sticky' && (
          <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#ccc' }}>📝 便签 ({content.stickyNotes.length})</span>
              <Button size="small" onClick={addStickyNote} icon={<EditOutlined />} style={{ borderRadius: 8 }}>
                添加便签
              </Button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {content.stickyNotes.map((note) => (
                <div
                  key={note.id}
                  style={{
                    background: note.color + '22',
                    border: `1.5px solid ${note.color}55`,
                    borderRadius: 10,
                    padding: 12,
                    width: 200,
                    minHeight: 120,
                    position: 'relative',
                  }}
                >
                  <Input.TextArea
                    value={note.content}
                    onChange={(e) => updateStickyNote(note.id, e.target.value)}
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    style={{ background: 'transparent', border: 'none', color: '#e8e8f0', resize: 'none', padding: 0 }}
                  />
                  <Tooltip title="删除">
                    <DeleteOutlined
                      onClick={() => deleteStickyNote(note.id)}
                      style={{ position: 'absolute', top: 8, right: 8, color: '#666', cursor: 'pointer', fontSize: 12 }}
                    />
                  </Tooltip>
                  <div style={{ fontSize: 10, color: '#555', marginTop: 8 }}>
                    {new Date(note.createdAt).toLocaleString('zh-CN')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TABLE MODE */}
        {mode === 'table' && (
          <div>
            {!currentTable ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Button type="primary" onClick={addTable} icon={<TableOutlined />} style={{ borderRadius: 8 }}>
                  创建表格
                </Button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      {currentTable.columns.map((col, ci) => (
                        <th key={ci} style={{ border: '1px solid rgba(124,92,252,0.2)', padding: 8, background: 'rgba(124,92,252,0.15)' }}>
                          <Input
                            value={col}
                            onChange={(e) => updateColumnName(currentTable.id, ci, e.target.value)}
                            size="small"
                            style={{ background: 'transparent', border: 'none', color: '#e8e8f0', fontWeight: 600 }}
                          />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentTable.rows.map((row, ri) => (
                      <tr key={ri}>
                        {row.map((cell, ci) => (
                          <td key={ci} style={{ border: '1px solid rgba(124,92,252,0.1)', padding: 4 }}>
                            <Input
                              value={cell}
                              onChange={(e) => updateTableCell(currentTable.id, ri, ci, e.target.value)}
                              size="small"
                              style={{ background: 'transparent', border: 'none', color: '#ddd' }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Space style={{ marginTop: 12 }}>
                  <Button size="small" onClick={() => addTableRow(currentTable.id)} style={{ borderRadius: 6 }}>+ 行</Button>
                  <Button size="small" onClick={() => addTableColumn(currentTable.id)} style={{ borderRadius: 6 }}>+ 列</Button>
                </Space>
              </div>
            )}
          </div>
        )}

        {/* DRAW MODE */}
        {mode === 'draw' && (
          <div>
            <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {['#7c5cfc', '#ff6b6b', '#51cf66', '#ffd43b', '#74c0fc', '#fff'].map((c) => (
                <div
                  key={c}
                  onClick={() => setDrawColor(c)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: c,
                    cursor: 'pointer',
                    border: drawColor === c ? '3px solid #fff' : '3px solid transparent',
                    boxShadow: drawColor === c ? '0 0 12px rgba(124,92,252,0.5)' : 'none',
                  }}
                />
              ))}
              <div style={{ marginLeft: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: '#888' }}>粗细</span>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={drawWidth}
                  onChange={(e) => setDrawWidth(Number(e.target.value))}
                />
                <span style={{ fontSize: 12, color: '#888' }}>{drawWidth}px</span>
              </div>
              <Button size="small" onClick={clearCanvas} style={{ borderRadius: 6 }}>清空画布</Button>
            </div>
            <canvas
              ref={canvasRef}
              width={600}
              height={350}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(124,92,252,0.2)',
                borderRadius: 10,
                cursor: 'crosshair',
                width: '100%',
                height: 350,
              }}
            />
          </div>
        )}

        {/* CHECKLIST MODE */}
        {mode === 'checklist' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Button size="small" onClick={addCheckItem} icon={<UnorderedListOutlined />} style={{ borderRadius: 8 }}>
                添加条目
              </Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {checklist.map((item) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleCheckItem(item.id)}
                    style={{ width: 18, height: 18, accentColor: '#7c5cfc' }}
                  />
                  <Input
                    value={item.text}
                    onChange={(e) => updateCheckItem(item.id, e.target.value)}
                    placeholder="输入清单条目..."
                    size="small"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: item.done ? '#555' : '#e8e8f0',
                      textDecoration: item.done ? 'line-through' : 'none',
                      flex: 1,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}