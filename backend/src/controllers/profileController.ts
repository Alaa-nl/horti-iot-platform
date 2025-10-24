import { Request, Response } from 'express';
import database from '../utils/database';
import { UpdateUserInput, UserResponse } from '../models/User';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(__dirname, '../../uploads/profiles');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${req.user?.userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
}).single('profile_photo');

export class ProfileController {

  public async getProfile(req: Request, res: Response): Promise<void> {
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

      const userResult = await database.query(userQuery, [req.user.userId]);

      if (userResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const user: UserResponse = userResult.rows[0];

      res.status(200).json({
        success: true,
        data: { user }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  public async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { name, phone_number, department, location, bio }: UpdateUserInput = req.body;

      const updates: string[] = [];
      const values: any[] = [];
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

      const result = await database.query(updateQuery, values);

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const user: UserResponse = result.rows[0];

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user }
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  public async uploadProfilePhoto(req: Request, res: Response): Promise<void> {
    upload(req, res, async (err) => {
      try {
        if (err) {
          if (err instanceof multer.MulterError) {
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
        const oldPhotoResult = await database.query(oldPhotoQuery, [req.user.userId]);

        if (oldPhotoResult.rows.length > 0 && oldPhotoResult.rows[0].profile_photo) {
          const oldPhotoPath = path.join(uploadDir, path.basename(oldPhotoResult.rows[0].profile_photo));
          if (fs.existsSync(oldPhotoPath)) {
            fs.unlinkSync(oldPhotoPath);
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

        const result = await database.query(updateQuery, [photoUrl, req.user.userId]);

        if (result.rows.length === 0) {
          res.status(404).json({
            success: false,
            message: 'User not found'
          });
          return;
        }

        const user: UserResponse = result.rows[0];

        res.status(200).json({
          success: true,
          message: 'Profile photo uploaded successfully',
          data: { user }
        });

      } catch (error) {
        console.error('Upload profile photo error:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    });
  }

  public async removeProfilePhoto(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const photoQuery = 'SELECT profile_photo FROM users WHERE id = $1';
      const photoResult = await database.query(photoQuery, [req.user.userId]);

      if (photoResult.rows.length > 0 && photoResult.rows[0].profile_photo) {
        const photoPath = path.join(uploadDir, path.basename(photoResult.rows[0].profile_photo));
        if (fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
        }
      }

      const updateQuery = `
        UPDATE users
        SET profile_photo = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, email, name, role, is_active, profile_photo, bio,
                  phone_number, department, location, created_at, last_login
      `;

      const result = await database.query(updateQuery, [req.user.userId]);

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const user: UserResponse = result.rows[0];

      res.status(200).json({
        success: true,
        message: 'Profile photo removed successfully',
        data: { user }
      });

    } catch (error) {
      console.error('Remove profile photo error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  public async getOtherUserProfile(req: Request, res: Response): Promise<void> {
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

      const userResult = await database.query(userQuery, [user_id]);

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

    } catch (error) {
      console.error('Get other user profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}