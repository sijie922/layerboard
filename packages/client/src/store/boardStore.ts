import { create } from 'zustand';
import type { Board, Area, Layer, Position } from '@/types';

interface BoardState {
  board: Board | null;
  selectedAreaId: string | null;
  selectedLayerIndex: number;
  cameraTarget: Position | null;

  // Board
  setBoard: (board: Board) => void;
  updateBoard: (board: Board) => void;
  clearBoard: () => void;

  // Areas
  addAreaLocal: (area: Area) => void;
  updateAreaLocal: (areaId: string, updates: Partial<Area>) => void;
  selectArea: (areaId: string | null) => void;

  // Layers
  addLayerLocal: (areaId: string, layer: Layer) => void;
  selectLayer: (index: number) => void;

  // Camera
  setCameraTarget: (target: Position | null) => void;
  clearCameraTarget: () => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  board: null,
  selectedAreaId: null,
  selectedLayerIndex: 0,
  cameraTarget: null,

  setBoard: (board) => set({ board }),

  updateBoard: (board) => set((state) => {
    if (state.board && state.board._id === board._id) {
      return { board };
    }
    return {};
  }),

  clearBoard: () =>
    set({
      board: null,
      selectedAreaId: null,
      selectedLayerIndex: 0,
      cameraTarget: null,
    }),

  addAreaLocal: (area) =>
    set((state) => {
      if (!state.board) return {};
      return {
        board: { ...state.board, areas: [...state.board.areas, area] },
      };
    }),

  updateAreaLocal: (areaId, updates) =>
    set((state) => {
      if (!state.board) return {};
      return {
        board: {
          ...state.board,
          areas: state.board.areas.map((a) =>
            a.id === areaId ? { ...a, ...updates } : a
          ),
        },
      };
    }),

  selectArea: (areaId) => set({ selectedAreaId: areaId }),

  addLayerLocal: (areaId, layer) =>
    set((state) => {
      if (!state.board) return {};
      return {
        board: {
          ...state.board,
          areas: state.board.areas.map((a) =>
            a.id === areaId ? { ...a, layers: [...a.layers, layer] } : a
          ),
        },
      };
    }),

  selectLayer: (index) => set({ selectedLayerIndex: index }),

  setCameraTarget: (target) => set({ cameraTarget: target }),
  clearCameraTarget: () => set({ cameraTarget: null }),
}));
