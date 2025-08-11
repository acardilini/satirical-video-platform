// Model Availability Service
// Checks which AI models are currently available for each provider

export interface ModelInfo {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  deprecated?: boolean;
  maxTokens?: number;
  contextLength?: number;
}

export interface ModelAvailabilityResult {
  success: boolean;
  models: ModelInfo[];
  error?: string;
  lastChecked: Date;
}

export class ModelAvailabilityService {
  private static cache: Map<string, { result: ModelAvailabilityResult; expiry: number }> = new Map();
  private static CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  /**
   * Check available models for a provider
   */
  public static async checkAvailableModels(provider: string, apiKey?: string): Promise<ModelAvailabilityResult> {
    // Check cache first
    const cacheKey = `${provider}-${apiKey ? 'authenticated' : 'public'}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() < cached.expiry) {
      console.log(`DEBUG: Using cached models for ${provider}`);
      return cached.result;
    }

    console.log(`DEBUG: Fetching available models for ${provider}`);

    let result: ModelAvailabilityResult;
    
    try {
      switch (provider) {
        case 'openai':
          result = await this.checkOpenAIModels(apiKey);
          break;
        case 'anthropic':
          result = await this.checkAnthropicModels(apiKey);
          break;
        case 'gemini':
          result = await this.checkGeminiModels(apiKey);
          break;
        case 'local':
          result = await this.checkLocalModels();
          break;
        default:
          result = {
            success: false,
            models: [],
            error: `Unknown provider: ${provider}`,
            lastChecked: new Date()
          };
      }

      // Cache the result
      this.cache.set(cacheKey, {
        result,
        expiry: Date.now() + this.CACHE_DURATION
      });

      return result;
    } catch (error) {
      console.error(`Failed to check models for ${provider}:`, error);
      return {
        success: false,
        models: [],
        error: `Failed to check models: ${error}`,
        lastChecked: new Date()
      };
    }
  }

  /**
   * Check OpenAI models
   */
  private static async checkOpenAIModels(apiKey?: string): Promise<ModelAvailabilityResult> {
    if (!apiKey) {
      return {
        success: false,
        models: [],
        error: 'OpenAI API key required to check available models',
        lastChecked: new Date()
      };
    }

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return {
          success: false,
          models: [],
          error: `OpenAI API error: ${response.status}`,
          lastChecked: new Date()
        };
      }

      const data = await response.json();
      const models: ModelInfo[] = data.data
        .filter((model: any) => model.id.startsWith('gpt-'))
        .map((model: any) => ({
          id: model.id,
          name: model.id,
          displayName: this.formatModelName(model.id),
          description: `OpenAI ${this.formatModelName(model.id)}`
        }))
        .sort((a: ModelInfo, b: ModelInfo) => a.displayName.localeCompare(b.displayName));

      return {
        success: true,
        models,
        lastChecked: new Date()
      };
    } catch (error) {
      return {
        success: false,
        models: [],
        error: `Failed to fetch OpenAI models: ${error}`,
        lastChecked: new Date()
      };
    }
  }

  /**
   * Check Anthropic models (Claude)
   */
  private static async checkAnthropicModels(apiKey?: string): Promise<ModelAvailabilityResult> {
    // Anthropic doesn't have a public models endpoint, so we'll use known models
    // and validate by making a test call (with minimal usage)
    const knownModels = [
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'claude-3-5-sonnet-20241022',
        displayName: 'Claude 3.5 Sonnet (Latest)',
        description: 'Most capable Claude model'
      },
      {
        id: 'claude-3-5-sonnet-20240620',
        name: 'claude-3-5-sonnet-20240620', 
        displayName: 'Claude 3.5 Sonnet (Previous)',
        description: 'Previous version of Claude 3.5 Sonnet'
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'claude-3-opus-20240229',
        displayName: 'Claude 3 Opus',
        description: 'Most powerful Claude 3 model'
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'claude-3-sonnet-20240229',
        displayName: 'Claude 3 Sonnet',
        description: 'Balanced Claude 3 model'
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'claude-3-haiku-20240307',
        displayName: 'Claude 3 Haiku',
        description: 'Fastest Claude 3 model'
      }
    ];

    if (!apiKey) {
      return {
        success: true,
        models: knownModels,
        lastChecked: new Date()
      };
    }

    // Test the first model to validate API key
    try {
      const testResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }]
        })
      });

      const responseData = await testResponse.json();

      if (testResponse.ok || (responseData.error && responseData.error.type !== 'authentication_error')) {
        return {
          success: true,
          models: knownModels,
          lastChecked: new Date()
        };
      } else if (responseData.error && responseData.error.type === 'authentication_error') {
        return {
          success: false,
          models: [],
          error: 'Invalid Anthropic API key',
          lastChecked: new Date()
        };
      } else {
        return {
          success: true,
          models: knownModels,
          lastChecked: new Date()
        };
      }
    } catch (error) {
      // If test fails, still return known models but mark as unverified
      return {
        success: true,
        models: knownModels.map(model => ({
          ...model,
          description: `${model.description} (unverified)`
        })),
        lastChecked: new Date()
      };
    }
  }

  /**
   * Check Google Gemini models
   */
  private static async checkGeminiModels(apiKey?: string): Promise<ModelAvailabilityResult> {
    // Gemini has a models list endpoint
    const knownModels = [
      {
        id: 'gemini-1.5-pro',
        name: 'gemini-1.5-pro',
        displayName: 'Gemini 1.5 Pro',
        description: 'Most capable Gemini model'
      },
      {
        id: 'gemini-1.5-flash',
        name: 'gemini-1.5-flash',
        displayName: 'Gemini 1.5 Flash',
        description: 'Fast and efficient Gemini model'
      },
      {
        id: 'gemini-pro',
        name: 'gemini-pro',
        displayName: 'Gemini Pro',
        description: 'Standard Gemini Pro model'
      }
    ];

    if (!apiKey) {
      return {
        success: true,
        models: knownModels,
        lastChecked: new Date()
      };
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      
      if (!response.ok) {
        return {
          success: false,
          models: [],
          error: `Gemini API error: ${response.status}`,
          lastChecked: new Date()
        };
      }

      const data = await response.json();
      const availableModels: ModelInfo[] = data.models
        ?.filter((model: any) => model.name.includes('gemini') && model.supportedGenerationMethods?.includes('generateContent'))
        ?.map((model: any) => ({
          id: model.name.replace('models/', ''),
          name: model.name.replace('models/', ''),
          displayName: model.displayName || this.formatModelName(model.name.replace('models/', '')),
          description: model.description || `Google ${model.displayName || model.name}`
        })) || knownModels;

      return {
        success: true,
        models: availableModels.length > 0 ? availableModels : knownModels,
        lastChecked: new Date()
      };
    } catch (error) {
      return {
        success: true,
        models: knownModels,
        error: `Could not verify Gemini models: ${error}`,
        lastChecked: new Date()
      };
    }
  }

  /**
   * Check local models (Ollama, LM Studio, etc.)
   */
  private static async checkLocalModels(baseUrl: string = 'http://localhost:11434'): Promise<ModelAvailabilityResult> {
    try {
      const response = await fetch(`${baseUrl}/api/tags`);
      
      if (!response.ok) {
        return {
          success: false,
          models: this.getDefaultLocalModels(),
          error: 'Local LLM server not available',
          lastChecked: new Date()
        };
      }

      const data = await response.json();
      const models: ModelInfo[] = data.models?.map((model: any) => ({
        id: model.name,
        name: model.name,
        displayName: this.formatModelName(model.name),
        description: `Local model: ${model.name}`,
        contextLength: model.details?.parameter_size
      })) || this.getDefaultLocalModels();

      return {
        success: true,
        models: models.length > 0 ? models : this.getDefaultLocalModels(),
        lastChecked: new Date()
      };
    } catch (error) {
      return {
        success: false,
        models: this.getDefaultLocalModels(),
        error: `Failed to connect to local LLM server: ${error}`,
        lastChecked: new Date()
      };
    }
  }

  /**
   * Get default local models when server is not available
   */
  private static getDefaultLocalModels(): ModelInfo[] {
    return [
      {
        id: 'llama2',
        name: 'llama2',
        displayName: 'Llama 2',
        description: 'Meta Llama 2 model'
      },
      {
        id: 'mistral',
        name: 'mistral',
        displayName: 'Mistral',
        description: 'Mistral AI model'
      },
      {
        id: 'codellama',
        name: 'codellama',
        displayName: 'Code Llama',
        description: 'Meta Code Llama model'
      },
      {
        id: 'neural-chat',
        name: 'neural-chat',
        displayName: 'Neural Chat',
        description: 'Intel Neural Chat model'
      }
    ];
  }

  /**
   * Format model name for display
   */
  private static formatModelName(modelId: string): string {
    return modelId
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/Gpt/g, 'GPT')
      .replace(/Api/g, 'API')
      .replace(/Ai/g, 'AI');
  }

  /**
   * Validate if a specific model is available
   */
  public static async validateModel(provider: string, modelId: string, apiKey?: string): Promise<{
    isValid: boolean;
    isDeprecated?: boolean;
    suggestedReplacement?: string;
    error?: string;
  }> {
    const availableModels = await this.checkAvailableModels(provider, apiKey);
    
    if (!availableModels.success) {
      return {
        isValid: false,
        error: availableModels.error
      };
    }

    const model = availableModels.models.find(m => m.id === modelId || m.name === modelId);
    
    if (!model) {
      // Try to suggest a replacement
      const suggestedReplacement = this.suggestModelReplacement(provider, modelId, availableModels.models);
      
      return {
        isValid: false,
        error: 'Model not found in available models',
        suggestedReplacement
      };
    }

    return {
      isValid: true,
      isDeprecated: model.deprecated || false
    };
  }

  /**
   * Suggest a replacement model when current model is not available
   */
  private static suggestModelReplacement(provider: string, oldModelId: string, availableModels: ModelInfo[]): string | undefined {
    // Provider-specific replacement logic
    switch (provider) {
      case 'openai':
        if (oldModelId.includes('gpt-3.5')) return 'gpt-4';
        if (oldModelId.includes('gpt-4')) return availableModels.find(m => m.id.includes('gpt-4'))?.id;
        break;
        
      case 'anthropic':
        if (oldModelId.includes('claude-3-sonnet')) return 'claude-3-5-sonnet-20241022';
        if (oldModelId.includes('claude-3')) return 'claude-3-5-sonnet-20241022';
        break;
        
      case 'gemini':
        if (oldModelId.includes('gemini-pro')) return 'gemini-1.5-pro';
        break;
    }

    // Fallback: return the first available model
    return availableModels[0]?.id;
  }

  /**
   * Clear model cache (useful for forced refresh)
   */
  public static clearCache(): void {
    this.cache.clear();
    console.log('DEBUG: Model availability cache cleared');
  }

  /**
   * Get cache status for debugging
   */
  public static getCacheStatus(): { [key: string]: { expiry: Date; modelCount: number } } {
    const status: any = {};
    
    this.cache.forEach((value, key) => {
      status[key] = {
        expiry: new Date(value.expiry),
        modelCount: value.result.models.length
      };
    });
    
    return status;
  }
}