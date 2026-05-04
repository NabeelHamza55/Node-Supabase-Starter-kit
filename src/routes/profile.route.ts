import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller.js';

const router = Router();
const controller = new ProfileController();

router.get('/', controller.getAll);
router.get('/:id', controller.getOne);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
