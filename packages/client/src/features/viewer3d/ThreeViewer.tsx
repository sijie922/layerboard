import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { Board, Area } from '@/types';
import { AREA_DEFAULTS } from '@/utils/constants';

interface ThreeViewerProps {
  board: Board;
  onBack: () => void;
  onSelectArea?: (areaId: string) => void;
}

const LAYER_GAP = 60; // px depth between layers
const AREA_GAP_X = 560; // horizontal spacing between areas
const AREA_GAP_Y = 480; // vertical spacing

export default function ThreeViewer({ board, onBack }: ThreeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<CSS3DRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe8ecf1);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 5000);
    camera.position.set(0, 400, 900);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer (CSS3D for HTML content)
    const renderer = new CSS3DRenderer();
    renderer.setSize(width, height);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.6;
    controls.minDistance = 200;
    controls.maxDistance = 3000;
    controlsRef.current = controls;

    // Build layer cards for every area
    const areas = board.areas || [];
    areas.forEach((area: Area, areaIdx: number) => {
      // Arrange areas in a grid
      const cols = Math.ceil(Math.sqrt(areas.length));
      const col = areaIdx % cols;
      const row = Math.floor(areaIdx / cols);
      const baseX = (col - (cols - 1) / 2) * AREA_GAP_X;
      const baseY = (row - (Math.ceil(areas.length / cols) - 1) / 2) * AREA_GAP_Y;

      const group = board.groups.find((g) => g.id === area.groupId);
      const groupColor = group?.color ?? '#6C5CE7';
      const groupName = group?.name ?? '';

      // Build a layer card for each layer, stacked along Z
      area.layers.forEach((layer, layerIdx) => {
        const cardEl = document.createElement('div');
        cardEl.style.width = `${AREA_DEFAULTS.WIDTH}px`;
        cardEl.style.height = `${AREA_DEFAULTS.HEIGHT}px`;
        cardEl.style.borderRadius = '12px';
        cardEl.style.boxShadow = '0 12px 40px rgba(108,92,231,0.25)';
        cardEl.style.background = '#fff';
        cardEl.style.border = `1px solid ${groupColor}33`;
        cardEl.style.overflow = 'hidden';
        cardEl.style.fontFamily = '-apple-system, sans-serif';
        cardEl.style.cursor = 'pointer';

        cardEl.innerHTML = `
          <div style="background:${groupColor};height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;">
            <span style="color:#fff;font-weight:700;font-size:16px;">${escapeHtml(area.name)}</span>
            <span style="color:rgba(255,255,255,0.85);font-size:12px;">${escapeHtml(groupName)} · ${escapeHtml(layer.label)}</span>
          </div>
          <div style="padding:12px;height:calc(100% - 44px);overflow:hidden;">
            ${renderLayerPreview(layer.content)}
          </div>
        `;

        const obj = new CSS3DObject(cardEl);
        // stack layers along +Z; newest layer is on top (largest Z)
        obj.position.set(baseX, -baseY, layerIdx * LAYER_GAP);
        // subtle tilt for stereo effect
        obj.rotation.x = -0.12;
        scene.add(obj);
      });
    });

    // Animation loop
    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
      controls.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [board]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        ref={containerRef}
        className="three-container"
        style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
      />
      {/* Overlay controls */}
      <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack} style={{ borderRadius: 8 }}>
          返回 2D 画板
        </Button>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.92)',
          padding: '8px 16px',
          borderRadius: 8,
          fontSize: 12,
          color: '#636e72',
          zIndex: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        🖱️ 拖拽旋转 · 滚轮缩放 · 右键平移 · 层级从下到上依次堆叠
      </div>
    </div>
  );
}

// ---------- helpers ----------

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderLayerPreview(content: {
  stickyNotes: { content: string; color: string }[];
  tables: { columns: string[]; rows: string[][] }[];
  drawings: { strokes: { points: unknown[] }[] }[];
}): string {
  let html = '';
  // sticky notes preview
  const notes = content.stickyNotes.slice(0, 4);
  if (notes.length > 0) {
    html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;">';
    notes.forEach((n) => {
      html += `<div style="background:${n.color};padding:8px;border-radius:4px;font-size:11px;width:80px;height:60px;overflow:hidden;color:#2d3436;">${escapeHtml(n.content.slice(0, 40))}</div>`;
    });
    html += '</div>';
  }
  // table preview
  if (content.tables.length > 0) {
    const t = content.tables[0]!;
    html += '<div style="border:1px solid #e8e6ff;border-radius:4px;overflow:hidden;font-size:11px;">';
    html += '<table style="width:100%;border-collapse:collapse;"><thead><tr>';
    t.columns.slice(0, 3).forEach((c) => {
      html += `<th style="background:#f1f0ff;padding:4px;text-align:left;border:1px solid #e8e6ff;">${escapeHtml(c)}</th>`;
    });
    html += '</tr></thead><tbody>';
    t.rows.slice(0, 2).forEach((row) => {
      html += '<tr>';
      row.slice(0, 3).forEach((cell) => {
        html += `<td style="padding:4px;border:1px solid #e8e6ff;">${escapeHtml(cell)}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
  }
  if (content.drawings.length > 0) {
    html += `<div style="margin-top:6px;font-size:11px;color:#999;">🎨 ${content.drawings.reduce((s, d) => s + d.strokes.length, 0)} 条笔画</div>`;
  }
  if (!html) {
    html = '<div style="color:#ccc;font-size:13px;text-align:center;margin-top:40px;">（空层）</div>';
  }
  return html;
}
