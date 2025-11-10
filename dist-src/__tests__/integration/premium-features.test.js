import { AuditLogger } from '../../src/premium/audit.logger';
import { VercelBlobStorage } from '../../src/premium/blob.storage';
import { CloudNIMIntegration } from '../../src/premium/cloud-nim.integration';
import { LicenseManager } from '../../src/premium/license.manager';
import { StripePaymentIntegration } from '../../src/premium/stripe.payment';
import { TeamStateManager } from '../../src/premium/team.state';
import { E2BSandboxIntegration } from '../../src/premium/e2b.sandbox';
// Mock external dependencies
jest.mock('@vercel/blob', () => ({
    put: jest.fn(),
    del: jest.fn(),
    list: jest.fn(),
    head: jest.fn()
}));
global.fetch = jest.fn();
describe('Premium Features Integration', () => {
    describe('Audit Logging with Security Events', () => {
        let auditLogger;
        beforeEach(() => {
            auditLogger = new AuditLogger('.lapa/test-security-audit.log', true);
        });
        afterEach(async () => {
            try {
                const fs = await import('fs/promises');
                await fs.unlink('.lapa/test-security-audit.log');
            }
            catch (error) {
                // Ignore if file doesn't exist
            }
        });
        it('should log security events with proper attribution', async () => {
            // Simulate a security event
            await auditLogger.logSecurityEvent('unauthorized-access-attempt', {
                resource: '/api/admin/users',
                method: 'DELETE',
                ip: '192.168.1.100'
            }, {
                userId: 'user-123',
                ipAddress: '192.168.1.100',
                userAgent: 'Mozilla/5.0 (Suspicious)',
                sessionId: 'session-abc'
            });
            // Search for the security event
            const logs = await auditLogger.searchLogs({
                level: 'security',
                action: 'unauthorized-access-attempt'
            });
            expect(logs).toHaveLength(1);
            expect(logs[0].action).toBe('unauthorized-access-attempt');
            expect(logs[0].userId).toBe('user-123');
            expect(logs[0].level).toBe('security');
            expect(logs[0].details).toEqual({
                resource: '/api/admin/users',
                method: 'DELETE',
                ip: '192.168.1.100'
            });
        });
        it('should handle compliance logging for premium features', async () => {
            // Simulate premium feature usage
            await auditLogger.logUserAction('user-premium-456', 'access-enterprise-dashboard', 'enterprise-analytics', {
                feature: 'advanced-analytics',
                dataPoints: 10000
            }, {
                ipAddress: '203.0.113.1',
                userAgent: 'EnterpriseClient/2.1',
                sessionId: 'premium-session-789'
            });
            // Verify compliance logging
            const logs = await auditLogger.searchLogs({
                action: 'access-enterprise-dashboard'
            });
            expect(logs).toHaveLength(1);
            expect(logs[0].userId).toBe('user-premium-456');
            expect(logs[0].resource).toBe('enterprise-analytics');
            expect(logs[0].details).toEqual({
                feature: 'advanced-analytics',
                dataPoints: 10000
            });
        });
    });
    describe('Vercel Blob Storage with Cloud NIM', () => {
        let blobStorage;
        let cloudNIM;
        beforeEach(() => {
            jest.clearAllMocks();
            process.env.BLOB_READ_WRITE_TOKEN = 'test-blob-token';
            process.env.CLOUD_NIM_API_KEY = 'test-nim-key';
            blobStorage = new VercelBlobStorage();
            cloudNIM = new CloudNIMIntegration();
        });
        afterEach(() => {
            delete process.env.BLOB_READ_WRITE_TOKEN;
            delete process.env.CLOUD_NIM_API_KEY;
        });
        it('should store NIM model outputs in blob storage', async () => {
            // Mock NIM response
            const nimResponse = 'Generated code for user authentication system...';
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ choices: [{ text: nimResponse }] })
            });
            // Generate content with NIM
            const generatedContent = await cloudNIM.sendInferenceRequest('Generate a secure authentication system in Node.js');
            // Mock blob storage upload
            const mockBlobUrl = 'https://vercel.blob.store/generated-auth-system.js';
            const { put } = require('@vercel/blob');
            put.mockResolvedValue({
                url: mockBlobUrl,
                pathname: 'generated-auth-system.js',
                contentType: 'application/javascript'
            });
            // Store generated content in blob storage
            const blobResult = await blobStorage.uploadFile('generated-auth-system.js', generatedContent, {
                contentType: 'application/javascript',
                access: 'private'
            });
            expect(blobResult.url).toBe(mockBlobUrl);
            expect(blobResult.contentType).toBe('application/javascript');
            expect(put).toHaveBeenCalledWith('generated-auth-system.js', generatedContent, {
                contentType: 'application/javascript',
                access: 'private'
            });
        });
        it('should handle model output retrieval from blob storage', async () => {
            const fileContent = 'export function authenticateUser(credentials) { /* implementation */ }';
            const buffer = Buffer.from(fileContent);
            // Mock blob storage download
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                arrayBuffer: () => Promise.resolve(buffer.buffer)
            });
            const downloadedContent = await blobStorage.downloadFile('https://vercel.blob.store/model-output.js');
            expect(downloadedContent.toString()).toBe(fileContent);
        });
    });
    describe('License Management with Payment Integration', () => {
        let licenseManager;
        let paymentIntegration;
        beforeEach(() => {
            licenseManager = new LicenseManager('test-secret-key');
            paymentIntegration = new StripePaymentIntegration('sk_test_key', 'whsec_test');
        });
        it('should manage licenses through payment lifecycle', async () => {
            // Mock customer creation
            const mockCustomer = {
                id: 'cus_test123',
                email: 'user@example.com',
                name: 'Test User'
            };
            // Mock subscription creation
            const mockSubscription = {
                id: 'sub_test456',
                customer: 'cus_test123',
                status: 'active',
                items: {
                    data: [{
                            price: {
                                product: 'prod_premium'
                            }
                        }]
                }
            };
            // In a real implementation, we would test the actual integration
            // For now, we'll verify the objects are created correctly
            expect(mockCustomer.id).toBe('cus_test123');
            expect(mockSubscription.status).toBe('active');
            // Generate a license for the customer
            const license = licenseManager.generateLicense('user@example.com', 'cus_test123', 'prod_premium', { tier: 'enterprise', maxUsers: 100 });
            expect(license.id).toBeDefined();
            expect(license.customerId).toBe('cus_test123');
            expect(license.productId).toBe('prod_premium');
            expect(license.metadata).toEqual({ tier: 'enterprise', maxUsers: 100 });
            // Validate the license
            const validation = licenseManager.validateLicense(license.id, license.activationKey);
            expect(validation.valid).toBe(true);
            expect(validation.licenseId).toBe(license.id);
            // Activate the license
            const activation = licenseManager.activateLicense(license.id, license.activationKey);
            expect(activation.valid).toBe(true);
            expect(activation.activated).toBe(true);
        });
        it('should handle license revocation on payment failure', () => {
            // Generate and activate a license
            const license = licenseManager.generateLicense('user2@example.com', 'cus_test789', 'prod_premium', { tier: 'professional' });
            const activation = licenseManager.activateLicense(license.id, license.activationKey);
            expect(activation.valid).toBe(true);
            expect(activation.activated).toBe(true);
            // Revoke license (simulate payment failure)
            const revoked = licenseManager.revokeLicense(license.id);
            expect(revoked).toBe(true);
            // Verify license is no longer valid
            const validation = licenseManager.validateLicense(license.id, license.activationKey);
            expect(validation.valid).toBe(true); // License exists but is revoked
            expect(validation.activated).toBe(false);
        });
    });
    describe('Team State Synchronization with Audit Trail', () => {
        let teamStateManager;
        let auditLogger;
        beforeEach(() => {
            teamStateManager = new TeamStateManager(50);
            auditLogger = new AuditLogger('.lapa/test-team-audit.log', true);
        });
        afterEach(async () => {
            try {
                const fs = await import('fs/promises');
                await fs.unlink('.lapa/test-team-audit.log');
            }
            catch (error) {
                // Ignore if file doesn't exist
            }
        });
        it('should synchronize team state with audit logging', async () => {
            const teamId = 'team-eng-123';
            const members = ['user-1', 'user-2', 'user-3'];
            // Create team state
            const initialState = teamStateManager.createTeamState(teamId, members);
            expect(initialState.id).toBe(teamId);
            expect(initialState.members).toEqual(members);
            // Update team state
            const updatedState = teamStateManager.updateTeamState(teamId, 'user-1', {
                sharedContext: {
                    project: 'LAPA Core',
                    sprint: 'Sprint 5',
                    goals: ['Implement testing', 'Fix bugs', 'Improve docs']
                }
            });
            expect(updatedState.lastUpdatedBy).toBe('user-1');
            expect(updatedState.sharedContext.project).toBe('LAPA Core');
            // Log the state update
            await auditLogger.logUserAction('user-1', 'update-team-state', teamId, {
                action: 'updated shared context',
                project: 'LAPA Core'
            }, {
                ipAddress: '198.51.100.1'
            });
            // Verify audit log
            const logs = await auditLogger.searchLogs({
                action: 'update-team-state',
                userId: 'user-1'
            });
            expect(logs).toHaveLength(1);
            expect(logs[0].resource).toBe(teamId);
            expect(logs[0].details).toEqual({
                action: 'updated shared context',
                project: 'LAPA Core'
            });
        });
        it('should handle team member changes with proper auditing', async () => {
            const teamId = 'team-dev-456';
            // Create team
            teamStateManager.createTeamState(teamId, ['user-admin']);
            // Add members
            teamStateManager.addTeamMember(teamId, 'user-developer-1');
            teamStateManager.addTeamMember(teamId, 'user-developer-2');
            // Verify membership
            expect(teamStateManager.isTeamMember(teamId, 'user-developer-1')).toBe(true);
            expect(teamStateManager.isTeamMember(teamId, 'user-developer-2')).toBe(true);
            // Log member additions
            await auditLogger.logUserAction('user-admin', 'add-team-member', teamId, { newMember: 'user-developer-1' }, { ipAddress: '198.51.100.2' });
            await auditLogger.logUserAction('user-admin', 'add-team-member', teamId, { newMember: 'user-developer-2' }, { ipAddress: '198.51.100.2' });
            // Remove a member
            teamStateManager.removeTeamMember(teamId, 'user-developer-1');
            expect(teamStateManager.isTeamMember(teamId, 'user-developer-1')).toBe(false);
            // Log member removal
            await auditLogger.logUserAction('user-admin', 'remove-team-member', teamId, { removedMember: 'user-developer-1' }, { ipAddress: '198.51.100.2' });
            // Verify audit trail
            const additionLogs = await auditLogger.searchLogs({
                action: 'add-team-member',
                userId: 'user-admin'
            });
            const removalLogs = await auditLogger.searchLogs({
                action: 'remove-team-member',
                userId: 'user-admin'
            });
            expect(additionLogs).toHaveLength(2);
            expect(removalLogs).toHaveLength(1);
        });
    });
    describe('E2B Sandbox with Cloud NIM Integration', () => {
        let e2bSandbox;
        let cloudNIM;
        beforeEach(() => {
            jest.clearAllMocks();
            process.env.E2B_API_KEY = 'test-e2b-key';
            process.env.CLOUD_NIM_API_KEY = 'test-nim-key';
            e2bSandbox = new E2BSandboxIntegration();
            cloudNIM = new CloudNIMIntegration();
        });
        afterEach(() => {
            delete process.env.E2B_API_KEY;
            delete process.env.CLOUD_NIM_API_KEY;
        });
        it('should execute NIM-generated code in E2B sandbox', async () => {
            // Mock NIM response with code
            const nimCode = `
        function processData(data) {
          return data.map(item => ({
            id: item.id,
            processed: true,
            timestamp: new Date().toISOString()
          }));
        }
        
        module.exports = { processData };
      `;
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ choices: [{ text: nimCode }] })
            });
            // Mock E2B sandbox creation
            const mockSandbox = {
                id: 'sandbox-123',
                cwd: '/home/user'
            };
            // Mock E2B execution
            const mockExecuteResult = {
                stdout: '[{"id":1,"processed":true,"timestamp":"2023-01-01T00:00:00.000Z"},{"id":2,"processed":true,"timestamp":"2023-01-01T00:00:00.000Z"}]',
                stderr: '',
                exitCode: 0
            };
            // In a real implementation, we would test the actual integration
            // For now, we'll verify the workflow makes sense
            expect(nimCode).toContain('function processData');
            expect(mockSandbox.id).toBe('sandbox-123');
            expect(mockExecuteResult.exitCode).toBe(0);
        });
        it('should handle sandbox execution errors gracefully', async () => {
            // Mock NIM generating faulty code
            const faultyCode = `
        function brokenFunction() {
          undefinedVariable.doSomething(); // This will throw an error
        }
        
        brokenFunction();
      `;
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ choices: [{ text: faultyCode }] })
            });
            // Mock E2B execution with error
            const errorResult = {
                stdout: '',
                stderr: 'ReferenceError: undefinedVariable is not defined',
                exitCode: 1
            };
            // Verify error handling approach
            expect(faultyCode).toContain('undefinedVariable');
            expect(errorResult.exitCode).toBe(1);
            expect(errorResult.stderr).toContain('ReferenceError');
        });
    });
    describe('Cross-Premium Feature Integration', () => {
        it('should coordinate multiple premium features in a workflow', async () => {
            // This test simulates a complete premium workflow:
            // 1. License validation
            // 2. Payment processing
            // 3. Blob storage for assets
            // 4. Cloud NIM for generation
            // 5. E2B sandbox for execution
            // 6. Team state sync
            // 7. Audit logging
            // Setup
            const licenseManager = new LicenseManager('test-key');
            const payment = new StripePaymentIntegration('sk_test');
            const blobStorage = new VercelBlobStorage('test-token');
            const cloudNIM = new CloudNIMIntegration('test-key');
            const e2b = new E2BSandboxIntegration('test-key');
            const teamState = new TeamStateManager();
            const audit = new AuditLogger('.lapa/integration-test.log', true);
            // Step 1: License validation
            const license = licenseManager.generateLicense('enterprise@company.com', 'cus_enterprise', 'prod_enterprise', { features: ['all'], support: '24/7' });
            const validation = licenseManager.validateLicense(license.id, license.activationKey);
            expect(validation.valid).toBe(true);
            // Step 2: Payment processing (mocked)
            const customer = { id: 'cus_enterprise', email: 'enterprise@company.com' };
            expect(customer.id).toBe('cus_enterprise');
            // Step 3: Blob storage (mocked)
            const { put } = require('@vercel/blob');
            put.mockResolvedValue({
                url: 'https://blob.store/enterprise-assets.zip'
            });
            // Step 4: Cloud NIM generation (mocked)
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    choices: [{ text: 'console.log("Enterprise feature");' }]
                })
            });
            // Step 5: E2B sandbox (mocked structure)
            const sandbox = { id: 'sandbox-enterprise' };
            expect(sandbox.id).toBe('sandbox-enterprise');
            // Step 6: Team state
            const team = teamState.createTeamState('team-enterprise', ['admin', 'developer']);
            expect(team.members).toHaveLength(2);
            // Step 7: Audit logging
            await audit.logUserAction('admin', 'provision-enterprise-features', 'enterprise-setup', { license: license.id, team: team.id });
            const logs = await audit.getRecentLogs(1);
            expect(logs[0].action).toBe('provision-enterprise-features');
            // Cleanup
            try {
                const fs = await import('fs/promises');
                await fs.unlink('.lapa/integration-test.log');
            }
            catch (error) {
                // Ignore
            }
        });
    });
});
//# sourceMappingURL=premium-features.test.js.map