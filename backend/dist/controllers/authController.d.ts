import { Request, Response } from 'express';
export declare class AuthController {
    refreshToken(req: Request, res: Response): Promise<void>;
    forgotPassword(req: Request, res: Response): Promise<void>;
    resetPassword(req: Request, res: Response): Promise<void>;
    login(req: Request, res: Response): Promise<void>;
    register(req: Request, res: Response): Promise<void>;
    getMe(req: Request, res: Response): Promise<void>;
    logout(req: Request, res: Response): Promise<void>;
    verifyToken(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=authController.d.ts.map