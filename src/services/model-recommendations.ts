// Task-Specific AI Model Recommendations Service
// Provides intelligent model suggestions based on specific tasks and workflow requirements

export interface ModelRecommendation {
  provider: 'openai' | 'anthropic' | 'gemini' | 'local';
  model: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  costEfficiency: 'excellent' | 'good' | 'moderate' | 'expensive';
  alternatives?: ModelRecommendation[];
}

export interface TaskContext {
  taskType: 'video_prompt_engineering' | 'content_generation' | 'script_writing' | 'creative_strategy' | 'analysis' | 'general';
  complexity: 'simple' | 'moderate' | 'complex';
  budget: 'cost_conscious' | 'balanced' | 'premium';
  speed: 'priority' | 'balanced' | 'quality_over_speed';
  multimodal?: boolean;
  reasoning_intensive?: boolean;
}

export class ModelRecommendationService {
  
  /**
   * Get recommended model for a specific task
   */
  public static getRecommendation(context: TaskContext): ModelRecommendation {
    // Special case: Video Prompt Engineering for Veo3
    if (context.taskType === 'video_prompt_engineering') {
      return this.getVeo3OptimizedRecommendation(context);
    }

    // Content Generation Tasks
    if (context.taskType === 'content_generation' || context.taskType === 'script_writing') {
      return this.getContentGenerationRecommendation(context);
    }

    // Creative Strategy Tasks
    if (context.taskType === 'creative_strategy') {
      return this.getCreativeStrategyRecommendation(context);
    }

    // Analysis Tasks
    if (context.taskType === 'analysis') {
      return this.getAnalysisRecommendation(context);
    }

    // General purpose fallback
    return this.getGeneralRecommendation(context);
  }

  /**
   * Veo3-optimized recommendations (Gemini models work best with Google's video generation)
   */
  private static getVeo3OptimizedRecommendation(context: TaskContext): ModelRecommendation {
    // Gemini models have native integration with Veo3 through Google's ecosystem
    if (context.complexity === 'complex' && context.budget !== 'cost_conscious') {
      return {
        provider: 'gemini',
        model: 'gemini-2.5-pro',
        reason: 'Gemini 2.5 Pro has native integration with Veo3 and excels at creating detailed, structured video prompts. Google models understand Veo3\'s capabilities and limitations best.',
        confidence: 'high',
        costEfficiency: 'moderate',
        alternatives: [
          {
            provider: 'anthropic',
            model: 'claude-3-5-sonnet-20241022',
            reason: 'Claude 3.5 Sonnet is excellent at creative writing and prompt engineering, though not specifically optimized for Veo3.',
            confidence: 'medium',
            costEfficiency: 'good'
          }
        ]
      };
    }

    if (context.speed === 'priority' || context.budget === 'cost_conscious') {
      return {
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        reason: 'Gemini 2.5 Flash offers the best balance of speed, cost, and Veo3 integration for video prompt engineering.',
        confidence: 'high',
        costEfficiency: 'excellent'
      };
    }

    return {
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      reason: 'Gemini 2.5 Flash provides excellent price/performance for Veo3 video prompt engineering with native Google ecosystem integration.',
      confidence: 'high',
      costEfficiency: 'excellent'
    };
  }

  /**
   * Content generation recommendations
   */
  private static getContentGenerationRecommendation(context: TaskContext): ModelRecommendation {
    if (context.complexity === 'complex' && context.reasoning_intensive) {
      return {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        reason: 'Claude 3.5 Sonnet excels at creative writing, scriptwriting, and nuanced content generation with excellent reasoning.',
        confidence: 'high',
        costEfficiency: 'good',
        alternatives: [
          {
            provider: 'openai',
            model: 'gpt-4o',
            reason: 'GPT-4o provides strong creative capabilities with multimodal support.',
            confidence: 'medium',
            costEfficiency: 'moderate'
          }
        ]
      };
    }

    if (context.speed === 'priority') {
      return {
        provider: 'anthropic',
        model: 'claude-3-5-haiku-20241022',
        reason: 'Claude 3.5 Haiku offers the fastest response times while maintaining quality for content generation.',
        confidence: 'high',
        costEfficiency: 'excellent'
      };
    }

    return {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
      reason: 'Claude models are particularly strong at creative writing and satirical content generation.',
      confidence: 'high',
      costEfficiency: 'good'
    };
  }

