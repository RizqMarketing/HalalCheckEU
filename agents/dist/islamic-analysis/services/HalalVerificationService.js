"use strict";
/**
 * Halal Verification Service
 *
 * Provides verification capabilities for doubtful ingredients using contemporary sources
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HalalVerificationService = void 0;
const Logger_1 = require("../../../core/infrastructure/logging/Logger");
class HalalVerificationService {
    constructor(logger) {
        this.logger = logger || new Logger_1.Logger('HalalVerificationService');
        this.verificationCache = new Map();
        this.initializeCertificationBodies();
    }
    initializeCertificationBodies() {
        this.certificationBodies = [
            {
                name: 'Halal Food Authority (HFA)',
                country: 'UK',
                standards: ['HFA Standard', 'EU 993:2015'],
                credibility: 95,
                website: 'https://halalfoodauthority.com'
            },
            {
                name: 'Islamic Society of North America (ISNA)',
                country: 'USA',
                standards: ['ISNA Standard'],
                credibility: 90,
                website: 'https://www.isnacanada.com'
            },
            {
                name: 'JAKIM (Department of Islamic Development Malaysia)',
                country: 'Malaysia',
                standards: ['MS 1500:2019', 'OIC/SMIIC 1:2019'],
                credibility: 98,
                website: 'https://www.halal.gov.my'
            },
            {
                name: 'Halal Certification Europe (HCE)',
                country: 'Netherlands',
                standards: ['GSO 993:2015', 'HCE Standard'],
                credibility: 85,
                website: 'https://halalcertificationeurope.com'
            },
            {
                name: 'Emirates Authority for Standardization and Metrology (ESMA)', n, country: 'UAE',
                standards: ['UAE.S GSO 993:2015', 'ESMA Standard'],
                credibility: 92,
                website: 'https://www.esma.gov.ae'
            }
        ];
    }
    async verifyIngredient(ingredientName) {
        this.logger.debug(`Verifying ingredient: ${ingredientName}`);
        // Check cache first
        const cached = this.verificationCache.get(ingredientName.toLowerCase());
        if (cached && this.isCacheValid(cached)) {
            this.logger.debug(`Using cached verification for ${ingredientName}`);
            return cached;
        }
        // Perform verification
        const result = await this.performVerification(ingredientName);
        if (result) {
            // Cache the result
            this.verificationCache.set(ingredientName.toLowerCase(), result);
        }
        return result;
    }
    async performVerification(ingredientName) {
        // This would typically involve external API calls to certification bodies
        // For now, we'll provide rule-based verification
        const verificationRules = this.getVerificationRules();
        for (const rule of verificationRules) {
            if (rule.matcher(ingredientName)) {
                return {
                    confidence: rule.confidence,
                    references: rule.references,
                    verificationMethod: rule.method,
                    lastVerified: new Date(),
                    notes: rule.notes
                };
            }
        }
        return null;
    }
    getVerificationRules() {
        return [
            {
                matcher: (ingredient) => ingredient.toLowerCase().includes('e471') || ingredient.toLowerCase().includes('mono- and diglycerides'),
                confidence: 60,
                references: [
                    {
                        source: 'Contemporary_Fatwa',
                        reference: 'European Halal Standards GSO 993:2015',
                        translation: 'E471 from plant sources is permissible. Animal sources require halal certification.',
                        school: 'General'
                    },
                    {
                        source: 'Scholarly_Consensus',
                        reference: 'Malaysian Halal Standard MS 1500:2019',
                        translation: 'Mono- and diglycerides are acceptable when derived from halal sources.',
                        school: 'General'
                    }
                ],
                method: 'certification_body',
                notes: ['Request certificate of plant-based origin from manufacturer']
            },
            {
                matcher: (ingredient) => ingredient.toLowerCase().includes('lecithin'),
                confidence: 70,
                references: [
                    {
                        source: 'Contemporary_Fatwa',
                        reference: 'Halal Food Authority Guidelines',
                        translation: 'Lecithin from soy, sunflower, or rapeseed is halal. Egg lecithin is acceptable.',
                        school: 'General'
                    }
                ],
                method: 'certification_body',
                notes: ['Verify source: soy, sunflower, or egg lecithin preferred']
            },
            {
                matcher: (ingredient) => ingredient.toLowerCase().includes('natural flavor'),
                confidence: 40,
                references: [
                    {
                        source: 'Contemporary_Fatwa',
                        reference: 'ISNA Halal Guidelines',
                        translation: 'Natural flavors require detailed investigation due to potential alcohol content.',
                        school: 'General'
                    }
                ],
                method: 'scholarly_consultation',
                notes: ['Request detailed specification from manufacturer', 'Check for alcohol-free certification']
            },
            {
                matcher: (ingredient) => ingredient.toLowerCase().includes('vanilla extract'),
                confidence: 50,
                references: [
                    {
                        source: 'Scholarly_Consensus',
                        reference: 'Contemporary Madhab Rulings',
                        translation: 'Vanilla extract with alcohol is disputed. Alcohol-free alternatives preferred.',
                        school: 'General'
                    }
                ],
                method: 'scholarly_consultation',
                notes: ['Seek alcohol-free vanilla extract alternatives']
            },
            {
                matcher: (ingredient) => ingredient.toLowerCase().includes('rennet'),
                confidence: 65,
                references: [
                    {
                        source: 'Contemporary_Fatwa',
                        reference: 'JAKIM Halal Guidelines',
                        translation: 'Animal rennet requires halal slaughter certification. Microbial rennet is preferred.',
                        school: 'General'
                    }
                ],
                method: 'certification_body',
                notes: ['Prefer microbial or vegetable rennet', 'If animal rennet, verify halal slaughter certificate']
            }
        ];
    }
    isCacheValid(result) {
        const cacheValidityPeriod = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
        const now = new Date().getTime();
        const resultTime = result.lastVerified.getTime();
        return (now - resultTime) < cacheValidityPeriod;
    }
    getCertificationBodies() {
        return [...this.certificationBodies].sort((a, b) => b.credibility - a.credibility);
    }
    async requestCertificationBodyVerification(ingredientName, certificationBody) {
        // This would make actual API calls to certification bodies
        // For now, return a simulated response
        const body = this.certificationBodies.find(cb => cb.name === certificationBody);
        if (!body) {
            this.logger.warn(`Unknown certification body: ${certificationBody}`);
            return null;
        }
        this.logger.info(`Requesting verification from ${certificationBody} for ${ingredientName}`);
        // Simulated verification result
        return {
            confidence: Math.min(body.credibility, 85),
            references: [
                {
                    source: 'Contemporary_Fatwa',
                    reference: `${body.name} Verification`,
                    translation: `Verified according to ${body.standards.join(', ')} standards.`,
                    school: 'General'
                }
            ],
            verificationMethod: 'certification_body',
            lastVerified: new Date(),
            notes: [`Verified by ${body.name}`, `Standards: ${body.standards.join(', ')}`]
        };
    }
    generateVerificationReport(ingredientName, result) {
        let report = `# Halal Verification Report\n\n`;
        report += `**Ingredient:** ${ingredientName}\n`;
        report += `**Verification Date:** ${result.lastVerified.toLocaleDateString()}\n`;
        report += `**Confidence Level:** ${result.confidence}%\n`;
        report += `**Verification Method:** ${result.verificationMethod.replace('_', ' ').toUpperCase()}\n\n`;
        report += `## Islamic References\n\n`;
        result.references.forEach((ref, index) => {
            report += `${index + 1}. **${ref.source}** - ${ref.reference}\n`;
            if (ref.arabic)
                report += `   *Arabic:* ${ref.arabic}\n`;
            if (ref.transliteration)
                report += `   *Transliteration:* ${ref.transliteration}\n`;
            report += `   *Translation:* ${ref.translation}\n`;
            if (ref.school && ref.school !== 'General')
                report += `   *School:* ${ref.school}\n`;
            report += `\n`;
        });
        if (result.notes && result.notes.length > 0) {
            report += `## Notes\n\n`;
            result.notes.forEach(note => {
                report += `- ${note}\n`;
            });
        }
        return report;
    }
    clearCache() {
        this.verificationCache.clear();
        this.logger.info('Verification cache cleared');
    }
    getCacheSize() {
        return this.verificationCache.size;
    }
}
exports.HalalVerificationService = HalalVerificationService;
//# sourceMappingURL=HalalVerificationService.js.map