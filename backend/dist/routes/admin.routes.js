"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const security_1 = require("../middleware/security");
const router = (0, express_1.Router)();
const adminController = new adminController_1.AdminController();
router.use(security_1.sanitizeRequestBody);
router.use(security_1.generalApiRateLimit);
router.use(auth_1.authenticateToken);
router.use((0, auth_1.authorizeRole)(['admin']));
router.post('/users', (0, validation_1.validateRequest)(validation_1.createUserByAdminSchema), async (req, res) => {
    await adminController.createUser(req, res);
});
router.get('/users', async (req, res) => {
    await adminController.getUsers(req, res);
});
router.post('/users/reset-password', (0, validation_1.validateRequest)(validation_1.resetPasswordSchema), async (req, res) => {
    await adminController.resetPassword(req, res);
});
router.patch('/users/:user_id/toggle-status', async (req, res) => {
    await adminController.toggleUserStatus(req, res);
});
router.delete('/users/:user_id', async (req, res) => {
    await adminController.deleteUser(req, res);
});
router.post('/greenhouse-access', (0, validation_1.validateRequest)(validation_1.greenhouseAccessSchema), async (req, res) => {
    await adminController.manageGreenhouseAccess(req, res);
});
exports.default = router;
//# sourceMappingURL=admin.routes.js.map