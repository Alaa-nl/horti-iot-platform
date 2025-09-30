"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileController = void 0;
const database_1 = __importDefault(require("../utils/database"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uploadDir = path_1.default.join(__dirname, '../../uploads/profiles');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `profile-${req.user?.userId}-${uniqueSuffix}${path_1.default.extname(file.originalname)}`);
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed'));
        }
    }
}).single('profile_photo');
class ProfileController {
    async getProfile(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const userQuery = `
        SELECT id, email, name, role, is_active, profile_photo, bio,
               phone_number, department, location, created_at, last_login
        FROM users
        WHERE id = $1
      `;
            const userResult = await database_1.default.query(userQuery, [req.user.userId]);
            if (userResult.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }
            const user = userResult.rows[0];
            res.status(200).json({
                success: true,
                data: { user }
            });
        }
        catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    async updateProfile(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const { name, phone_number, department, location, bio } = req.body;
            const updates = [];
            const values = [];
            let valueIndex = 1;
            if (name !== undefined) {
                updates.push(`name = $${valueIndex++}`);
                values.push(name);
            }
            if (phone_number !== undefined) {
                updates.push(`phone_number = $${valueIndex++}`);
                values.push(phone_number);
            }
            if (department !== undefined) {
                updates.push(`department = $${valueIndex++}`);
                values.push(department);
            }
            if (location !== undefined) {
                updates.push(`location = $${valueIndex++}`);
                values.push(location);
            }
            if (bio !== undefined) {
                updates.push(`bio = $${valueIndex++}`);
                values.push(bio);
            }
            if (updates.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'No fields to update'
                });
                return;
            }
            updates.push(`updated_at = CURRENT_TIMESTAMP`);
            values.push(req.user.userId);
            const updateQuery = `
        UPDATE users
        SET ${updates.join(', ')}
        WHERE id = $${valueIndex}
        RETURNING id, email, name, role, is_active, profile_photo, bio,
                  phone_number, department, location, created_at, last_login
      `;
            const result = await database_1.default.query(updateQuery, values);
            if (result.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }
            const user = result.rows[0];
            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                data: { user }
            });
        }
        catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    async uploadProfilePhoto(req, res) {
        upload(req, res, async (err) => {
            try {
                if (err) {
                    if (err instanceof multer_1.default.MulterError) {
                        if (err.code === 'LIMIT_FILE_SIZE') {
                            res.status(400).json({
                                success: false,
                                message: 'File size too large. Maximum size is 5MB.'
                            });
                            return;
                        }
                    }
                    res.status(400).json({
                        success: false,
                        message: err.message || 'Error uploading file'
                    });
                    return;
                }
                if (!req.user) {
                    res.status(401).json({
                        success: false,
                        message: 'Authentication required'
                    });
                    return;
                }
                if (!req.file) {
                    res.status(400).json({
                        success: false,
                        message: 'No file uploaded'
                    });
                    return;
                }
                const oldPhotoQuery = 'SELECT profile_photo FROM users WHERE id = $1';
                const oldPhotoResult = await database_1.default.query(oldPhotoQuery, [req.user.userId]);
                if (oldPhotoResult.rows.length > 0 && oldPhotoResult.rows[0].profile_photo) {
                    const oldPhotoPath = path_1.default.join(uploadDir, path_1.default.basename(oldPhotoResult.rows[0].profile_photo));
                    if (fs_1.default.existsSync(oldPhotoPath)) {
                        fs_1.default.unlinkSync(oldPhotoPath);
                    }
                }
                const photoUrl = `/uploads/profiles/${req.file.filename}`;
                const updateQuery = `
          UPDATE users
          SET profile_photo = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING id, email, name, role, is_active, profile_photo, bio,
                    phone_number, department, location, created_at, last_login
        `;
                const result = await database_1.default.query(updateQuery, [photoUrl, req.user.userId]);
                if (result.rows.length === 0) {
                    res.status(404).json({
                        success: false,
                        message: 'User not found'
                    });
                    return;
                }
                const user = result.rows[0];
                res.status(200).json({
                    success: true,
                    message: 'Profile photo uploaded successfully',
                    data: { user }
                });
            }
            catch (error) {
                console.error('Upload profile photo error:', error);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        });
    }
    async removeProfilePhoto(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const photoQuery = 'SELECT profile_photo FROM users WHERE id = $1';
            const photoResult = await database_1.default.query(photoQuery, [req.user.userId]);
            if (photoResult.rows.length > 0 && photoResult.rows[0].profile_photo) {
                const photoPath = path_1.default.join(uploadDir, path_1.default.basename(photoResult.rows[0].profile_photo));
                if (fs_1.default.existsSync(photoPath)) {
                    fs_1.default.unlinkSync(photoPath);
                }
            }
            const updateQuery = `
        UPDATE users
        SET profile_photo = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, email, name, role, is_active, profile_photo, bio,
                  phone_number, department, location, created_at, last_login
      `;
            const result = await database_1.default.query(updateQuery, [req.user.userId]);
            if (result.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }
            const user = result.rows[0];
            res.status(200).json({
                success: true,
                message: 'Profile photo removed successfully',
                data: { user }
            });
        }
        catch (error) {
            console.error('Remove profile photo error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    async getOtherUserProfile(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const { user_id } = req.params;
            const userQuery = `
        SELECT id, email, name, role, is_active, profile_photo, bio,
               department, location, created_at, last_login
        FROM users
        WHERE id = $1 AND is_active = true
      `;
            const userResult = await database_1.default.query(userQuery, [user_id]);
            if (userResult.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }
            const user = userResult.rows[0];
            delete user.phone_number;
            res.status(200).json({
                success: true,
                data: { user }
            });
        }
        catch (error) {
            console.error('Get other user profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}
exports.ProfileController = ProfileController;
//# sourceMappingURL=profileController.js.map