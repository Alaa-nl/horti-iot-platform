import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validateRequest, loginSchema, registerSchema } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { loginRateLimit, generalApiRateLimit, sanitizeRequestBody } from '../middleware/security';

const router = Router();
const authController = new AuthController();

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT token
 * @access  Public
 */
router.post('/login',
  sanitizeRequestBody,
  loginRateLimit,
  validateRequest(loginSchema),
  async (req, res) => {
    await authController.login(req, res);
  }
);

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register',
  sanitizeRequestBody,
  generalApiRateLimit,
  validateRequest(registerSchema),
  async (req, res) => {
    await authController.register(req, res);
  }
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh',
  sanitizeRequestBody,
  generalApiRateLimit,
  async (req, res) => {
    await authController.refreshToken(req, res);
  }
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password',
  sanitizeRequestBody,
  generalApiRateLimit,
  async (req, res) => {
    await authController.forgotPassword(req, res);
  }
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password',
  sanitizeRequestBody,
  generalApiRateLimit,
  async (req, res) => {
    await authController.resetPassword(req, res);
  }
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticateToken, async (req, res) => {
  await authController.getMe(req, res);
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (invalidate token)
 * @access  Private
 */
router.post('/logout', authenticateToken, async (req, res) => {
  await authController.logout(req, res);
});

/**
 * @route   GET /api/auth/verify
 * @desc    Verify JWT token
 * @access  Private
 */
router.get('/verify', authenticateToken, async (req, res) => {
  await authController.verifyToken(req, res);
});

export default router;