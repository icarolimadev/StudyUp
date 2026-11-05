import { Router } from 'express';
import { getStatus } from '../controllers/status-controller.js';

const router = Router();
// Com o prefixo /api definido em app.js, a rota vira GET /api/status.
router.get('/status', getStatus);
export default router;
