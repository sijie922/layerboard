import type { User } from './user';

export interface Group {
  id: string;
  name: string;
  members: string[];
  color: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface StickyNote {
  id: string;
  position: Position;
  size: Size;
  content: string;
  color: string;
  createdBy: string;
  createdAt: string;
}

export interface TableWidget {
  id: string;
  position: Position;
  size: Size;
  columns: string[];
  rows: string[][];
}

export interface Stroke {
  points: Position[];
  color: string;
  width: number;
}

export interface DrawingData {
  id: string;
  position: Position;
  strokes: Stroke[];
}

export interface TimeStamp {
  id: string;
  text: string;
  position: Position;
  createdAt: string;
}

export interface LayerContent {
  stickyNotes: StickyNote[];
  tables: TableWidget[];
  drawings: DrawingData[];
  timestamps: TimeStamp[];
}

export interface Layer {
  id: string;
  label: string;
  index: number;
  content: LayerContent;
  createdAt: string;
  updatedAt: string;
}

export interface Area {
  id: string;
  groupId: string;
  name: string;
  position: Position;
  size: Size;
  layers: Layer[];
  createdAt: string;
}

export interface Board {
  _id: string;
  name: string;
  createdBy: User | string;
  members: User[] | string[];
  groups: Group[];
  areas: Area[];
  createdAt: string;
  updatedAt: string;
}
