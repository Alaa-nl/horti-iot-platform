import { JWTPayload } from '../models/User';
interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
}
export declare class TokenService {
    private readonly accessTokenSecret;
    private readonly refreshTokenSecret;
    private readonly accessTokenExpiry;
    private readonly refreshTokenExpiry;
    constructor();
    generateTokenPair(payload: JWTPayload): TokenPair;
    verifyAccessToken(token: string): JWTPayload | null;
    verifyRefreshToken(token: string): {
        userId: string;
        tokenId: string;
    } | null;
    saveRefreshToken(userId: string, refreshToken: string, req: any): Promise<void>;
    validateRefreshToken(refreshToken: string): Promise<string | null>;
    invalidateRefreshToken(tokenHash: string): Promise<void>;
    invalidateAllUserTokens(userId: string): Promise<void>;
    rotateRefreshToken(oldRefreshToken: string, userId: string, req: any): Promise<TokenPair | null>;
    private hashToken;
    cleanupExpiredTokens(): Promise<void>;
}
declare const _default: TokenService;
export default _default;
//# sourceMappingURL=tokenService.d.ts.map