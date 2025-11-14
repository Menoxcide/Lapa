"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const cloud_nim_integration_ts_1 = require("../../premium/cloud-nim.integration.ts");
const vitest_2 = require("vitest");
// Mock the fetch function
global.fetch = vitest_2.vi.fn();
(0, vitest_1.describe)('CloudNIMIntegration', () => {
    let cloudNIM;
    const mockApiKey = 'test-api-key-123';
    const mockApiBase = 'https://test.nim.cloud';
    const mockModel = 'test-model';
    beforeEach(() => {
        // Clear all mocks before each test
        // All mocks are automatically cleared in vitest
        // Set environment variables
        process.env.CLOUD_NIM_API_KEY = mockApiKey;
        process.env.CLOUD_NIM_API_BASE = mockApiBase;
        process.env.CLOUD_NIM_DEFAULT_MODEL = mockModel;
        cloudNIM = new cloud_nim_integration_ts_1.CloudNIMIntegration();
    });
    afterEach(() => {
        // Clean up environment variables
        delete process.env.CLOUD_NIM_API_KEY;
        delete process.env.CLOUD_NIM_API_BASE;
        delete process.env.CLOUD_NIM_DEFAULT_MODEL;
    });
    (0, vitest_1.describe)('constructor', () => {
        (0, vitest_1.it)('should initialize with environment variables', () => {
            (0, vitest_1.expect)(cloudNIM).toBeDefined();
        });
        (0, vitest_1.it)('should initialize with provided parameters', () => {
            const customNIM = new cloud_nim_integration_ts_1.CloudNIMIntegration('custom-key', 'https://custom.nim.cloud', 'custom-model');
            (0, vitest_1.expect)(customNIM).toBeDefined();
        });
        (0, vitest_1.it)('should throw error when no API key is available', () => {
            // Remove environment variable
            delete process.env.CLOUD_NIM_API_KEY;
            (0, vitest_1.expect)(() => new cloud_nim_integration_ts_1.CloudNIMIntegration()).toThrow('Cloud NIM API key is required');
        });
    });
    (0, vitest_1.describe)('sendInferenceRequest', () => {
        (0, vitest_1.it)('should send inference request successfully', async () => {
            const mockResponse = {
                choices: [{ text: 'Generated response content' }]
            };
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });
            const result = await cloudNIM.sendInferenceRequest('Test prompt');
            (0, vitest_1.expect)(result).toBe('Generated response content');
            (0, vitest_1.expect)(global.fetch).toHaveBeenCalledWith(`${mockApiBase}/v1/completions`, vitest_1.expect.objectContaining({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${mockApiKey}`
                },
                body: JSON.stringify({
                    model: mockModel,
                    prompt: 'Test prompt'
                })
            }));
        });
        (0, vitest_1.it)('should send inference request with custom model and parameters', async () => {
            const mockResponse = {
                choices: [{ text: 'Custom model response' }]
            };
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });
            const result = await cloudNIM.sendInferenceRequest('Test prompt with parameters', 'custom-model', { temperature: 0.7, maxTokens: 100 });
            (0, vitest_1.expect)(result).toBe('Custom model response');
            (0, vitest_1.expect)(global.fetch).toHaveBeenCalledWith(`${mockApiBase}/v1/completions`, vitest_1.expect.objectContaining({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${mockApiKey}`
                },
                body: JSON.stringify({
                    model: 'custom-model',
                    prompt: 'Test prompt with parameters',
                    temperature: 0.7,
                    maxTokens: 100
                })
            }));
        });
        (0, vitest_1.it)('should handle HTTP errors gracefully', async () => {
            global.fetch.mockResolvedValue({
                ok: false,
                status: 401,
                statusText: 'Unauthorized'
            });
            await (0, vitest_1.expect)(cloudNIM.sendInferenceRequest('Test prompt'))
                .rejects.toThrow('Cloud NIM inference request failed: 401 Unauthorized');
        });
        (0, vitest_1.it)('should handle network errors gracefully', async () => {
            global.fetch.mockRejectedValue(new Error('Network error'));
            await (0, vitest_1.expect)(cloudNIM.sendInferenceRequest('Test prompt'))
                .rejects.toThrow('Network error');
        });
        (0, vitest_1.it)('should handle malformed response', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({}) // Missing choices array
            });
            await (0, vitest_1.expect)(cloudNIM.sendInferenceRequest('Test prompt'))
                .rejects.toThrow(); // Will throw when accessing choices[0]
        });
    });
    (0, vitest_1.describe)('listModels', () => {
        (0, vitest_1.it)('should list models successfully', async () => {
            const mockModels = {
                data: [
                    { id: 'model-1', name: 'Model 1' },
                    { id: 'model-2', name: 'Model 2' }
                ]
            };
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockModels)
            });
            const result = await cloudNIM.listModels();
            (0, vitest_1.expect)(result).toEqual(mockModels.data);
            (0, vitest_1.expect)(global.fetch).toHaveBeenCalledWith(`${mockApiBase}/v1/models`, vitest_1.expect.objectContaining({
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${mockApiKey}`
                }
            }));
        });
        (0, vitest_1.it)('should handle list models HTTP errors', async () => {
            global.fetch.mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            });
            await (0, vitest_1.expect)(cloudNIM.listModels())
                .rejects.toThrow('Failed to list models: 500 Internal Server Error');
        });
        (0, vitest_1.it)('should handle list models network errors', async () => {
            global.fetch.mockRejectedValue(new Error('Connection failed'));
            await (0, vitest_1.expect)(cloudNIM.listModels())
                .rejects.toThrow('Connection failed');
        });
    });
    (0, vitest_1.describe)('getModelInfo', () => {
        (0, vitest_1.it)('should get model info successfully', async () => {
            const mockModelInfo = {
                id: 'test-model',
                name: 'Test Model',
                description: 'A test model for development',
                capabilities: ['text-generation']
            };
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockModelInfo)
            });
            const result = await cloudNIM.getModelInfo('test-model');
            (0, vitest_1.expect)(result).toEqual(mockModelInfo);
            (0, vitest_1.expect)(global.fetch).toHaveBeenCalledWith(`${mockApiBase}/v1/models/test-model`, vitest_1.expect.objectContaining({
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${mockApiKey}`
                }
            }));
        });
        (0, vitest_1.it)('should handle get model info HTTP errors', async () => {
            global.fetch.mockResolvedValue({
                ok: false,
                status: 404,
                statusText: 'Not Found'
            });
            await (0, vitest_1.expect)(cloudNIM.getModelInfo('non-existent-model'))
                .rejects.toThrow('Failed to get model info: 404 Not Found');
        });
        (0, vitest_1.it)('should handle get model info network errors', async () => {
            global.fetch.mockRejectedValue(new Error('Timeout'));
            await (0, vitest_1.expect)(cloudNIM.getModelInfo('test-model'))
                .rejects.toThrow('Timeout');
        });
    });
    (0, vitest_1.describe)('checkHealth', () => {
        (0, vitest_1.it)('should check health successfully when service is up', async () => {
            global.fetch.mockResolvedValue({
                ok: true
            });
            const result = await cloudNIM.checkHealth();
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(global.fetch).toHaveBeenCalledWith(`${mockApiBase}/health`, vitest_1.expect.objectContaining({
                method: 'GET'
            }));
        });
        (0, vitest_1.it)('should check health and return false when service is down', async () => {
            global.fetch.mockResolvedValue({
                ok: false
            });
            const result = await cloudNIM.checkHealth();
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should handle health check network errors', async () => {
            global.fetch.mockRejectedValue(new Error('DNS lookup failed'));
            const result = await cloudNIM.checkHealth();
            (0, vitest_1.expect)(result).toBe(false);
        });
    });
});
//# sourceMappingURL=cloud-nim.integration.test.js.map