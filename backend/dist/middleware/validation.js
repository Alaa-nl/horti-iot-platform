"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuery = exports.greenhouseAccessSchema = exports.changePasswordSchema = exports.resetPasswordSchema = exports.createUserByAdminSchema = exports.updateUserSchema = exports.registerSchema = exports.loginSchema = exports.validateRequest = void 0;
const joi_1 = __importDefault(require("joi"));
const validateRequest = (schema) => {
    return (req, res, next) => {
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
exports.validateRequest = validateRequest;
exports.loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required().max(255).trim().lowercase().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
        'string.max': 'Email cannot exceed 255 characters'
    }),
    password: joi_1.default.string().min(6).max(100).required().messages({
        'string.min': 'Password must be at least 6 characters long',
        'string.max': 'Password cannot exceed 100 characters',
        'any.required': 'Password is required'
    })
});
exports.registerSchema = joi_1.default.object({
    email: joi_1.default.string().email().required().max(255).trim().lowercase().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
        'string.max': 'Email cannot exceed 255 characters'
    }),
    password: joi_1.default.string()
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
    name: joi_1.default.string().min(2).max(255).trim().required().messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 255 characters',
        'any.required': 'Name is required'
    }),
    role: joi_1.default.string().valid('admin', 'researcher', 'grower', 'farmer').required().messages({
        'any.only': 'Invalid role specified',
        'any.required': 'Role is required'
    }),
    phone_number: joi_1.default.string().pattern(/^[+]?[\d\s()-]+$/).max(50).optional().messages({
        'string.pattern.base': 'Invalid phone number format'
    }),
    department: joi_1.default.string().max(100).trim().optional(),
    location: joi_1.default.string().max(255).trim().optional()
});
exports.updateUserSchema = joi_1.default.object({
    name: joi_1.default.string().min(2).max(255).trim().optional(),
    email: joi_1.default.string().email().max(255).trim().lowercase().optional(),
    phone_number: joi_1.default.string().pattern(/^[+]?[\d\s()-]+$/).max(50).optional(),
    department: joi_1.default.string().max(100).trim().optional(),
    location: joi_1.default.string().max(255).trim().optional(),
    bio: joi_1.default.string().max(1000).trim().optional()
});
exports.createUserByAdminSchema = joi_1.default.object({
    email: joi_1.default.string().email().required().max(255).trim().lowercase(),
    password: joi_1.default.string()
        .min(8)
        .max(100)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required()
        .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
        'string.min': 'Password must be at least 8 characters long'
    }),
    name: joi_1.default.string().min(2).max(255).trim().required(),
    role: joi_1.default.string().valid('admin', 'researcher', 'grower', 'farmer').required(),
    phone_number: joi_1.default.string().pattern(/^[+]?[\d\s()-]+$/).max(50).optional().allow(''),
    department: joi_1.default.string().max(100).trim().optional().allow(''),
    location: joi_1.default.string().max(255).trim().optional().allow('')
});
exports.resetPasswordSchema = joi_1.default.object({
    user_id: joi_1.default.string().uuid().required(),
    new_password: joi_1.default.string()
        .min(8)
        .max(100)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required()
        .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    })
});
exports.changePasswordSchema = joi_1.default.object({
    current_password: joi_1.default.string().required(),
    new_password: joi_1.default.string()
        .min(8)
        .max(100)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required()
        .invalid(joi_1.default.ref('current_password'))
        .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.invalid': 'New password must be different from current password'
    })
});
exports.greenhouseAccessSchema = joi_1.default.object({
    user_id: joi_1.default.string().uuid().required(),
    greenhouse_id: joi_1.default.string().uuid().required(),
    permission_type: joi_1.default.string().valid('view', 'edit', 'manage').required(),
    action: joi_1.default.string().valid('grant', 'revoke').required()
});
const validateQuery = (schema) => {
    return (req, res, next) => {
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
exports.validateQuery = validateQuery;
//# sourceMappingURL=validation.js.map