"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const security_1 = require("../middleware/security");
const router = (0, express_1.Router)();
const authController = new authController_1.AuthController();
router.post('/login', security_1.sanitizeRequestBody, security_1.loginRateLimit, (0, validation_1.validateRequest)(validation_1.loginSchema), async (req, res) => {
    await authController.login(req, res);
});
router.post('/register', security_1.sanitizeRequestBody, security_1.generalApiRateLimit, (0, validation_1.validateRequest)(validation_1.registerSchema), async (req, res) => {
    await authController.register(req, res);
});
router.post('/refresh', security_1.sanitizeRequestBody, security_1.generalApiRateLimit, async (req, res) => {
    await authController.refreshToken(req, res);
});
router.post('/forgot-password', security_1.sanitizeRequestBody, security_1.generalApiRateLimit, async (req, res) => {
    await authController.forgotPassword(req, res);
});
router.post('/reset-password', security_1.sanitizeRequestBody, security_1.generalApiRateLimit, async (req, res) => {
    await authController.resetPassword(req, res);
});
router.get('/me', auth_1.authenticateToken, async (req, res) => {
    await authController.getMe(req, res);
});
router.post('/logout', auth_1.authenticateToken, async (req, res) => {
    await authController.logout(req, res);
});
router.get('/verify', auth_1.authenticateToken, async (req, res) => {
    await authController.verifyToken(req, res);
});
exports.default = router;
//# sourceMappingURL=auth.js.map