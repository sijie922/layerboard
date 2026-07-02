import api from './request';
import type { Board, Area, Position, Size } from '@/types';

export async function createBoard(name: string) {
  const res = await api.post<{ message: string; data: Board }>('/boards', { name });
  return res.data.data;
}

export async function getBoards() {
  const res = await api.get<{ data: Board[] }>('/boards');
  return res.data.data;
}

export async function getBoard(boardId: string) {
  const res = await api.get<{ data: Board }>(`/boards/${boardId}`);
  return res.data.data;
}

export async function deleteBoard(boardId: string) {
  await api.delete(`/boards/${boardId}`);
}

export async function addGroup(boardId: string, name: string, color: string) {
  const res = await api.post<{ data: Board }>(`/boards/${boardId}/groups`, { name, color });
  return res.data.data;
}

export async function addArea(
  boardId: string,
  data: {
    name: string;
    groupId: string;
    position: Position;
    size: Size;
  }
) {
  const res = await api.post<{ data: Board }>(`/boards/${boardId}/areas`, data);
  return res.data.data;
}

export async function updateArea(
  boardId: string,
  areaId: string,
  data: Partial<Pick<Area, 'name' | 'position' | 'size'>>
) {
  const res = await api.put<{ data: Board }>(`/boards/${boardId}/areas/${areaId}`, data);
  return res.data.data;
}

export async function addLayer(boardId: string, areaId: string, label?: string) {
  const res = await api.post<{ data: Board }>(`/boards/${boardId}/areas/${areaId}/layers`, {
    label,
  });
  return res.data.data;
}

export async function updateLayerContent(
  boardId: string,
  areaId: string,
  layerId: string,
  content: unknown
) {
  const res = await api.put<{ data: Board }>(
    `/boards/${boardId}/areas/${areaId}/layers/${layerId}`,
    content
  );
  return res.data.data;
}

// ---- deleteArea ----
export async function deleteArea(boardId: string, areaId: string) {
  const res = await api.delete<{ data: Board }>(`/boards/${boardId}/areas/${areaId}`);
  return res.data.data;
}

// ---- updateGroup ----
export async function updateGroup(
  boardId: string,
  groupId: string,
  data: { name?: string; color?: string }
) {
  const res = await api.put<{ data: Board }>(`/boards/${boardId}/groups/${groupId}`, data);
  return res.data.data;
}

// ---- deleteGroup ----
export async function deleteGroup(boardId: string, groupId: string) {
  const res = await api.delete<{ data: Board }>(`/boards/${boardId}/groups/${groupId}`);
  return res.data.data;
}
