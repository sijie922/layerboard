import { Router } from 'express';
import {
  createBoard,
  getBoards,
  getBoard,
  deleteBoard,
  addGroup,
  addArea,
  updateArea,
  addLayer,
  updateLayerContent,
} from '../controllers/board.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validateBody, createBoardSchema, createGroupSchema, createAreaSchema } from '../middleware/validation.middleware.js';

const router = Router();

// All board routes require authentication
router.use(authMiddleware);

router.post('/', validateBody(createBoardSchema), createBoard);
router.get('/', getBoards);
router.get('/:boardId', getBoard);
router.delete('/:boardId', deleteBoard);

// Group routes
router.post('/:boardId/groups', validateBody(createGroupSchema), addGroup);

// Area routes
router.post('/:boardId/areas', validateBody(createAreaSchema), addArea);
router.put('/:boardId/areas/:areaId', updateArea);

// Layer routes
router.post('/:boardId/areas/:areaId/layers', addLayer);
router.put('/:boardId/areas/:areaId/layers/:layerId', updateLayerContent);

export default router;
