import { CloudNIMIntegration } from '../../src/premium/cloud-nim.integration';

// Mock the fetch function
global.fetch = jest.fn();

describe('CloudNIMIntegration', () => {
  let cloudNIM: CloudNIMIntegration;
  const mockApiKey = 'test-api-key-123';
  const mockApiBase = 'https://test.nim.cloud';
  const mockModel = 'test-model';

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Set environment variables
    process.env.CLOUD_NIM_API_KEY = mockApiKey;
    process.env.CLOUD_NIM_API_BASE = mockApiBase;
    process.env.CLOUD_NIM_DEFAULT_MODEL = mockModel;
    
    cloudNIM = new CloudNIMIntegration();
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.CLOUD_NIM_API_KEY;
    delete process.env.CLOUD_NIM_API_BASE;
    delete process.env.CLOUD_NIM_DEFAULT_MODEL;
  });

  describe('constructor', () => {
    it('should initialize with environment variables', () => {
      expect(cloudNIM).toBeDefined();
    });

    it('should initialize with provided parameters', () => {
      const customNIM = new CloudNIMIntegration('custom-key', 'https://custom.nim.cloud', 'custom-model');
      expect(customNIM).toBeDefined();
    });

    it('should throw error when no API key is available', () => {
      // Remove environment variable
      delete process.env.CLOUD_NIM_API_KEY;
      
      expect(() => new CloudNIMIntegration()).toThrow('Cloud NIM API key is required');
    });
  });

  describe('sendInferenceRequest', () => {
    it('should send inference request successfully', async () => {
      const mockResponse = {
        choices: [{ text: 'Generated response content' }]
      };
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });
      
      const result = await cloudNIM.sendInferenceRequest('Test prompt');
      
      expect(result).toBe('Generated response content');
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockApiBase}/v1/completions`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockApiKey}`
          },
          body: JSON.stringify({
            model: mockModel,
            prompt: 'Test prompt'
          })
        })
      );
    });

    it('should send inference request with custom model and parameters', async () => {
      const mockResponse = {
        choices: [{ text: 'Custom model response' }]
      };
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });
      
      const result = await cloudNIM.sendInferenceRequest(
        'Test prompt with parameters',
        'custom-model',
        { temperature: 0.7, maxTokens: 100 }
      );
      
      expect(result).toBe('Custom model response');
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockApiBase}/v1/completions`,
        expect.objectContaining({
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
        })
      );
    });

    it('should handle HTTP errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });
      
      await expect(cloudNIM.sendInferenceRequest('Test prompt'))
        .rejects.toThrow('Cloud NIM inference request failed: 401 Unauthorized');
    });

    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      await expect(cloudNIM.sendInferenceRequest('Test prompt'))
        .rejects.toThrow('Network error');
    });

    it('should handle malformed response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}) // Missing choices array
      });
      
      await expect(cloudNIM.sendInferenceRequest('Test prompt'))
        .rejects.toThrow(); // Will throw when accessing choices[0]
    });
  });

  describe('listModels', () => {
    it('should list models successfully', async () => {
      const mockModels = {
        data: [
          { id: 'model-1', name: 'Model 1' },
          { id: 'model-2', name: 'Model 2' }
        ]
      };
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockModels)
      });
      
      const result = await cloudNIM.listModels();
      
      expect(result).toEqual(mockModels.data);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockApiBase}/v1/models`,
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${mockApiKey}`
          }
        })
      );
    });

    it('should handle list models HTTP errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });
      
      await expect(cloudNIM.listModels())
        .rejects.toThrow('Failed to list models: 500 Internal Server Error');
    });

    it('should handle list models network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Connection failed'));
      
      await expect(cloudNIM.listModels())
        .rejects.toThrow('Connection failed');
    });
  });

  describe('getModelInfo', () => {
    it('should get model info successfully', async () => {
      const mockModelInfo = {
        id: 'test-model',
        name: 'Test Model',
        description: 'A test model for development',
        capabilities: ['text-generation']
      };
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockModelInfo)
      });
      
      const result = await cloudNIM.getModelInfo('test-model');
      
      expect(result).toEqual(mockModelInfo);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockApiBase}/v1/models/test-model`,
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${mockApiKey}`
          }
        })
      );
    });

    it('should handle get model info HTTP errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });
      
      await expect(cloudNIM.getModelInfo('non-existent-model'))
        .rejects.toThrow('Failed to get model info: 404 Not Found');
    });

    it('should handle get model info network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Timeout'));
      
      await expect(cloudNIM.getModelInfo('test-model'))
        .rejects.toThrow('Timeout');
    });
  });

  describe('checkHealth', () => {
    it('should check health successfully when service is up', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true
      });
      
      const result = await cloudNIM.checkHealth();
      
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockApiBase}/health`,
        expect.objectContaining({
          method: 'GET'
        })
      );
    });

    it('should check health and return false when service is down', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false
      });
      
      const result = await cloudNIM.checkHealth();
      
      expect(result).toBe(false);
    });

    it('should handle health check network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('DNS lookup failed'));
      
      const result = await cloudNIM.checkHealth();
      
      expect(result).toBe(false);
    });
  });
});