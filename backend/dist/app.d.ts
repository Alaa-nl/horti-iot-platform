import { Application } from 'express';
declare class App {
    app: Application;
    constructor();
    private initializeMiddleware;
    private initializeRoutes;
    private initializeErrorHandling;
    private initializeDatabase;
    listen(): void;
}
export default App;
//# sourceMappingURL=app.d.ts.map