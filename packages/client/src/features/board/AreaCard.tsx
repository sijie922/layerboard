import { useRef, useState } from 'react';
import { Group, Rect, Text } from 'react-konva';
import type Konva from 'konva';
import type { Area, Layer } from '@/types';
import { AREA_DEFAULTS, STICKY_COLORS } from '@/utils/constants';
import { uid } from '@/utils/helpers';
import dayjs from 'dayjs';
import { TIMESTAMP_FORMAT } from '@/utils/constants';

interface AreaCardProps {
  area: Area;
  scale: number;
  isSelected: boolean;
  groupName?: string;
  groupColor?: string;
  layerIndex: number;
  onSelect: () => void;
  onDragEnd: (newPos: { x: number; y: number }) => void;
  onUpdateLayer: (layerId: string, content: Layer['content']) => void;
  onAddLayer: () => void;
  onSelectLayer: (index: number) => void;
}

export default function AreaCard({
  area,
  scale,
  isSelected,
  groupName,
  groupColor,
  layerIndex,
  onSelect,
  onDragEnd,
  onUpdateLayer,
  onAddLayer,
  onSelectLayer,
}: AreaCardProps) {
  const groupRef = useRef<Konva.Group>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const currentLayer: Layer | undefined = area.layers[layerIndex];
  if (!currentLayer) return null;

  const { stickyNotes } = currentLayer.content;

  const addStickyNote = () => {
    const colorIdx = Math.floor(Math.random() * STICKY_COLORS.length);
    const newNote = {
      id: uid(),
      position: {
        x: 20 + Math.random() * 60,
        y: AREA_DEFAULTS.HEADER_HEIGHT + AREA_DEFAULTS.LAYER_TAB_HEIGHT + 20 + Math.random() * 40,
      },
      size: { width: 180, height: 140 },
      content: '双击编辑',
      color: (STICKY_COLORS[colorIdx] ?? '#ffeaa7') as string,
      createdBy: '',
      createdAt: new Date().toISOString(),
    };
    const newContent = {
      ...currentLayer.content,
      stickyNotes: [...stickyNotes, newNote],
      timestamps: [
        ...currentLayer.content.timestamps,
        {
          id: uid(),
          text: dayjs().format(TIMESTAMP_FORMAT),
          position: { x: area.size.width - 130, y: area.size.height - 20 },
          createdAt: new Date().toISOString(),
        },
      ],
    };
    onUpdateLayer(currentLayer.id, newContent);
    setEditingNoteId(newNote.id);
  };

  return (
    <Group
      ref={groupRef}
      name={`area-${area.id}`}
      x={area.position.x}
      y={area.position.y}
      draggable
      onDragStart={() => onSelect()}
      onDragEnd={(e) => {
        onDragEnd({ x: e.target.x(), y: e.target.y() });
      }}
      onClick={onSelect}
    >
      {/* Card background with shadow */}
      <Rect
        width={area.size.width}
        height={area.size.height}
        fill="#ffffff"
        cornerRadius={12}
        shadowColor="rgba(108, 92, 231, 0.18)"
        shadowBlur={isSelected ? 28 : 14}
        shadowOpacity={isSelected ? 0.5 : 0.3}
        shadowOffsetY={6}
        stroke={isSelected ? groupColor ?? '#6C5CE7' : '#e8e6ff'}
        strokeWidth={isSelected ? 2 : 1}
      />

      {/* Header bar */}
      <Rect
        width={area.size.width}
        height={AREA_DEFAULTS.HEADER_HEIGHT}
        fill={groupColor ?? '#6C5CE7'}
        cornerRadius={[12, 12, 0, 0]}
      />
      <Text
        text={area.name}
        x={16}
        y={0}
        width={area.size.width - 100}
        height={AREA_DEFAULTS.HEADER_HEIGHT}
        align="left"
        verticalAlign="middle"
        fontSize={16}
        fontStyle="bold"
        fill="#ffffff"
        ellipsis
      />
      <Text
        text={groupName ?? ''}
        x={area.size.width - 90}
        y={0}
        width={76}
        height={AREA_DEFAULTS.HEADER_HEIGHT}
        align="right"
        verticalAlign="middle"
        fontSize={12}
        fill="rgba(255,255,255,0.85)"
      />

      {/* Layer tabs (folder-tab style) */}
      {area.layers.map((layer, idx) => {
        const tabX = 16 + idx * 92;
        const tabY = AREA_DEFAULTS.HEADER_HEIGHT;
        const isActive = idx === layerIndex;
        return (
          <Group key={layer.id} x={tabX} y={tabY} onClick={() => onSelectLayer(idx)}>
            <Rect
              width={86}
              height={AREA_DEFAULTS.LAYER_TAB_HEIGHT}
              fill={isActive ? '#ffffff' : '#f1f0ff'}
              stroke={isActive ? '#a29bfe' : '#e8e6ff'}
              strokeWidth={1}
              cornerRadius={[8, 8, 0, 0]}
            />
            <Text
              text={layer.label}
              x={8}
              y={0}
              width={70}
              height={AREA_DEFAULTS.LAYER_TAB_HEIGHT}
              align="center"
              verticalAlign="middle"
              fontSize={12}
              fontStyle={isActive ? 'bold' : 'normal'}
              fill={isActive ? '#6C5CE7' : '#636e72'}
            />
          </Group>
        );
      })}

      {/* Add layer button (+) */}
      <Group
        x={16 + area.layers.length * 92}
        y={AREA_DEFAULTS.HEADER_HEIGHT}
        onClick={onAddLayer}
      >
        <Rect
          width={36}
          height={AREA_DEFAULTS.LAYER_TAB_HEIGHT}
          fill="#f8f7ff"
          stroke="#dfe6e9"
          strokeWidth={1}
          cornerRadius={[8, 8, 0, 0]}
        />
        <Text
          text="＋"
          x={0}
          y={0}
          width={36}
          height={AREA_DEFAULTS.LAYER_TAB_HEIGHT}
          align="center"
          verticalAlign="middle"
          fontSize={18}
          fill="#6C5CE7"
        />
      </Group>

      {/* Content area background */}
      <Rect
        y={AREA_DEFAULTS.HEADER_HEIGHT + AREA_DEFAULTS.LAYER_TAB_HEIGHT}
        width={area.size.width}
        height={area.size.height - AREA_DEFAULTS.HEADER_HEIGHT - AREA_DEFAULTS.LAYER_TAB_HEIGHT}
        fill="#faf9ff"
        cornerRadius={[0, 0, 12, 12]}
      />

      {/* Add sticky note button (only visible when zoomed in enough) */}
      {scale > 0.5 && (
        <Group
          x={area.size.width - 60}
          y={AREA_DEFAULTS.HEADER_HEIGHT + AREA_DEFAULTS.LAYER_TAB_HEIGHT + 12}
          onClick={addStickyNote}
        >
          <Rect width={44} height={28} fill="#6C5CE7" cornerRadius={6} />
          <Text
            text="便签"
            width={44}
            height={28}
            align="center"
            verticalAlign="middle"
            fontSize={12}
            fill="#fff"
          />
        </Group>
      )}

      {/* Render sticky notes for the current layer */}
      {stickyNotes.map((note) => (
        <Group
          key={note.id}
          x={note.position.x}
          y={note.position.y}
          draggable
        >
          <Rect
            width={note.size.width}
            height={note.size.height}
            fill={note.color}
            cornerRadius={6}
            shadowColor="rgba(0,0,0,0.12)"
            shadowBlur={6}
            shadowOpacity={0.4}
            shadowOffsetY={3}
          />
          <Text
            text={note.content}
            x={10}
            y={10}
            width={note.size.width - 20}
            height={note.size.height - 20}
            fontSize={14}
            fill="#2d3436"
            align="left"
            verticalAlign="top"
            wrap="word"
          />
          {editingNoteId === note.id && (
            <Text
              text="(双击内容外即可保存)"
              x={10}
              y={note.size.height - 22}
              width={note.size.width - 20}
              fontSize={10}
              fill="rgba(0,0,0,0.4)"
            />
          )}
        </Group>
      ))}

      {/* Timestamp watermark (bottom-right, semi-transparent) */}
      {currentLayer.content.timestamps.length > 0 && (
        <Text
          text={currentLayer.content.timestamps[currentLayer.content.timestamps.length - 1]?.text ?? ''}
          x={area.size.width - 150}
          y={area.size.height - 18}
          width={140}
          fontSize={11}
          fill="rgba(0,0,0,0.25)"
          align="right"
          fontStyle="italic"
        />
      )}
    </Group>
  );
}
