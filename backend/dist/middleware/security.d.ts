import { Request, Response, NextFunction } from 'express';
export declare const loginRateLimit: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const consumeLoginAttempt: (req: Request, email: string, success: boolean) => Promise<void>;
export declare const generalApiRateLimit: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const sanitizeInput: (input: any) => any;
export declare const sanitizeRequestBody: (req: Request, res: Response, next: NextFunction) => void;
export declare const generateSecureToken: () => string;
export declare const hashToken: (token: string) => string;
export declare const securityHeaders: (req: Request, res: Response, next: NextFunction) => void;
export declare const preventSQLInjection: (value: string) => string;
export declare const logSecurityEvent: (eventType: string, userId: string | null, details: any, req: Request) => Promise<void>;
//# sourceMappingURL=security.d.ts.map