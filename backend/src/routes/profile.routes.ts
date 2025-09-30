import { Router } from 'express';
import { ProfileController } from '../controllers/profileController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const profileController = new ProfileController();

router.use(authenticateToken);

router.get('/me', profileController.getProfile.bind(profileController));

router.patch('/me', profileController.updateProfile.bind(profileController));

router.post('/me/photo', profileController.uploadProfilePhoto.bind(profileController));

router.delete('/me/photo', profileController.removeProfilePhoto.bind(profileController));

router.get('/:user_id', profileController.getOtherUserProfile.bind(profileController));

export default router;