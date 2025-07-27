/**
 * Halal Verification Service
 *
 * Provides verification capabilities for doubtful ingredients using contemporary sources
 */
import { IslamicReference } from '../domain/IslamicKnowledgeBase';
import { Logger } from '../../../core/infrastructure/logging/Logger';
export interface VerificationResult {
    confidence: number;
    references: IslamicReference[];
    verificationMethod: 'database' | 'certification_body' | 'scholarly_consultation' | 'contemporary_fatwa';
    lastVerified: Date;
    notes?: string[];
}
export interface CertificationBody {
    name: string;
    country: string;
    standards: string[];
    credibility: number;
    website?: string;
}
export declare class HalalVerificationService {
    private logger;
    private certificationBodies;
    private verificationCache;
    constructor(logger?: Logger);
    private initializeCertificationBodies;
    verifyIngredient(ingredientName: string): Promise<VerificationResult | null>;
    private performVerification;
    private getVerificationRules;
    private isCacheValid;
    getCertificationBodies(): CertificationBody[];
    requestCertificationBodyVerification(ingredientName: string, certificationBody: string): Promise<VerificationResult | null>;
    generateVerificationReport(ingredientName: string, result: VerificationResult): string;
    clearCache(): void;
    getCacheSize(): number;
}
//# sourceMappingURL=HalalVerificationService.d.ts.map