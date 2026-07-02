import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { Board, Area } from '@/types';
import { AREA_DEFAULTS } from '@/utils/constants';

interface ThreeViewerProps {
  board: Board;
  onBack: () => void;
  onSelectArea?: (areaId: string) => void;
  onAddLayerToArea?: (areaId: string) => void;
}

const LAYER_GAP = 40;
const AREA_GAP_X = 620;
const AREA_GAP_Y = 520;

export default function ThreeViewer({ board, onBack, onSelectArea, onAddLayerToArea }: ThreeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<CSS3DRenderer | null>(null);
  const webglRendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const areas = board.areas || [];

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Dark background
    const bgColor = new THREE.Color(0x0d0d24);
    scene.background = bgColor;
    scene.fog = new THREE.Fog(0x0d0d24, 500, 5000);

    // Camera — auto position based on area count
    const camera = new THREE.PerspectiveCamera(55, width / height, 1, 6000);
    const count = Math.max(areas.length, 1);
    const dist = 600 + count * 120;
    camera.position.set(0, dist * 0.45, dist);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // WebGL renderer for ground & particles
    const wglRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    wglRenderer.setSize(width, height);
    wglRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    wglRenderer.domElement.style.position = 'absolute';
    wglRenderer.domElement.style.top = '0';
    wglRenderer.domElement.style.left = '0';
    wglRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(wglRenderer.domElement);
    webglRendererRef.current = wglRenderer;

    // CSS3D renderer for area cards
    const renderer = new CSS3DRenderer();
    renderer.setSize(width, height);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- Ground grid ---
    const gridHelper = new THREE.PolarGridHelper(2000, 48, 32, 64, 0x7c5cfc, 0x7c5cfc);
    (gridHelper.material as THREE.Material).opacity = 0.15;
    (gridHelper.material as THREE.Material).transparent = true;
    scene.add(gridHelper);

    // Ambient glow on ground
    const glowGeo = new THREE.PlaneGeometry(4000, 4000);
    const glowMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0x7c5cfc) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform vec3 uColor;
        void main() {
          float d = length(vUv - 0.5) * 2.0;
          float alpha = smoothstep(1.0, 0.0, d) * 0.12;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
    });
    const glowPlane = new THREE.Mesh(glowGeo, glowMat);
    glowPlane.rotation.x = -Math.PI / 2;
    glowPlane.position.y = -2;
    scene.add(glowPlane);

    // Floating particles
    const particlesGeo = new THREE.BufferGeometry();
    const particlesCount = 200;
    const posArray = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 3000;
      posArray[i + 1] = Math.random() * 500 - 100;
      posArray[i + 2] = (Math.random() - 0.5) * 3000;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({
      size: 3,
      color: 0x7c5cfc,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
    });
    const particles = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particles);

    // --- Build area cards ---
    const cols = Math.ceil(Math.sqrt(areas.length));
    areas.forEach((area: Area, areaIdx: number) => {
      const col = areaIdx % cols;
      const row = Math.floor(areaIdx / cols);
      const rows = Math.ceil(areas.length / cols);
      const baseX = (col - (cols - 1) / 2) * AREA_GAP_X;
      const baseY = (row - (rows - 1) / 2) * AREA_GAP_Y;

      const group = board.groups.find((g) => g.id === area.groupId);
      const groupColor = group?.color ?? '#7c5cfc';
      const groupName = group?.name ?? '';

      area.layers.forEach((layer, layerIdx) => {
        const cardEl = document.createElement('div');
        cardEl.style.width = `${AREA_DEFAULTS.WIDTH}px`;
        cardEl.style.height = `${AREA_DEFAULTS.HEIGHT}px`;
        cardEl.style.borderRadius = '14px';
        cardEl.style.background = 'rgba(22,22,52,0.92)';
        cardEl.style.backdropFilter = 'blur(8px)';
        cardEl.style.border = `1.5px solid ${groupColor}55`;
        cardEl.style.boxShadow =
          layerIdx === 0
            ? `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${groupColor}22`
            : `0 4px 16px rgba(0,0,0,0.4)`;
        cardEl.style.overflow = 'hidden';
        cardEl.style.fontFamily = '-apple-system, "PingFang SC", sans-serif';
        cardEl.style.cursor = 'pointer';
        cardEl.style.transition = 'box-shadow 0.25s, border-color 0.25s';
        cardEl.dataset.areaId = area.id;

        cardEl.addEventListener('mouseenter', () => {
          cardEl.style.boxShadow = `0 12px 48px rgba(0,0,0,0.6), 0 0 32px ${groupColor}55`;
          cardEl.style.border = `1.5px solid ${groupColor}88`;
        });
        cardEl.addEventListener('mouseleave', () => {
          cardEl.style.boxShadow =
            layerIdx === 0
              ? `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${groupColor}22`
              : `0 4px 16px rgba(0,0,0,0.4)`;
          cardEl.style.border = `1.5px solid ${groupColor}55`;
        });
        cardEl.addEventListener('click', () => {
          onSelectArea?.(area.id);
        });

        // Layer tab indicator at top
        const layerCount = area.layers.length;

        cardEl.innerHTML = `
          <div style="background:linear-gradient(135deg, ${groupColor}, ${groupColor}cc);height:48px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;">
            <div>
              <span style="color:#fff;font-weight:700;font-size:16px;">${escapeHtml(area.name)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="background:rgba(255,255,255,0.2);color:#fff;font-size:11px;padding:2px 8px;border-radius:10px;">${escapeHtml(groupName)}</span>
              <span style="background:rgba(0,0,0,0.2);color:#fff;font-size:11px;padding:2px 8px;border-radius:10px;">${layerCount}层</span>
            </div>
          </div>
          <!-- Layer tab strip -->
          <div style="display:flex;gap:4px;padding:8px 12px;background:rgba(0,0,0,0.2);border-bottom:1px solid ${groupColor}22;">
            ${area.layers.map((l, i) => `
              <span style="
                background:${i === layerIdx
                  ? `${groupColor}44`
                  : 'rgba(255,255,255,0.05)'};
                color:${i === layerIdx ? '#fff' : '#999'};
                font-size:11px;
                padding:3px 10px;
                border-radius:6px 6px 0 0;
                white-space:nowrap;
                border:1px solid ${i === layerIdx ? groupColor : 'transparent'};
                border-bottom:none;
              ">📑 ${escapeHtml(l.label)}</span>
            `).join('')}
          </div>
          <div style="padding:14px;height:calc(100% - 88px);overflow:hidden;color:#bbb;font-size:12px;">
            ${renderLayerPreview(layer.content)}
          </div>
        `;

        const obj = new CSS3DObject(cardEl);
        obj.position.set(baseX, -baseY, layerIdx * LAYER_GAP);
        obj.rotation.x = -0.08;
        obj.userData = { areaId: area.id, layerIdx };
        scene.add(obj);
      });

      // Add a "+" button for adding layers to this area
      if (area.layers.length > 0) {
        const plusEl = document.createElement('div');
        plusEl.style.width = '40px';
        plusEl.style.height = '40px';
        plusEl.style.borderRadius = '50%';
        plusEl.style.background = 'rgba(124,92,252,0.4)';
        plusEl.style.backdropFilter = 'blur(8px)';
        plusEl.style.border = '2px solid rgba(124,92,252,0.6)';
        plusEl.style.color = '#fff';
        plusEl.style.display = 'flex';
        plusEl.style.alignItems = 'center';
        plusEl.style.justifyContent = 'center';
        plusEl.style.fontSize = '22px';
        plusEl.style.fontWeight = 'bold';
        plusEl.style.cursor = 'pointer';
        plusEl.style.transition = 'all 0.2s';
        plusEl.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)';
        plusEl.textContent = '+';
        plusEl.addEventListener('mouseenter', () => {
          plusEl.style.background = 'rgba(124,92,252,0.7)';
          plusEl.style.transform = 'scale(1.15)';
        });
        plusEl.addEventListener('mouseleave', () => {
          plusEl.style.background = 'rgba(124,92,252,0.4)';
          plusEl.style.transform = 'scale(1)';
        });
        plusEl.addEventListener('click', (e) => {
          e.stopPropagation();
          onAddLayerToArea?.(area.id);
        });

        const plusObj = new CSS3DObject(plusEl);
        const topLayerZ = (area.layers.length - 1) * LAYER_GAP;
        plusObj.position.set(baseX + AREA_DEFAULTS.WIDTH / 2 + 30, -baseY - AREA_DEFAULTS.HEIGHT / 2 + 40, topLayerZ);
        plusObj.userData = { isPlusBtn: true, areaId: area.id };
        scene.add(plusObj);
      }
    });

    // Direction arrows between nearby areas
    areas.forEach((area, i) => {
      const group = board.groups.find((g) => g.id === area.groupId);
      const color = group?.color ?? '#7c5cfc';

      areas.forEach((_other, j) => {
        if (i >= j) return; // avoid duplicates and self
        const col = i % cols;
        const row = Math.floor(i / cols);
        const rows = Math.ceil(areas.length / cols);
        const baseXi = (col - (cols - 1) / 2) * AREA_GAP_X;
        const baseYi = (row - (rows - 1) / 2) * AREA_GAP_Y;
        const col2 = j % cols;
        const row2 = Math.floor(j / cols);
        const baseXj = (col2 - (cols - 1) / 2) * AREA_GAP_X;
        const baseYj = (row2 - (rows - 1) / 2) * AREA_GAP_Y;

        const dx = baseXj - baseXi;
        const dy = baseYj - baseYi;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Only show arrows for nearby areas (within 2 grid cells)
        if (dist > AREA_GAP_X * 2.5) return;

        const midX = (baseXi + baseXj) / 2;
        const midY = (baseYi + baseYj) / 2;
        const arrowEl = document.createElement('div');
        const alpha = Math.max(0.15, 1 - dist / (AREA_GAP_X * 2.5));
        arrowEl.style.color = `${color}`;
        arrowEl.style.fontSize = '18px';
        arrowEl.style.opacity = String(alpha);
        arrowEl.style.textShadow = '0 0 8px rgba(0,0,0,0.5)';
        arrowEl.style.pointerEvents = 'none';
        arrowEl.textContent = '▸';

        const arrowObj = new CSS3DObject(arrowEl);
        const angle = Math.atan2(-dy, dx);
        arrowObj.position.set(midX, -midY, 0);
        arrowObj.rotation.z = angle - Math.PI / 2;
        arrowObj.userData = { isArrow: true };
        scene.add(arrowObj);
      });
    });

    // Animation loop
    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      // Subtle particle drift
      particles.rotation.y += 0.0002;
      // Render WebGL background first, then CSS3D on top
      wglRenderer.render(scene, camera);
      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current?.setSize(w, h);
      webglRendererRef.current?.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      if (wglRenderer.domElement.parentNode) {
        wglRenderer.domElement.parentNode.removeChild(wglRenderer.domElement);
      }
      wglRenderer.dispose();
    };
  }, [board, areas.length, onSelectArea, onAddLayerToArea]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        ref={containerRef}
        className="three-container"
        style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
      />
      {/* Top-left: back button */}
      <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 20 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          className="glass-btn"
          style={{ borderRadius: 10 }}
        >
          平面总览
        </Button>
      </div>
      {/* Bottom-center: hint */}
      <div
        className="glass-panel-sm"
        style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '8px 20px',
          fontSize: 12,
          color: 'var(--lb-text-secondary)',
          zIndex: 20,
        }}
      >
        🖱️ 拖拽平移 · 滚轮缩放 · 点击区域卡片编辑 · 点击 + 添加层
      </div>
    </div>
  );
}

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
  const notes = content.stickyNotes.slice(0, 4);
  if (notes.length > 0) {
    html += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;">';
    notes.forEach((n) => {
      html += `<div style="background:${n.color}33;border:1px solid ${n.color}55;padding:6px;border-radius:4px;font-size:11px;width:75px;height:55px;overflow:hidden;color:#ddd;">${escapeHtml(n.content.slice(0, 30))}</div>`;
    });
    html += '</div>';
  }
  if (content.tables.length > 0) {
    html += '<div style="font-size:11px;color:#9a9ab8;">📊 表格数据</div>';
  }
  if (content.drawings.length > 0) {
    html += `<div style="font-size:11px;color:#9a9ab8;">🎨 ${content.drawings.reduce((s, d) => s + d.strokes.length, 0)} 笔画</div>`;
  }
  if (!html) {
    html = '<div style="color:#444;font-size:13px;text-align:center;margin-top:30px;">（空层 · 点击编辑）</div>';
  }
  return html;
}