  /**
   * Creative strategy recommendations
   */
  private static getCreativeStrategyRecommendation(context: TaskContext): ModelRecommendation {
    if (context.complexity === 'complex') {
      return {
        provider: 'anthropic',
        model: 'claude-3-opus-20240229',
        reason: 'Claude 3 Opus provides the deepest reasoning capabilities for complex strategic thinking and creative analysis.',
        confidence: 'high',
        costEfficiency: 'moderate',
        alternatives: [
          {
            provider: 'anthropic',
            model: 'claude-3-5-sonnet-20241022',
            reason: 'Claude 3.5 Sonnet offers excellent strategic thinking with faster response times.',
            confidence: 'high',
            costEfficiency: 'good'
          }
        ]
      };
    }

    return {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
      reason: 'Claude 3.5 Sonnet provides excellent strategic thinking and creative analysis capabilities.',
      confidence: 'high',
      costEfficiency: 'good'
    };
  }

  /**
   * Analysis task recommendations
   */
  private static getAnalysisRecommendation(context: TaskContext): ModelRecommendation {
    if (context.reasoning_intensive && context.complexity === 'complex') {
      return {
        provider: 'openai',
        model: 'o1-preview',
        reason: 'o1 Preview is specifically designed for complex reasoning and analysis tasks.',
        confidence: 'high',
        costEfficiency: 'expensive',
        alternatives: [
          {
            provider: 'anthropic',
            model: 'claude-3-opus-20240229',
            reason: 'Claude 3 Opus provides excellent analytical capabilities at a more reasonable cost.',
            confidence: 'high',
            costEfficiency: 'moderate'
          }
        ]
      };
    }

    if (context.multimodal) {
      return {
        provider: 'gemini',
        model: 'gemini-2.5-pro',
        reason: 'Gemini 2.5 Pro excels at multimodal analysis including images, videos, and documents.',
        confidence: 'high',
        costEfficiency: 'good'
      };
    }

    return {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
      reason: 'Claude 3.5 Sonnet provides strong analytical capabilities with good speed and cost efficiency.',
      confidence: 'high',
      costEfficiency: 'good'
    };
  }

  /**
   * General purpose recommendations
   */
  private static getGeneralRecommendation(context: TaskContext): ModelRecommendation {
    if (context.budget === 'cost_conscious') {
      return {
        provider: 'gemini',
        model: 'gemini-2.5-flash-lite',
        reason: 'Gemini 2.5 Flash-Lite provides the best cost efficiency for general tasks.',
        confidence: 'medium',
        costEfficiency: 'excellent'
      };
    }

    if (context.multimodal) {
      return {
        provider: 'openai',
        model: 'gpt-4o',
        reason: 'GPT-4o provides excellent multimodal capabilities for general tasks.',
        confidence: 'high',
        costEfficiency: 'moderate'
      };
    }

    return {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
      reason: 'Claude 3.5 Sonnet offers excellent general-purpose capabilities with good cost efficiency.',
      confidence: 'high',
      costEfficiency: 'good'
    };
  }

  /**
   * Get persona-specific recommendations
   */
  public static getPersonaRecommendation(persona: string): ModelRecommendation {
    switch (persona) {
      case 'VIDEO_PROMPT_ENGINEER':
        return this.getRecommendation({
          taskType: 'video_prompt_engineering',
          complexity: 'complex',
          budget: 'balanced',
          speed: 'balanced',
          multimodal: true
        });

      case 'CREATIVE_STRATEGIST':
        return this.getRecommendation({
          taskType: 'creative_strategy',
          complexity: 'complex',
          budget: 'balanced',
          speed: 'balanced',
          reasoning_intensive: true
        });

      case 'SATIRICAL_SCREENWRITER':
        return this.getRecommendation({
          taskType: 'content_generation',
          complexity: 'complex',
          budget: 'balanced',
          speed: 'balanced'
        });

      case 'BAFFLING_BROADCASTER':
        return this.getRecommendation({
          taskType: 'content_generation',
          complexity: 'moderate',
          budget: 'balanced',
          speed: 'priority'
        });

      case 'CINEMATIC_STORYBOARDER':
        return this.getRecommendation({
          taskType: 'analysis',
          complexity: 'moderate',
          budget: 'balanced',
          speed: 'balanced',
          multimodal: true
        });

      case 'SOUNDSCAPE_ARCHITECT':
        return this.getRecommendation({
          taskType: 'content_generation',
          complexity: 'moderate',
          budget: 'balanced',
          speed: 'balanced'
        });

      case 'PROJECT_DIRECTOR':
        return this.getRecommendation({
          taskType: 'analysis',
          complexity: 'complex',
          budget: 'premium',
          speed: 'quality_over_speed',
          reasoning_intensive: true
        });

      default:
        return this.getGeneralRecommendation({
          taskType: 'general',
          complexity: 'moderate',
          budget: 'balanced',
          speed: 'balanced'
        });
    }
  }
}