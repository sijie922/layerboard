import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import * as boardService from '../services/board.service.js';

export async function createBoard(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name } = req.body;
    const userId = req.user!.userId;
    const board = await boardService.createBoard(name, userId);
    res.status(201).json({ message: '画板创建成功', data: board });
  } catch (err) {
    const message = err instanceof Error ? err.message : '创建画板失败';
    res.status(400).json({ message });
  }
}

export async function getBoards(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const boards = await boardService.getBoards(userId);
    res.json({ data: boards });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取画板列表失败';
    res.status(500).json({ message });
  }
}

export async function getBoard(req: AuthRequest, res: Response): Promise<void> {
  try {
    const boardId = req.params.boardId as string;
    const userId = req.user!.userId;
    const board = await boardService.getBoardById(boardId, userId);
    if (!board) {
      res.status(404).json({ message: '画板不存在' });
      return;
    }
    res.json({ data: board });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取画板失败';
    res.status(500).json({ message });
  }
}

export async function deleteBoard(req: AuthRequest, res: Response): Promise<void> {
  try {
    const boardId = req.params.boardId as string;
    const userId = req.user!.userId;
    await boardService.deleteBoard(boardId, userId);
    res.json({ message: '画板已删除' });
  } catch (err) {
    const message = err instanceof Error ? err.message : '删除画板失败';
    res.status(400).json({ message });
  }
}

export async function addGroup(req: AuthRequest, res: Response): Promise<void> {
  try {
    const boardId = req.params.boardId as string;
    const { name, color } = req.body;
    const userId = req.user!.userId;
    const board = await boardService.addGroup(boardId, userId, name, color);
    res.status(201).json({ message: '小组创建成功', data: board });
  } catch (err) {
    const message = err instanceof Error ? err.message : '创建小组失败';
    res.status(400).json({ message });
  }
}

export async function addArea(req: AuthRequest, res: Response): Promise<void> {
  try {
    const boardId = req.params.boardId as string;
    const userId = req.user!.userId;
    const board = await boardService.addArea(boardId, userId, req.body);
    res.status(201).json({ message: '区域创建成功', data: board });
  } catch (err) {
    const message = err instanceof Error ? err.message : '创建区域失败';
    res.status(400).json({ message });
  }
}

export async function updateArea(req: AuthRequest, res: Response): Promise<void> {
  try {
    const boardId = req.params.boardId as string; const areaId = req.params.areaId as string;
    const userId = req.user!.userId;
    const board = await boardService.updateArea(boardId, userId, areaId, req.body);
    res.json({ message: '区域更新成功', data: board });
  } catch (err) {
    const message = err instanceof Error ? err.message : '更新区域失败';
    res.status(400).json({ message });
  }
}

export async function addLayer(req: AuthRequest, res: Response): Promise<void> {
  try {
    const boardId = req.params.boardId as string; const areaId = req.params.areaId as string;
    const { label } = req.body;
    const userId = req.user!.userId;
    const board = await boardService.addLayerToArea(boardId, userId, areaId, label);
    res.status(201).json({ message: '新层创建成功', data: board });
  } catch (err) {
    const message = err instanceof Error ? err.message : '创建层失败';
    res.status(400).json({ message });
  }
}

export async function updateLayerContent(req: AuthRequest, res: Response): Promise<void> {
  try {
    const boardId = req.params.boardId as string; const areaId = req.params.areaId as string; const layerId = req.params.layerId as string;
    const userId = req.user!.userId;
    const board = await boardService.updateLayerContent(boardId, userId, areaId, layerId, req.body);
    res.json({ message: '层内容更新成功', data: board });
  } catch (err) {
    const message = err instanceof Error ? err.message : '更新层内容失败';
    res.status(400).json({ message });
  }
}

export async function deleteArea(req: AuthRequest, res: Response): Promise<void> {
  try {
    const boardId = req.params.boardId as string; const areaId = req.params.areaId as string;
    const userId = req.user!.userId;
    const board = await boardService.deleteArea(boardId, userId, areaId);
    res.json({ message: '区域已删除', data: board });
  } catch (err) {
    const message = err instanceof Error ? err.message : '删除区域失败';
    res.status(400).json({ message });
  }
}

export async function updateGroup(req: AuthRequest, res: Response): Promise<void> {
  try {
    const boardId = req.params.boardId as string; const groupId = req.params.groupId as string;
    const userId = req.user!.userId;
    const board = await boardService.updateGroup(boardId, userId, groupId, req.body);
    res.json({ message: '小组已更新', data: board });
  } catch (err) {
    const message = err instanceof Error ? err.message : '更新小组失败';
    res.status(400).json({ message });
  }
}

export async function deleteGroup(req: AuthRequest, res: Response): Promise<void> {
  try {
    const boardId = req.params.boardId as string; const groupId = req.params.groupId as string;
    const userId = req.user!.userId;
    const board = await boardService.deleteGroup(boardId, userId, groupId);
    res.json({ message: '小组已删除', data: board });
  } catch (err) {
    const message = err instanceof Error ? err.message : '删除小组失败';
    res.status(400).json({ message });
  }
}
