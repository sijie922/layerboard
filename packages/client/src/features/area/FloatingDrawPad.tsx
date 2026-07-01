import { useRef, useState } from 'react';
import { Group, Rect, Line, Text } from 'react-konva';
import type Konva from 'konva';
import type { DrawingData, Stroke } from '@/types';
import { uid } from '@/utils/helpers';

interface FloatingDrawPadProps {
  drawing: DrawingData;
  scale: number;
  colors: string[];
  onUpdate: (drawing: DrawingData) => void;
  onDragEnd: (pos: { x: number; y: number }) => void;
}

const PAD_W = 280;
const PAD_H = 200;
const HEADER_H = 28;

/**
 * A floating, draggable mini-canvas for freehand drawing.
 * The user can pick a color and draw strokes directly on the pad surface.
 */
export default function FloatingDrawPad({
  drawing,
  scale,
  colors,
  onUpdate,
  onDragEnd,
}: FloatingDrawPadProps) {
  const groupRef = useRef<Konva.Group>(null);
  const surfaceRef = useRef<Konva.Group>(null);
  const [currentColor, setCurrentColor] = useState(colors[0] ?? '#2d3436');
  const [isDrawing, setIsDrawing] = useState(false);
  const currentPoints = useRef<number[]>([]);
  const localStrokes = useRef<Stroke[]>([...drawing.strokes]);

  // Convert pointer (screen) to local pad coords
  const getLocalPoint = (): { x: number; y: number } | null => {
    const group = groupRef.current;
    if (!group) return null;
    const pos = group.getRelativePointerPosition();
    if (!pos) return null;
    // clamp to pad surface
    const x = Math.max(HEADER_H ? 0 : 0, Math.min(PAD_W, pos.x));
    const y = Math.max(HEADER_H, Math.min(HEADER_H + PAD_H, pos.y));
    return { x, y: y - HEADER_H };
  };

  const handleMouseDown = () => {
    const p = getLocalPoint();
    if (!p) return;
    setIsDrawing(true);
    currentPoints.current = [p.x, p.y];
  };

  const handleMouseMove = () => {
    if (!isDrawing) return;
    const p = getLocalPoint();
    if (!p) return;
    currentPoints.current.push(p.x, p.y);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPoints.current.length >= 4) {
      const stroke: Stroke = {
        points: [],
        color: currentColor,
        width: 2,
      };
      for (let i = 0; i < currentPoints.current.length - 1; i += 2) {
        stroke.points.push({
          x: currentPoints.current[i]!,
          y: currentPoints.current[i + 1]!,
        });
      }
      localStrokes.current.push(stroke);
      onUpdate({ ...drawing, strokes: [...localStrokes.current] });
    }
    currentPoints.current = [];
  };

  // Flatten stored strokes into Konva points arrays
  const renderStrokes = () => {
    const lines = localStrokes.current.map((s, i) => {
      const flat: number[] = [];
      s.points.forEach((p) => {
        flat.push(p.x, p.y);
      });
      return (
        <Line
          key={i}
          points={flat}
          stroke={s.color}
          strokeWidth={s.width / scale}
          lineCap="round"
          lineJoin="round"
          tension={0.4}
        />
      );
    });

    // current in-progress stroke
    if (isDrawing && currentPoints.current.length >= 2) {
      lines.push(
        <Line
          key="current"
          points={currentPoints.current}
          stroke={currentColor}
          strokeWidth={2 / scale}
          lineCap="round"
          lineJoin="round"
          tension={0.4}
        />
      );
    }
    return lines;
  };

  const clearPad = () => {
    localStrokes.current = [];
    onUpdate({ ...drawing, strokes: [] });
  };

  return (
    <Group ref={groupRef} x={drawing.position.x} y={drawing.position.y}>
      {/* Drag handle / header */}
      <Group
        draggable
        onDragEnd={(e) => onDragEnd({ x: e.target.x(), y: e.target.y() })}
      >
        <Rect
          width={PAD_W}
          height={HEADER_H}
          fill="#2d3436"
          cornerRadius={[8, 8, 0, 0]}
        />
        <Text
          text="🎨 绘图板"
          x={10}
          y={0}
          height={HEADER_H}
          fontSize={12}
          fontStyle="bold"
          fill="#fff"
          verticalAlign="middle"
        />
        {/* clear button */}
        <Group x={PAD_W - 28} y={4} onClick={clearPad}>
          <Rect width={20} height={20} fill="rgba(255,255,255,0.2)" cornerRadius={4} />
          <Text
            text="✕"
            width={20}
            height={20}
            align="center"
            verticalAlign="middle"
            fontSize={11}
            fill="#fff"
          />
        </Group>
      </Group>

      {/* Drawing surface */}
      <Group
        ref={surfaceRef}
        y={HEADER_H}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <Rect width={PAD_W} height={PAD_H} fill="#ffffff" cornerRadius={[0, 0, 8, 8]} />

        {/* Color palette */}
        <Group y={PAD_H - 24}>
          <Rect width={PAD_W} height={24} fill="#faf9ff" cornerRadius={[0, 0, 8, 8]} />
          {colors.map((c, i) => (
            <Group
              key={c}
              x={8 + i * 22}
              y={4}
              onClick={() => setCurrentColor(c)}
            >
              <Rect
                width={16}
                height={16}
                fill={c}
                cornerRadius={4}
                stroke={currentColor === c ? '#2d3436' : 'transparent'}
                strokeWidth={2}
              />
            </Group>
          ))}
        </Group>

        {renderStrokes()}
      </Group>
    </Group>
  );
}

export function createDefaultDrawing(x: number, y: number): DrawingData {
  return {
    id: uid(),
    position: { x, y },
    strokes: [],
  };
}
