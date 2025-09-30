import { Request, Response } from 'express';
export declare class AdminController {
    createUser(req: Request, res: Response): Promise<void>;
    getUsers(req: Request, res: Response): Promise<void>;
    resetPassword(req: Request, res: Response): Promise<void>;
    toggleUserStatus(req: Request, res: Response): Promise<void>;
    deleteUser(req: Request, res: Response): Promise<void>;
    manageGreenhouseAccess(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=adminController.d.ts.map