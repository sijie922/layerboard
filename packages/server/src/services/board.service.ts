import { Types } from 'mongoose';
import { Board, IBoard, IArea, ILayer } from '../models/Board.js';
import { v4 as uuidv4 } from 'uuid';

export async function createBoard(
  name: string,
  userId: string
): Promise<IBoard> {
  const board = await Board.create({
    name,
    createdBy: userId,
    members: [userId],
    groups: [],
    areas: [],
  });
  return board;
}

export async function getBoards(userId: string): Promise<IBoard[]> {
  return Board.find({ members: userId })
    .populate('createdBy', 'username avatar')
    .populate('members', 'username avatar')
    .sort({ updatedAt: -1 });
}

export async function getBoardById(boardId: string, userId: string): Promise<IBoard | null> {
  return Board.findOne({
    _id: boardId,
    members: userId,
  })
    .populate('createdBy', 'username avatar')
    .populate('members', 'username avatar');
}

export async function deleteBoard(boardId: string, userId: string): Promise<void> {
  const board = await Board.findOne({ _id: boardId, createdBy: userId });
  if (!board) {
    throw new Error('画板不存在或无权删除');
  }
  await Board.deleteOne({ _id: boardId });
}

export async function addGroup(
  boardId: string,
  userId: string,
  groupName: string,
  color: string
): Promise<IBoard | null> {
  const board = await Board.findOne({ _id: boardId, members: userId });
  if (!board) throw new Error('画板不存在');

  board.groups.push({
    id: uuidv4(),
    name: groupName,
    members: [],
    color,
  });

  await board.save();
  return board;
}

export async function addMemberToGroup(
  boardId: string,
  userId: string,
  groupId: string,
  memberId: string
): Promise<IBoard | null> {
  const board = await Board.findOne({ _id: boardId, members: userId });
  if (!board) throw new Error('画板不存在');

  const group = board.groups.find((g) => g.id === groupId);
  if (!group) throw new Error('小组不存在');

  const oid = new Types.ObjectId(memberId);
  if (!group.members.includes(oid)) {
    group.members.push(oid);
  }

  await board.save();
  return board;
}

export async function addArea(
  boardId: string,
  userId: string,
  areaData: { name: string; groupId: string; position: { x: number; y: number }; size: { width: number; height: number } }
): Promise<IBoard | null> {
  const board = await Board.findOne({ _id: boardId, members: userId });
  if (!board) throw new Error('画板不存在');

  const firstLayer: ILayer = {
    id: uuidv4(),
    label: '第1层',
    index: 0,
    content: {
      stickyNotes: [],
      tables: [],
      drawings: [],
      timestamps: [],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const area: IArea = {
    id: uuidv4(),
    groupId: areaData.groupId,
    name: areaData.name,
    position: areaData.position,
    size: areaData.size,
    layers: [firstLayer],
    createdAt: new Date(),
  };

  board.areas.push(area);
  await board.save();
  return board;
}

export async function updateArea(
  boardId: string,
  userId: string,
  areaId: string,
  updateData: Partial<IArea>
): Promise<IBoard | null> {
  const board = await Board.findOne({ _id: boardId, members: userId });
  if (!board) throw new Error('画板不存在');

  const area = board.areas.find((a) => a.id === areaId);
  if (!area) throw new Error('区域不存在');

  if (updateData.name) area.name = updateData.name;
  if (updateData.position) area.position = updateData.position;
  if (updateData.size) area.size = updateData.size;

  await board.save();
  return board;
}

export async function addLayerToArea(
  boardId: string,
  userId: string,
  areaId: string,
  label: string
): Promise<IBoard | null> {
  const board = await Board.findOne({ _id: boardId, members: userId });
  if (!board) throw new Error('画板不存在');

  const area = board.areas.find((a) => a.id === areaId);
  if (!area) throw new Error('区域不存在');

  const newIndex = area.layers.length;
  const newLayer: ILayer = {
    id: uuidv4(),
    label: label || `第${newIndex + 1}层`,
    index: newIndex,
    content: {
      stickyNotes: [],
      tables: [],
      drawings: [],
      timestamps: [],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  area.layers.push(newLayer);
  await board.save();
  return board;
}

export async function updateLayerContent(
  boardId: string,
  userId: string,
  areaId: string,
  layerId: string,
  content: ILayer['content']
): Promise<IBoard | null> {
  const board = await Board.findOne({ _id: boardId, members: userId });
  if (!board) throw new Error('画板不存在');

  const area = board.areas.find((a) => a.id === areaId);
  if (!area) throw new Error('区域不存在');

  const layer = area.layers.find((l) => l.id === layerId);
  if (!layer) throw new Error('层不存在');

  layer.content = content;
  layer.updatedAt = new Date();

  await board.save();
  return board;
}

// ---- deleteArea ----
export async function deleteArea(
  boardId: string,
  userId: string,
  areaId: string
): Promise<IBoard | null> {
  const board = await Board.findOne({ _id: boardId, members: userId });
  if (!board) throw new Error('画板不存在');

  const idx = board.areas.findIndex((a) => a.id === areaId);
  if (idx === -1) throw new Error('区域不存在');

  board.areas.splice(idx, 1);
  await board.save();
  return board;
}

// ---- updateGroup ----
export async function updateGroup(
  boardId: string,
  userId: string,
  groupId: string,
  data: { name?: string; color?: string }
): Promise<IBoard | null> {
  const board = await Board.findOne({ _id: boardId, members: userId });
  if (!board) throw new Error('画板不存在');

  const group = board.groups.find((g) => g.id === groupId);
  if (!group) throw new Error('小组不存在');

  if (data.name !== undefined) group.name = data.name;
  if (data.color !== undefined) group.color = data.color;

  await board.save();
  return board;
}

// ---- deleteGroup ----
export async function deleteGroup(
  boardId: string,
  userId: string,
  groupId: string
): Promise<IBoard | null> {
  const board = await Board.findOne({ _id: boardId, members: userId });
  if (!board) throw new Error('画板不存在');

  const idx = board.groups.findIndex((g) => g.id === groupId);
  if (idx === -1) throw new Error('小组不存在');

  board.groups.splice(idx, 1);
  // Unlink areas that belonged to this group
  board.areas.forEach((area) => {
    if (area.groupId === groupId) {
      area.groupId = '';
    }
  });

  await board.save();
  return board;
}
