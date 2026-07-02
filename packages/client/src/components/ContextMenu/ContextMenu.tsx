import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  EditOutlined,
  SettingOutlined,
  EditFilled,
  DeleteOutlined,
  SwapOutlined,
  PlusOutlined,
  ReloadOutlined,
  CompressOutlined,
} from '@ant-design/icons';

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  type: 'area' | 'canvas';
  areaId?: string;
  areaName?: string;
}

export interface ContextMenuAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
  onClick: () => void;
}

interface ContextMenuProps {
  state: ContextMenuState;
  actions: ContextMenuAction[];
  onClose: () => void;
}

export default function ContextMenu({ state, actions, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState({ x: state.x, y: state.y });

  const adjustPosition = useCallback(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    let adjX = state.x;
    let adjY = state.y;

    if (adjX + rect.width > window.innerWidth) {
      adjX = window.innerWidth - rect.width - 8;
    }
    if (adjY + rect.height > window.innerHeight) {
      adjY = window.innerHeight - rect.height - 8;
    }
    if (adjX < 0) adjX = 8;
    if (adjY < 0) adjY = 8;

    setAdjustedPos({ x: adjX, y: adjY });
  }, [state.x, state.y]);

  useEffect(() => {
    setAdjustedPos({ x: state.x, y: state.y });
    requestAnimationFrame(adjustPosition);
  }, [state.x, state.y, adjustPosition]);

  // Close on click outside
  useEffect(() => {
    if (!state.visible) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    // Delay to avoid the right-click event itself triggering close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleEsc);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [state.visible, onClose]);

  if (!state.visible || actions.length === 0) return null;

  return (
    <>
      {/* Backdrop to catch clicks */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
        }}
        onClick={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      />
      <div
        ref={menuRef}
        className="context-menu"
        style={{
          position: 'fixed',
          left: adjustedPos.x,
          top: adjustedPos.y,
          zIndex: 9999,
          minWidth: 180,
          background: 'rgba(18, 18, 42, 0.95)',
          backdropFilter: 'blur(24px)',
          borderRadius: 12,
          border: '1px solid rgba(124, 92, 252, 0.3)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 24px rgba(124,92,252,0.15)',
          padding: '6px 0',
          animation: 'ctxMenuIn 0.15s ease-out',
        }}
      >
        {/* Header */}
        {state.type === 'area' && state.areaName && (
          <div
            style={{
              padding: '6px 16px',
              fontSize: 12,
              color: 'var(--lb-text-muted)',
              borderBottom: '1px solid rgba(124,92,252,0.15)',
              marginBottom: 4,
            }}
          >
            {state.areaName}
          </div>
        )}
        {/* Menu items */}
        {actions.map((action) => (
          <div
            key={action.key}
            className="context-menu-item"
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
              onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              cursor: 'pointer',
              fontSize: 14,
              color: action.danger ? '#ff6b6b' : 'var(--lb-text-primary)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = action.danger
                ? 'rgba(255,107,107,0.12)'
                : 'rgba(124,92,252,0.12)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            <span style={{ fontSize: 16, width: 20, textAlign: 'center', flexShrink: 0 }}>
              {action.icon}
            </span>
            <span>{action.label}</span>
          </div>
        ))}
        <style>{`
          @keyframes ctxMenuIn {
            from { opacity: 0; transform: scale(0.92); }
            to   { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    </>
  );
}
