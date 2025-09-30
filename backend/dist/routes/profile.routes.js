"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profileController_1 = require("../controllers/profileController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const profileController = new profileController_1.ProfileController();
router.use(auth_1.authenticateToken);
router.get('/me', profileController.getProfile.bind(profileController));
router.patch('/me', profileController.updateProfile.bind(profileController));
router.post('/me/photo', profileController.uploadProfilePhoto.bind(profileController));
router.delete('/me/photo', profileController.removeProfilePhoto.bind(profileController));
router.get('/:user_id', profileController.getOtherUserProfile.bind(profileController));
exports.default = router;
//# sourceMappingURL=profile.routes.js.map