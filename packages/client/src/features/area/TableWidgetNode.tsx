import { useRef } from 'react';
import { Group, Rect, Text } from 'react-konva';
import type Konva from 'konva';
import type { TableWidget } from '@/types';
import { uid } from '@/utils/helpers';

interface TableWidgetNodeProps {
  table: TableWidget;
  scale: number;
  onUpdate: (table: TableWidget) => void;
  onDragEnd: (pos: { x: number; y: number }) => void;
}

const CELL_W = 90;
const CELL_H = 32;
const HEADER_BG = '#f1f0ff';
const BORDER = '#dfe6e9';
const TEXT_COLOR = '#2d3436';

/**
 * A canvas-rendered editable table. Double-click a cell to edit it.
 * Includes controls to add rows/columns.
 */
export default function TableWidgetNode({
  table,
  scale,
  onUpdate,
  onDragEnd,
}: TableWidgetNodeProps) {
  const groupRef = useRef<Konva.Group>(null);

  const colCount = Math.max(table.columns.length, 1);
  const rowCount = table.rows.length + 1; // +1 for header
  const tableWidth = colCount * CELL_W;
  const tableHeight = rowCount * CELL_H;

  // Public API for editing cells (used by future double-click handler)
  const updateCell = (row: number, col: number, value: string) => {
    if (row === 0) {
      const columns = [...table.columns];
      columns[col] = value;
      onUpdate({ ...table, columns });
    } else {
      const rows = table.rows.map((r) => [...r]);
      const target = rows[row - 1];
      if (target) target[col] = value;
      onUpdate({ ...table, rows });
    }
  };
  void updateCell;

  const addRow = () => {
    const newRow = new Array(colCount).fill('');
    onUpdate({ ...table, rows: [...table.rows, newRow] });
  };

  const addColumn = () => {
    onUpdate({
      ...table,
      columns: [...table.columns, `列${table.columns.length + 1}`],
      rows: table.rows.map((r) => [...r, '']),
    });
  };

  return (
    <Group
      ref={groupRef}
      x={table.position.x}
      y={table.position.y}
      draggable
      onDragEnd={(e) => onDragEnd({ x: e.target.x(), y: e.target.y() })}
    >
      {/* Table background */}
      <Rect
        width={tableWidth}
        height={tableHeight}
        fill="#ffffff"
        cornerRadius={4}
        shadowColor="rgba(0,0,0,0.1)"
        shadowBlur={6}
        shadowOpacity={0.3}
        shadowOffsetY={2}
      />

      {/* Header row */}
      {table.columns.map((col, colIdx) => (
        <Group key={`h-${colIdx}`}>
          <Rect
            x={colIdx * CELL_W}
            y={0}
            width={CELL_W}
            height={CELL_H}
            fill={HEADER_BG}
            stroke={BORDER}
            strokeWidth={0.5}
          />
          <Text
            x={colIdx * CELL_W + 6}
            y={0}
            width={CELL_W - 12}
            height={CELL_H}
            text={col}
            fontSize={12}
            fontStyle="bold"
            fill={TEXT_COLOR}
            align="left"
            verticalAlign="middle"
            ellipsis
          />
        </Group>
      ))}

      {/* Data rows */}
      {table.rows.map((row, rowIdx) => (
        <Group key={`r-${rowIdx}`} y={(rowIdx + 1) * CELL_H}>
          {row.slice(0, colCount).map((cell, colIdx) => (
            <Group key={`c-${rowIdx}-${colIdx}`}>
              <Rect
                x={colIdx * CELL_W}
                y={0}
                width={CELL_W}
                height={CELL_H}
                fill="#ffffff"
                stroke={BORDER}
                strokeWidth={0.5}
              />
              <Text
                x={colIdx * CELL_W + 6}
                y={0}
                width={CELL_W - 12}
                height={CELL_H}
                text={cell}
                fontSize={12}
                fill={TEXT_COLOR}
                align="left"
                verticalAlign="middle"
                ellipsis
              />
            </Group>
          ))}
        </Group>
      ))}

      {/* Outer border */}
      <Rect
        width={tableWidth}
        height={tableHeight}
        stroke="#a29bfe"
        strokeWidth={1}
        cornerRadius={4}
        listening={false}
      />

      {/* Add row button (only visible when zoomed in) */}
      {scale > 0.5 && (
        <Group y={tableHeight + 4} onClick={addRow}>
          <Rect width={CELL_W * colCount} height={20} fill="#f8f7ff" stroke={BORDER} strokeWidth={0.5} cornerRadius={4} />
          <Text
            text="＋ 添加行"
            width={CELL_W * colCount}
            height={20}
            align="center"
            verticalAlign="middle"
            fontSize={11}
            fill="#6C5CE7"
          />
        </Group>
      )}
      {scale > 0.5 && (
        <Group x={tableWidth + 4} onClick={addColumn}>
          <Rect width={50} height={CELL_H} fill="#f8f7ff" stroke={BORDER} strokeWidth={0.5} cornerRadius={4} />
          <Text
            text="＋ 列"
            width={50}
            height={CELL_H}
            align="center"
            verticalAlign="middle"
            fontSize={11}
            fill="#6C5CE7"
          />
        </Group>
      )}
    </Group>
  );
}

// Factory: create a default 3x3 empty table
export function createDefaultTable(x: number, y: number): TableWidget {
  const cols = ['列1', '列2', '列3'];
  const rows = [
    ['', '', ''],
    ['', '', ''],
    ['', '', ''],
  ];
  return {
    id: uid(),
    position: { x, y },
    size: { width: cols.length * CELL_W, height: (rows.length + 1) * CELL_H },
    columns: cols,
    rows,
  };
}
