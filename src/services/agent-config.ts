// Agent Configuration Service
// Manages individual AI agent settings and model assignments

import { PersonaType } from '../shared/types/index.js';
import { AgentConfig } from './llm.js';
import { ModelAvailabilityService, ModelInfo } from './model-availability.js';
import { ModelRecommendationService } from './model-recommendations.js';

export interface StoredAgentConfig {
  [key: string]: {
    provider: 'openai' | 'anthropic' | 'gemini' | 'local';
    model: string;
  };
}

export class AgentConfigService {
  private static STORAGE_KEY = 'agent-configurations';

  /**
   * Get configuration for a specific agent
   */
  public static getAgentConfig(persona: PersonaType): AgentConfig | null {
    try {
      const configs = this.loadStoredConfigs();
      const config = configs[persona];
      
      console.log(`DEBUG: getAgentConfig for ${persona}:`, config);
      
      if (!config) return null;

      // Get API key from global settings
      const apiKey = this.getGlobalAPIKey(config.provider);
      console.log(`DEBUG: API key for ${config.provider}:`, apiKey ? '[PRESENT]' : '[MISSING]');
      
      return {
        persona,
        provider: config.provider,
        model: config.model,
        apiKey: apiKey || undefined,
        baseUrl: config.provider === 'local' ? (apiKey || undefined) : undefined
      };
    } catch (error) {
      console.error('Failed to load agent config:', error);
      return null;
    }
  }

