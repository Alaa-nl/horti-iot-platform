import { Request, Response } from 'express';
export declare class GreenhouseController {
    getAllGreenhouses(req: Request, res: Response): Promise<void>;
    getGreenhouseById(req: Request, res: Response): Promise<void>;
    getGreenhouseSensors(req: Request, res: Response): Promise<void>;
    getLatestSensorReadings(req: Request, res: Response): Promise<void>;
    getWeatherData(req: Request, res: Response): Promise<void>;
    private formatGreenhouseResponse;
    createGreenhouse(req: Request, res: Response): Promise<void>;
    updateGreenhouse(req: Request, res: Response): Promise<void>;
    deleteGreenhouse(req: Request, res: Response): Promise<void>;
    private checkGreenhousePermission;
}
//# sourceMappingURL=greenhouseController.d.ts.map