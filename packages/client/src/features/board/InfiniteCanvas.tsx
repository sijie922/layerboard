import { useMemo } from 'react';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';
import type { Board, Area, Layer as TLayer } from '@/types';
import { useCanvasStage } from '@/hooks/useCanvasStage';
import { useCameraAnimation } from '@/hooks/useCameraAnimation';
import { AREA_SPACING } from '@/utils/constants';
import AreaCard from './AreaCard';
import NavigationArrows from './NavigationArrows';

interface InfiniteCanvasProps {
  board: Board;
  selectedAreaId: string | null;
  selectedLayerIndex: number;
  onSelectArea: (id: string | null) => void;
  onSelectLayer: (index: number) => void;
  onAreaDragEnd: (areaId: string, pos: { x: number; y: number }) => void;
  onUpdateLayer: (areaId: string, layerId: string, content: TLayer['content']) => void;
  onAddLayer: (areaId: string) => void;
}

export default function InfiniteCanvas({
  board,
  selectedAreaId,
  selectedLayerIndex,
  onSelectArea,
  onSelectLayer,
  onAreaDragEnd,
  onUpdateLayer,
  onAddLayer,
}: InfiniteCanvasProps) {
  const {
    stageRef,
    containerRef,
    viewport,
    size,
    handleWheel,
    handleDragEnd,
    setViewport,
    zoomIn,
    zoomOut,
    resetZoom,
  } = useCanvasStage();

  const { flyToArea } = useCameraAnimation(stageRef, viewport, setViewport, size);

  const areas = board.areas || [];

  // Determine group info per area
  const groupInfo = useMemo(() => {
    const map: Record<string, { name: string; color: string }> = {};
    (board.groups || []).forEach((g) => {
      map[g.id] = { name: g.name, color: g.color };
    });
    return map;
  }, [board.groups]);

  const handleAreaSelect = (id: string) => onSelectArea(id);

  const handleAreaNavigate = (targetId: string) => {
    const area = areas.find((a) => a.id === targetId);
    if (area) {
      flyToArea(area.position.x, area.position.y, area.size.width, area.size.height);
      onSelectArea(targetId);
    }
  };

  return (
    <div
      ref={containerRef}
      className="canvas-container"
      style={{ width: '100%', height: '100%', position: 'relative', background: '#e8ecf1' }}
    >
      {/* Grid pattern background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle, #d0d5dd 1px, transparent 1px)',
          backgroundSize: `${24 * viewport.scale}px ${24 * viewport.scale}px`,
          backgroundPosition: `${viewport.x}px ${viewport.y}px`,
          opacity: 0.5,
          pointerEvents: 'none',
        }}
      />

      <Stage
        ref={stageRef as unknown as React.RefObject<Konva.Stage>}
        width={size.width}
        height={size.height}
        x={viewport.x}
        y={viewport.y}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
        draggable
        onWheel={handleWheel}
        onDragEnd={handleDragEnd}
        onClick={(e) => {
          // click on empty canvas deselects
          if (e.target === e.target.getStage()) {
            onSelectArea(null);
          }
        }}
      >
        <Layer>
          {/* Render all areas */}
          {areas.map((area: Area) => {
            const grp = groupInfo[area.groupId];
            return (
              <AreaCard
                key={area.id}
                area={area}
                scale={viewport.scale}
                isSelected={area.id === selectedAreaId}
                groupName={grp?.name}
                groupColor={grp?.color}
                layerIndex={selectedAreaId === area.id ? selectedLayerIndex : 0}
                onSelect={() => handleAreaSelect(area.id)}
                onDragEnd={(pos) => onAreaDragEnd(area.id, pos)}
                onUpdateLayer={(layerId, content) => onUpdateLayer(area.id, layerId, content)}
                onAddLayer={() => onAddLayer(area.id)}
                onSelectLayer={(idx) => {
                  onSelectArea(area.id);
                  onSelectLayer(idx);
                }}
              />
            );
          })}

          {/* Navigation arrows around the selected area */}
          {selectedAreaId && (
            <NavigationArrows
              areas={areas}
              board={board}
              currentAreaId={selectedAreaId}
              scale={viewport.scale}
              onNavigate={handleAreaNavigate}
            />
          )}
        </Layer>
      </Stage>

      {/* Zoom controls */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 10,
        }}
      >
        <button className="zoom-btn" onClick={zoomIn} title="放大">＋</button>
        <button className="zoom-btn" onClick={zoomOut} title="缩小">－</button>
        <button className="zoom-btn" onClick={resetZoom} title="重置">⊙</button>
      </div>

      {/* Scale indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: 24,
          background: 'rgba(255,255,255,0.9)',
          padding: '4px 12px',
          borderRadius: 8,
          fontSize: 12,
          color: '#636e72',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          zIndex: 10,
        }}
      >
        {Math.round(viewport.scale * 100)}%
      </div>

      <style>{`
        .zoom-btn {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          border: 1px solid #e8e6ff;
          background: rgba(255,255,255,0.95);
          color: #6c5ce7;
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          transition: all 0.15s;
        }
        .zoom-btn:hover {
          background: #6c5ce7;
          color: #fff;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}

// Unused but exported for future area auto-layout
export function computeAreaPosition(index: number): { x: number; y: number } {
  return { x: (index % 4) * AREA_SPACING, y: Math.floor(index / 4) * AREA_SPACING };
}
