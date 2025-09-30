import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import {
  validateRequest,
  createUserByAdminSchema,
  resetPasswordSchema,
  greenhouseAccessSchema
} from '../middleware/validation';
import { generalApiRateLimit, sanitizeRequestBody } from '../middleware/security';

const router = Router();
const adminController = new AdminController();

// Apply security middleware to all routes
router.use(sanitizeRequestBody);
router.use(generalApiRateLimit);

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRole(['admin']));

/**
 * @route   POST /api/admin/users
 * @desc    Create a new user (Admin only)
 * @access  Private/Admin
 */
router.post('/users',
  validateRequest(createUserByAdminSchema),
  async (req, res) => {
    await adminController.createUser(req, res);
  }
);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filters (Admin only)
 * @access  Private/Admin
 */
router.get('/users', async (req, res) => {
  await adminController.getUsers(req, res);
});

/**
 * @route   POST /api/admin/users/reset-password
 * @desc    Reset user password (Admin only)
 * @access  Private/Admin
 */
router.post('/users/reset-password',
  validateRequest(resetPasswordSchema),
  async (req, res) => {
    await adminController.resetPassword(req, res);
  }
);

/**
 * @route   PATCH /api/admin/users/:user_id/toggle-status
 * @desc    Activate/Deactivate user (Admin only)
 * @access  Private/Admin
 */
router.patch('/users/:user_id/toggle-status', async (req, res) => {
  await adminController.toggleUserStatus(req, res);
});

/**
 * @route   DELETE /api/admin/users/:user_id
 * @desc    Delete user (Admin only)
 * @access  Private/Admin
 */
router.delete('/users/:user_id', async (req, res) => {
  await adminController.deleteUser(req, res);
});

/**
 * @route   POST /api/admin/greenhouse-access
 * @desc    Manage greenhouse access permissions
 * @access  Private/Admin
 */
router.post('/greenhouse-access',
  validateRequest(greenhouseAccessSchema),
  async (req, res) => {
    await adminController.manageGreenhouseAccess(req, res);
  }
);

export default router;