  /**
   * Save configuration for a specific agent
   */
  public static saveAgentConfig(persona: PersonaType, config: Omit<AgentConfig, 'persona'>): void {
    try {
      // Check if localStorage is available (renderer process only)
      if (typeof localStorage === 'undefined') {
        console.log('DEBUG: localStorage not available in main process, cannot save config');
        return;
      }
      
      const configs = this.loadStoredConfigs();
      configs[persona] = {
        provider: config.provider,
        model: config.model
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs));
    } catch (error) {
      console.error('Failed to save agent config:', error);
    }
  }

  /**
   * Get all agent configurations
   */
  public static getAllAgentConfigs(): StoredAgentConfig {
    return this.loadStoredConfigs();
  }

  /**
   * Reset all agent configurations
   */
  public static resetAllConfigs(): void {
    // Check if localStorage is available (renderer process only)
    if (typeof localStorage === 'undefined') {
      console.log('DEBUG: localStorage not available in main process, cannot reset configs');
      return;
    }
    
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Check if an agent is configured
   */
  public static isAgentConfigured(persona: PersonaType): boolean {
    const configs = this.loadStoredConfigs();
    const config = configs[persona];
    
    if (!config) return false;

    // Check if agent has provider and model selected
    if (!config.provider || !config.model) return false;
    
    // Check if global API key exists for this provider
    const apiKey = this.getGlobalAPIKey(config.provider);
    return !!apiKey;
  }

  /**
   * Get default configuration from global settings
   */
  public static getDefaultConfig(): AgentConfig | null {
    try {
      // Check if localStorage is available (renderer process only)
      if (typeof localStorage === 'undefined') {
        console.log('DEBUG: localStorage not available in main process, cannot get default config');
        return null;
      }
      
      const globalSettings = localStorage.getItem('llm-settings');
      if (!globalSettings) return null;

      const settings = JSON.parse(globalSettings);
      return {
        persona: 'CREATIVE_STRATEGIST', // Default persona
        provider: settings.provider,
        model: settings.model,
        apiKey: settings.apiKey,
        baseUrl: settings.baseUrl
      };
    } catch (error) {
      console.error('Failed to load default config:', error);
      return null;
    }
  }

  /**
   * Apply global settings to all unconfigured agents
   */
  public static applyGlobalSettingsToAll(): void {
    const defaultConfig = this.getDefaultConfig();
    if (!defaultConfig) return;

    const personas: PersonaType[] = [
      'CREATIVE_STRATEGIST',
      'BAFFLING_BROADCASTER', 
      'SATIRICAL_SCREENWRITER',
      'CINEMATIC_STORYBOARDER',
      'SOUNDSCAPE_ARCHITECT',
      'VIDEO_PROMPT_ENGINEER',
      'PROJECT_DIRECTOR'
    ];

    personas.forEach(persona => {
      if (!this.isAgentConfigured(persona)) {
        this.saveAgentConfig(persona, {
          provider: defaultConfig.provider,
          model: defaultConfig.model,
          apiKey: defaultConfig.apiKey,
          baseUrl: defaultConfig.baseUrl
        });
      }
    });
  }

  /**
   * Load stored configurations from localStorage (or return empty if not available)
   */
  private static loadStoredConfigs(): StoredAgentConfig {
    try {
      // Check if localStorage is available (renderer process only)
      if (typeof localStorage === 'undefined') {
        console.log('DEBUG: localStorage not available in main process, returning empty configs');
        return {};
      }
      
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const configs = stored ? JSON.parse(stored) : {};
      console.log('DEBUG: loadStoredConfigs:', configs);
      return configs;
    } catch (error) {
      console.error('Failed to parse stored agent configs:', error);
      return {};
    }
  }

  /**
   * Get API key for provider from global settings
   */
  private static getGlobalAPIKey(provider: string): string | null {
    try {
      // Check if localStorage is available (renderer process only)
      if (typeof localStorage === 'undefined') {
        console.log('DEBUG: localStorage not available in main process, cannot get API key');
        return null;
      }
      
      const globalSettings = localStorage.getItem('global-api-settings');
      console.log('DEBUG: globalSettings raw:', globalSettings);
      
      if (!globalSettings) return null;
      
      const settings = JSON.parse(globalSettings);
      console.log('DEBUG: parsed settings:', settings);
      
      switch (provider) {
        case 'openai': return settings.openai_api_key || null;
        case 'anthropic': return settings.anthropic_api_key || null;
        case 'gemini': return settings.gemini_api_key || null;
        case 'local': return settings.local_base_url || null;
        default: return null;
      }
    } catch (error) {
      console.error('Failed to load global API settings:', error);
      return null;
    }
  }

  /**
   * Get available models for a provider (with real-time checking)
   */
  public static async getModelsForProviderDynamic(provider: string, apiKey?: string): Promise<{ value: string; label: string; deprecated?: boolean; error?: string }[]> {
    try {
      const result = await ModelAvailabilityService.checkAvailableModels(provider, apiKey);
      
      if (result.success) {
        return result.models.map(model => ({
          value: model.id,
          label: model.displayName + (model.deprecated ? ' (deprecated)' : ''),
          deprecated: model.deprecated
        }));
      } else {
        console.warn(`Failed to fetch dynamic models for ${provider}:`, result.error);
        // Fallback to static models
        return this.getModelsForProvider(provider).map(model => ({
          ...model,
          error: 'Could not verify availability'
        }));
      }
    } catch (error) {
      console.error(`Error fetching models for ${provider}:`, error);
      return this.getModelsForProvider(provider).map(model => ({
        ...model,
        error: 'Error checking availability'
      }));
    }
  }

  /**
   * Get available models for a provider (static fallback)
   */
  public static getModelsForProvider(provider: string): { value: string; label: string; }[] {
    switch (provider) {
      case 'openai':
        return [
          { value: 'gpt-4o', label: 'GPT-4o (Recommended - Multimodal)' },
          { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Affordable)' },
          { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (Large Context)' },
          { value: 'gpt-4', label: 'GPT-4 (Reliable)' },
          { value: 'o1-preview', label: 'o1 Preview (Complex Reasoning)' },
          { value: 'o1-mini', label: 'o1 Mini (Reasoning - Budget)' },
          { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Budget)' }
        ];
      case 'anthropic':
        return [
          { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Recommended - Latest)' },
          { value: 'claude-3-5-sonnet-20240620', label: 'Claude 3.5 Sonnet (Previous Version)' },
          { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (Fastest)' },
          { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus (Complex Reasoning)' },
          { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet (Stable)' },
          { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Budget)' }
        ];
      case 'gemini':
        return [
          { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Recommended - Best Reasoning)' },
          { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Best Price/Performance)' },
          { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite (Fastest & Cheapest)' },
          { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Large Context - 2M tokens)' },
          { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Reliable)' },
          { value: 'gemini-1.5-flash-8b', label: 'Gemini 1.5 Flash 8B (Budget)' },
          { value: 'gemini-pro', label: 'Gemini Pro (Legacy)' }
        ];
      case 'local':
        return [
          { value: 'llama3.1:70b', label: 'Llama 3.1 70B (Best Overall)' },
          { value: 'llama3.1:8b', label: 'Llama 3.1 8B (Fast & Capable)' },
          { value: 'llama3.2:3b', label: 'Llama 3.2 3B (Lightweight)' },
          { value: 'qwen2.5:72b', label: 'Qwen 2.5 72B (Excellent)' },
          { value: 'qwen2.5:32b', label: 'Qwen 2.5 32B (Strong)' },
          { value: 'deepseek-coder-v2:16b', label: 'DeepSeek Coder V2 16B (Coding)' },
          { value: 'mistral-nemo:12b', label: 'Mistral Nemo 12B (Balanced)' },
          { value: 'codellama:13b', label: 'Code Llama 13B (Legacy Coding)' },
          { value: 'phi3.5:3.8b', label: 'Phi 3.5 (Microsoft - Compact)' }
        ];
      default:
        return [];
    }
  }

  /**
   * Validate agent configuration and suggest fixes
   */
  public static async validateAgentConfig(persona: PersonaType): Promise<{
    isValid: boolean;
    issues: string[];
    suggestions: { action: string; description: string; data?: any }[];
  }> {
    const issues: string[] = [];
    const suggestions: { action: string; description: string; data?: any }[] = [];

    try {
      const config = this.getAgentConfig(persona);
      
      if (!config) {
        return {
          isValid: false,
          issues: ['No configuration found for this agent'],
          suggestions: [{
            action: 'configure',
            description: 'Configure this agent with a provider and model'
          }]
        };
      }

      // Check if API key is available
      const apiKey = this.getGlobalAPIKey(config.provider);
      if (!apiKey && config.provider !== 'local') {
        issues.push(`No API key found for ${config.provider}`);
        suggestions.push({
          action: 'setup-api',
          description: `Configure ${config.provider} API key in global settings`
        });
      }

      // Validate model availability
      if (apiKey || config.provider === 'local') {
        const modelValidation = await ModelAvailabilityService.validateModel(
          config.provider, 
          config.model, 
          apiKey || undefined
        );

        if (!modelValidation.isValid) {
          issues.push(`Model "${config.model}" is not available`);
          
          if (modelValidation.suggestedReplacement) {
            suggestions.push({
              action: 'update-model',
              description: `Update to suggested model: ${modelValidation.suggestedReplacement}`,
              data: { newModel: modelValidation.suggestedReplacement }
            });
          }
        } else if (modelValidation.isDeprecated) {
          issues.push(`Model "${config.model}" is deprecated`);
          suggestions.push({
            action: 'update-model',
            description: 'Consider updating to a newer model version'
          });
        }
      }

      return {
        isValid: issues.length === 0,
        issues,
        suggestions
      };

    } catch (error) {
      return {
        isValid: false,
        issues: [`Error validating configuration: ${error}`],
        suggestions: [{
          action: 'reconfigure',
          description: 'Reconfigure this agent due to validation errors'
        }]
      };
    }
  }

  /**
   * Auto-fix agent configuration issues
   */
  public static async autoFixAgentConfig(persona: PersonaType): Promise<{
    success: boolean;
    changes: string[];
    error?: string;
  }> {
    try {
      const validation = await this.validateAgentConfig(persona);
      const changes: string[] = [];

      if (validation.isValid) {
        return { success: true, changes: ['No fixes needed'] };
      }

      // Apply automatic fixes
      for (const suggestion of validation.suggestions) {
        if (suggestion.action === 'update-model' && suggestion.data?.newModel) {
          const currentConfig = this.getAgentConfig(persona);
          if (currentConfig) {
            this.saveAgentConfig(persona, {
              provider: currentConfig.provider,
              model: suggestion.data.newModel,
              apiKey: currentConfig.apiKey,
              baseUrl: currentConfig.baseUrl
            });
            changes.push(`Updated model to ${suggestion.data.newModel}`);
          }
        }
      }

      return { success: true, changes };

    } catch (error) {
      return {
        success: false,
        changes: [],
        error: `Auto-fix failed: ${error}`
      };
    }
  }

  /**
   * Check all agent configurations and return summary
   */
  public static async validateAllAgents(): Promise<{
    [key: string]: {
      persona: PersonaType;
      isValid: boolean;
      issues: string[];
      needsAttention: boolean;
    }
  }> {
    const personas: PersonaType[] = [
      'CREATIVE_STRATEGIST',
      'BAFFLING_BROADCASTER', 
      'SATIRICAL_SCREENWRITER',
      'CINEMATIC_STORYBOARDER',
      'SOUNDSCAPE_ARCHITECT',
      'VIDEO_PROMPT_ENGINEER',
      'PROJECT_DIRECTOR'
    ];

    const results: any = {};

    for (const persona of personas) {
      const validation = await this.validateAgentConfig(persona);
      results[persona] = {
        persona,
        isValid: validation.isValid,
        issues: validation.issues,
        needsAttention: !validation.isValid || validation.suggestions.some(s => s.action === 'update-model')
      };
    }

    return results;
  }

  /**
   * Get persona display names
   */
  public static getPersonaDisplayName(persona: PersonaType): string {
    const names = {
      'CREATIVE_STRATEGIST': 'Creative Strategist',
      'BAFFLING_BROADCASTER': 'Baffling Broadcaster',
      'SATIRICAL_SCREENWRITER': 'Satirical Screenwriter',
      'CINEMATIC_STORYBOARDER': 'Cinematic Storyboarder',
      'SOUNDSCAPE_ARCHITECT': 'Soundscape Architect',
      'VIDEO_PROMPT_ENGINEER': 'Video Prompt Engineer',
      'PROJECT_DIRECTOR': 'Project Director'
    };
    return names[persona] || persona;
  }

  /**
   * Get intelligent model recommendation for a persona
   */
  public static getRecommendedModel(persona: PersonaType): { 
    provider: string; 
    model: string; 
    reason: string; 
    alternatives?: Array<{ provider: string; model: string; reason: string }> 
  } {
    const recommendation = ModelRecommendationService.getPersonaRecommendation(persona);
    
    return {
      provider: recommendation.provider,
      model: recommendation.model,
      reason: recommendation.reason,
      alternatives: recommendation.alternatives?.map(alt => ({
        provider: alt.provider,
        model: alt.model,
        reason: alt.reason
      }))
    };
  }

  /**
   * Get all task-specific recommendations with explanations
   */
  public static getTaskRecommendations(): { [taskType: string]: { provider: string; model: string; reason: string } } {
    return {
      'Video Prompt Engineering (Veo3)': {
        provider: 'gemini',
        model: 'gemini-2.5-pro',
        reason: 'Gemini models have native integration with Veo3 through Google\'s ecosystem and understand video generation requirements best.'
      },
      'Creative Writing & Scripts': {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        reason: 'Claude excels at creative writing, satirical content, and nuanced storytelling.'
      },
      'Complex Analysis & Strategy': {
        provider: 'anthropic',
        model: 'claude-3-opus-20240229',
        reason: 'Claude 3 Opus provides the deepest reasoning capabilities for strategic thinking.'
      },
      'Fast Content Generation': {
        provider: 'anthropic',
        model: 'claude-3-5-haiku-20241022',
        reason: 'Claude 3.5 Haiku offers the fastest response times while maintaining quality.'
      },
      'Multimodal Analysis': {
        provider: 'gemini',
        model: 'gemini-2.5-pro',
        reason: 'Gemini excels at analyzing images, videos, and documents together.'
      },
      'Budget-Conscious Tasks': {
        provider: 'gemini',
        model: 'gemini-2.5-flash-lite',
        reason: 'Best cost efficiency while maintaining good quality for most tasks.'
      }
    };
  }
}