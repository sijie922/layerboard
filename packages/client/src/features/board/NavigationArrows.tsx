import { useMemo } from 'react';
import { Group, Rect, Text, Line } from 'react-konva';
import type { Area, Board } from '@/types';

interface NavigationArrowsProps {
  areas: Area[];
  board: Board;
  currentAreaId: string | null;
  scale: number;
  onNavigate: (areaId: string) => void;
}

interface ArrowInfo {
  area: Area;
  label: string;
  color: string;
  // direction relative to current area
  dx: number;
  dy: number;
}

/**
 * Renders directional labels around the currently selected area so the user
 * can quickly fly to neighbouring areas. The labels fade in/out and are
 * positioned just outside the bounds of the focused area.
 */
export default function NavigationArrows({
  areas,
  board,
  currentAreaId,
  scale,
  onNavigate,
}: NavigationArrowsProps) {
  const current = areas.find((a) => a.id === currentAreaId);
  const arrows = useMemo<ArrowInfo[]>(() => {
    if (!current) return [];
    const cx = current.position.x + current.size.width / 2;
    const cy = current.position.y + current.size.height / 2;

    return areas
      .filter((a) => a.id !== currentAreaId)
      .map((a) => {
        const ax = a.position.x + a.size.width / 2;
        const ay = a.position.y + a.size.height / 2;
        const dx = ax - cx;
        const dy = ay - cy;
        const grp = board.groups.find((g) => g.id === a.groupId);
        return {
          area: a,
          label: a.name,
          color: grp?.color ?? '#6C5CE7',
          dx,
          dy,
        };
      });
  }, [areas, board, current, currentAreaId]);

  if (!current || arrows.length === 0) return null;

  const halfW = current.size.width / 2;
  const halfH = current.size.height / 2;
  const offset = 70 / scale; // distance from the card edge in world coords
  const labelW = 140 / scale;
  const labelH = 40 / scale;

  return (
    <Group>
      {arrows.map((info) => {
        // Determine which side to anchor the label on
        const absX = Math.abs(info.dx);
        const absY = Math.abs(info.dy);
        const isHorizontal = absX >= absY;
        // normalized direction for the connector arrow
        const len = Math.hypot(info.dx, info.dy) || 1;
        const nx = info.dx / len;
        const ny = info.dy / len;

        let lx: number;
        let ly: number;
        if (isHorizontal) {
          lx = info.dx > 0 ? current.position.x + current.size.width + offset : current.position.x - offset - labelW;
          ly = current.position.y + current.size.height / 2 - labelH / 2;
        } else {
          lx = current.position.x + current.size.width / 2 - labelW / 2;
          ly = info.dy > 0 ? current.position.y + current.size.height + offset : current.position.y - offset - labelH;
        }

        // Connector line start/end
        const startX = current.position.x + halfW + nx * (isHorizontal ? halfW + 6 : 0);
        const startY = current.position.y + halfH + ny * (isHorizontal ? 0 : halfH + 6);
        const endX = lx + labelW / 2;
        const endY = ly + labelH / 2;

        return (
          <Group key={info.area.id}>
            <Line
              points={[startX, startY, endX, endY]}
              stroke={info.color}
              strokeWidth={2 / scale}
              dash={[6 / scale, 4 / scale]}
              opacity={0.5}
              lineCap="round"
            />
            <Group
              x={lx}
              y={ly}
              onClick={() => onNavigate(info.area.id)}
            >
              <Rect
                width={labelW}
                height={labelH}
                fill="#ffffff"
                stroke={info.color}
                strokeWidth={2 / scale}
                cornerRadius={20 / scale}
                shadowColor="rgba(0,0,0,0.15)"
                shadowBlur={12 / scale}
                shadowOpacity={0.5}
                shadowOffsetY={4 / scale}
              />
              <Text
                text={info.label}
                width={labelW - 20 / scale}
                height={labelH}
                x={10 / scale}
                y={0}
                align="center"
                verticalAlign="middle"
                fontSize={13 / scale}
                fill={info.color}
                fontStyle="bold"
              />
              {/* arrow icon */}
              <Text
                text="›"
                x={info.dx > 0 && isHorizontal ? labelW - 18 / scale : 2 / scale}
                y={0}
                width={16 / scale}
                height={labelH}
                align="center"
                verticalAlign="middle"
                fontSize={18 / scale}
                fill={info.color}
                rotation={isHorizontal ? (info.dx > 0 ? 0 : 180) : info.dy > 0 ? 90 : -90}
              />
            </Group>
          </Group>
        );
      })}
    </Group>
  );
}
