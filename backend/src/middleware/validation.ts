import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body);

    if (error) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
      return;
    }

    req.body = value;
    next();
  };
};

// Validation schemas
export const loginSchema = Joi.object({
  email: Joi.string().email().required().max(255).trim().lowercase().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
    'string.max': 'Email cannot exceed 255 characters'
  }),
  password: Joi.string().min(6).max(100).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'string.max': 'Password cannot exceed 100 characters',
    'any.required': 'Password is required'
  })
});

export const registerSchema = Joi.object({
  email: Joi.string().email().required().max(255).trim().lowercase().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
    'string.max': 'Email cannot exceed 255 characters'
  }),
  password: Joi.string()
    .min(8)
    .max(100)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password cannot exceed 100 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),
  name: Joi.string().min(2).max(255).trim().required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 255 characters',
    'any.required': 'Name is required'
  }),
  role: Joi.string().valid('admin', 'researcher', 'grower', 'farmer').required().messages({
    'any.only': 'Invalid role specified',
    'any.required': 'Role is required'
  }),
  phone_number: Joi.string().pattern(/^[+]?[\d\s()-]+$/).max(50).optional().messages({
    'string.pattern.base': 'Invalid phone number format'
  }),
  department: Joi.string().max(100).trim().optional(),
  location: Joi.string().max(255).trim().optional()
});

export const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(255).trim().optional(),
  email: Joi.string().email().max(255).trim().lowercase().optional(),
  phone_number: Joi.string().pattern(/^[+]?[\d\s()-]+$/).max(50).optional(),
  department: Joi.string().max(100).trim().optional(),
  location: Joi.string().max(255).trim().optional(),
  bio: Joi.string().max(1000).trim().optional()
});

export const createUserByAdminSchema = Joi.object({
  email: Joi.string().email().required().max(255).trim().lowercase(),
  password: Joi.string()
    .min(8)
    .max(100)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
      'string.min': 'Password must be at least 8 characters long'
    }),
  name: Joi.string().min(2).max(255).trim().required(),
  role: Joi.string().valid('admin', 'researcher', 'grower', 'farmer').required(),
  phone_number: Joi.string().pattern(/^[+]?[\d\s()-]+$/).max(50).optional().allow(''),
  department: Joi.string().max(100).trim().optional().allow(''),
  location: Joi.string().max(255).trim().optional().allow('')
});

export const resetPasswordSchema = Joi.object({
  user_id: Joi.string().uuid().required(),
  new_password: Joi.string()
    .min(8)
    .max(100)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    })
});

export const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string()
    .min(8)
    .max(100)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .invalid(Joi.ref('current_password'))
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.invalid': 'New password must be different from current password'
    })
});

export const greenhouseAccessSchema = Joi.object({
  user_id: Joi.string().uuid().required(),
  greenhouse_id: Joi.string().uuid().required(),
  permission_type: Joi.string().valid('view', 'edit', 'manage').required(),
  action: Joi.string().valid('grant', 'revoke').required()
});

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query);

    if (error) {
      res.status(400).json({
        success: false,
        message: 'Query validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
      return;
    }

    req.query = value;
    next();
  };
};