import { Router } from 'express';
import authRoutes from './auth.routes';
import familyRoutes from './family.routes';
import memoryRoutes from './memory.routes';
import photoRoutes from './photo.routes';
import letterRoutes from './letter.routes';
import questionRoutes from './question.routes';
import tagRoutes from './tag.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/families', familyRoutes);
router.use('/memories', memoryRoutes);
router.use('/photos', photoRoutes);
router.use('/letters', letterRoutes);
router.use('/questions', questionRoutes);
router.use('/tags', tagRoutes);

export default router;
