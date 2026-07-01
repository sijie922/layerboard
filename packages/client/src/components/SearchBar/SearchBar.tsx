import { useMemo, useState } from 'react';
import { Input, Select, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { Board, Group } from '@/types';

export type SearchScope = 'group' | 'member' | 'area';

export interface SearchResult {
  type: SearchScope;
  id: string;
  label: string;
  sublabel?: string;
  areaId?: string;
  areaX?: number;
  areaY?: number;
}

interface SearchBarProps {
  board: Board;
  onNavigate: (result: SearchResult) => void;
}

export default function SearchBar({ board, onNavigate }: SearchBarProps) {
  const [scope, setScope] = useState<SearchScope>('area');
  const [keyword, setKeyword] = useState('');

  const results = useMemo<SearchResult[]>(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return [];

    const memberNames: Record<string, string> = {};
    if (Array.isArray(board.members)) {
      board.members.forEach((m) => {
        if (typeof m === 'object' && m !== null) {
          memberNames[(m as { id?: string; _id?: string }).id ?? (m as { _id?: string })._id ?? ''] =
            (m as { username?: string }).username ?? '';
        }
      });
    }

    if (scope === 'group') {
      return (board.groups || [])
        .filter((g: Group) => g.name.toLowerCase().includes(kw))
        .map((g) => {
          const firstArea = (board.areas || []).find((a) => a.groupId === g.id);
          return {
            type: 'group' as const,
            id: g.id,
            label: g.name,
            sublabel: `${g.members.length} 位成员`,
            areaId: firstArea?.id,
            areaX: firstArea?.position.x,
            areaY: firstArea?.position.y,
          };
        });
    }

    if (scope === 'member') {
      const matched: SearchResult[] = [];
      for (const [mid, name] of Object.entries(memberNames)) {
        if (name.toLowerCase().includes(kw)) {
          const firstArea = (board.areas || []).find((a) => {
            const grp = (board.groups || []).find((g) => g.id === a.groupId);
            return grp?.members.includes(mid as never);
          });
          matched.push({
            type: 'member',
            id: mid,
            label: name,
            sublabel: firstArea ? `区域：${firstArea.name}` : undefined,
            areaId: firstArea?.id,
            areaX: firstArea?.position.x,
            areaY: firstArea?.position.y,
          });
        }
      }
      return matched;
    }

    // scope === 'area'
    return (board.areas || [])
      .filter((a) => a.name.toLowerCase().includes(kw))
      .map((a) => {
        const grp = (board.groups || []).find((g) => g.id === a.groupId);
        return {
          type: 'area' as const,
          id: a.id,
          label: a.name,
          sublabel: grp ? `小组：${grp.name}` : undefined,
          areaId: a.id,
          areaX: a.position.x,
          areaY: a.position.y,
        };
      });
  }, [board, scope, keyword]);

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', position: 'relative' }}>
      <Select
        value={scope}
        onChange={setScope}
        style={{ width: 96 }}
        options={[
          { value: 'group', label: '小组' },
          { value: 'member', label: '成员' },
          { value: 'area', label: '区域名' },
        ]}
        size="middle"
      />
      <Input
        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
        placeholder="搜索..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        style={{ width: 280, borderRadius: 8 }}
        allowClear
      />
      {results.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 104,
            width: 280,
            background: '#fff',
            borderRadius: 8,
            boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
            zIndex: 100,
            maxHeight: 320,
            overflow: 'auto',
          }}
        >
          {results.map((r) => (
            <div
              key={`${r.type}-${r.id}`}
              onClick={() => {
                onNavigate(r);
                setKeyword('');
              }}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                borderBottom: '1px solid #f5f5f5',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f8f7ff')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ fontWeight: 500, fontSize: 14 }}>{r.label}</div>
              {r.sublabel && (
                <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{r.sublabel}</div>
              )}
            </div>
          ))}
        </div>
      )}
      {keyword.trim() && results.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 104,
            width: 280,
            background: '#fff',
            borderRadius: 8,
            boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
            zIndex: 100,
            padding: 12,
          }}
        >
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="未找到匹配结果" />
        </div>
      )}
    </div>
  );
}
