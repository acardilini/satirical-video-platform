// Error Recovery and Retry System
// LangChain-inspired error handling with automatic retry mechanisms

import { PersonaType, SatiricalFormat } from '../shared/types/index.js';
import { WorkflowError } from './workflow-state.js';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  backoffMultiplier: number;
  maxDelay: number; // milliseconds
  retryableErrors: ErrorType[];
}

export interface ErrorRecoveryStrategy {
  errorType: ErrorType;
  strategy: RecoveryStrategy;
  fallbackActions: FallbackAction[];
  preventionMeasures: PreventionMeasure[];
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  timeout: number; // milliseconds
  monitoringWindow: number; // milliseconds
}

export interface RecoveryAttempt {
  id: string;
  persona: PersonaType;
  errorType: ErrorType;
  attemptNumber: number;
  strategy: RecoveryStrategy;
  timestamp: Date;
  success: boolean;
  duration: number;
  errorMessage?: string;
}

export type ErrorType = 
  | 'api_timeout'
  | 'api_rate_limit'
  | 'api_invalid_response'
  | 'format_validation_failed'
  | 'quality_check_failed'
  | 'character_inconsistency'
  | 'context_corruption'
  | 'memory_overflow'
  | 'network_error'
  | 'authentication_error'
  | 'unknown_error';

export type RecoveryStrategy = 
  | 'simple_retry'
  | 'exponential_backoff'
  | 'context_reset'
  | 'fallback_model'
  | 'simplified_prompt'
  | 'format_correction'
  | 'character_repair'
  | 'quality_relaxation'
  | 'manual_intervention';

export type FallbackAction =
  | 'use_cached_response'
  | 'switch_provider'
  | 'reduce_complexity'
  | 'skip_optional_features'
  | 'request_user_input'
  | 'rollback_to_previous_state'
  | 'generate_placeholder_response';

export type PreventionMeasure =
  | 'input_validation'
  | 'rate_limiting'
  | 'timeout_adjustment'
  | 'prompt_optimization'
  | 'context_size_management'
  | 'model_warming';

/**
 * Error Recovery System for Agent Orchestration
 * Implements intelligent retry mechanisms and error handling strategies
 */
export class ErrorRecoveryService {
  private retryAttempts: Map<string, RecoveryAttempt[]> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private errorStrategies: Map<ErrorType, ErrorRecoveryStrategy> = new Map();
  private globalRetryConfig: RetryConfig;

  constructor() {
    this.globalRetryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      backoffMultiplier: 2,
      maxDelay: 30000,
      retryableErrors: [
        'api_timeout',
        'api_rate_limit',
        'network_error',
        'api_invalid_response',
        'quality_check_failed'
      ]
    };

    this.initializeErrorStrategies();
    this.initializeCircuitBreakers();
  }

  /**
   * Execute operation with error recovery
   */
  async executeWithRecovery<T>(
    operationId: string,
    persona: PersonaType,
    operation: () => Promise<T>,
    customConfig?: Partial<RetryConfig>
  ): Promise<{ success: boolean; result?: T; error?: Error; attempts: number }> {
    const config = { ...this.globalRetryConfig, ...customConfig };
    const circuitBreaker = this.getCircuitBreaker(persona);

    // Check circuit breaker state
    if (circuitBreaker.isOpen()) {
      console.warn(`🚫 Circuit breaker open for ${persona}, operation blocked`);
      return {
        success: false,
        error: new Error('Circuit breaker is open - too many recent failures'),
        attempts: 0
      };
    }

    let lastError: Error | undefined;
    let attempts = 0;

    for (attempts = 0; attempts <= config.maxRetries; attempts++) {
      try {
        const result = await this.executeWithTimeout(operation, 30000); // 30 second timeout
        
        // Success - record and return
        this.recordSuccessfulAttempt(operationId, persona, attempts);
        circuitBreaker.recordSuccess();
        
        console.log(`✅ Operation ${operationId} succeeded for ${persona} (attempt ${attempts + 1})`);
        return { success: true, result, attempts: attempts + 1 };

      } catch (error) {
        lastError = error as Error;
        const errorType = this.classifyError(error as Error);
        
        console.warn(`⚠️ Operation ${operationId} failed for ${persona} (attempt ${attempts + 1}): ${errorType}`);
        
        // Record failed attempt
        this.recordFailedAttempt(operationId, persona, attempts, errorType, lastError.message);
        circuitBreaker.recordFailure();

        // Check if error is retryable
        if (!config.retryableErrors.includes(errorType)) {
          console.error(`❌ Non-retryable error for ${persona}: ${errorType}`);
          break;
        }

        // Check if we've reached max retries
        if (attempts >= config.maxRetries) {
          console.error(`❌ Max retries exceeded for ${persona}: ${attempts + 1} attempts`);
          break;
        }

        // Apply recovery strategy
        const recovered = await this.applyRecoveryStrategy(errorType, persona, attempts);
        if (!recovered) {
          console.error(`❌ Recovery strategy failed for ${persona}: ${errorType}`);
          break;
        }

        // Calculate delay for next retry
        const delay = this.calculateRetryDelay(attempts, config);
        console.log(`🔄 Retrying ${operationId} for ${persona} in ${delay}ms`);
        await this.sleep(delay);
      }
    }

    // All retries failed
    console.error(`❌ Operation ${operationId} failed permanently for ${persona} after ${attempts} attempts`);
    return {
      success: false,
      error: lastError || new Error('Unknown error occurred'),
      attempts
    };
  }

  /**
   * Get recovery suggestions for manual intervention
   */
  getRecoverySuggestions(persona: PersonaType, errorType: ErrorType): {
    strategy: ErrorRecoveryStrategy;
    suggestions: string[];
    automaticActions: string[];
  } {
    const strategy = this.errorStrategies.get(errorType);
    if (!strategy) {
      return {
        strategy: this.getDefaultStrategy(errorType),
        suggestions: ['Check system logs for more details', 'Retry operation manually'],
        automaticActions: ['Error logged for analysis']
      };
    }

    const suggestions = this.generateRecoverySuggestions(strategy, persona);
    const automaticActions = this.getAutomaticActions(strategy);

    return { strategy, suggestions, automaticActions };
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStatistics(persona?: PersonaType): {
    totalAttempts: number;
    failureRate: number;
    commonErrors: Array<{ type: ErrorType; count: number }>;
    averageRetries: number;
    circuitBreakerState: string;
  } {
    const allAttempts = Array.from(this.retryAttempts.values()).flat();
    const relevantAttempts = persona 
      ? allAttempts.filter(attempt => attempt.persona === persona)
      : allAttempts;

    const totalAttempts = relevantAttempts.length;
    const failures = relevantAttempts.filter(attempt => !attempt.success);
    const failureRate = totalAttempts > 0 ? (failures.length / totalAttempts) * 100 : 0;

    // Count error types
    const errorCounts = new Map<ErrorType, number>();
    failures.forEach(attempt => {
      const current = errorCounts.get(attempt.errorType) || 0;
      errorCounts.set(attempt.errorType, current + 1);
    });

    const commonErrors = Array.from(errorCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate average retries
    const attemptCounts = new Map<string, number>();
    relevantAttempts.forEach(attempt => {
      const key = `${attempt.persona}_${attempt.timestamp.toISOString().split('T')[0]}`;
      const current = attemptCounts.get(key) || 0;
      attemptCounts.set(key, Math.max(current, attempt.attemptNumber + 1));
    });

    const averageRetries = attemptCounts.size > 0 
      ? Array.from(attemptCounts.values()).reduce((sum, count) => sum + count, 0) / attemptCounts.size
      : 0;

    // Circuit breaker state
    const circuitBreaker = persona ? this.getCircuitBreaker(persona) : null;
    const circuitBreakerState = circuitBreaker 
      ? (circuitBreaker.isOpen() ? 'OPEN' : circuitBreaker.isHalfOpen() ? 'HALF_OPEN' : 'CLOSED')
      : 'N/A';

    return {
      totalAttempts,
      failureRate,
      commonErrors,
      averageRetries,
      circuitBreakerState
    };
  }

  /**
   * Reset circuit breaker for persona
   */
  resetCircuitBreaker(persona: PersonaType): void {
    const circuitBreaker = this.getCircuitBreaker(persona);
    circuitBreaker.reset();
    console.log(`🔄 Circuit breaker reset for ${persona}`);
  }

  // Private helper methods

  private async executeWithTimeout<T>(operation: () => Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      operation()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  private classifyError(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout') || message.includes('timed out')) {
      return 'api_timeout';
    }
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return 'api_rate_limit';
    }
    if (message.includes('network') || message.includes('connection')) {
      return 'network_error';
    }
    if (message.includes('authentication') || message.includes('unauthorized')) {
      return 'authentication_error';
    }
    if (message.includes('format') || message.includes('validation')) {
      return 'format_validation_failed';
    }
    if (message.includes('quality') || message.includes('standard')) {
      return 'quality_check_failed';
    }
    if (message.includes('character') || message.includes('consistency')) {
      return 'character_inconsistency';
    }
    if (message.includes('context') || message.includes('memory')) {
      return 'context_corruption';
    }
    
    return 'unknown_error';
  }

  private async applyRecoveryStrategy(
    errorType: ErrorType,
    persona: PersonaType,
    attemptNumber: number
  ): Promise<boolean> {
    const strategy = this.errorStrategies.get(errorType);
    if (!strategy) return true; // Allow retry with default behavior

    switch (strategy.strategy) {
      case 'simple_retry':
        return true; // Just retry

      case 'exponential_backoff':
        // Handled by retry delay calculation
        return true;

      case 'context_reset':
        // Reset conversation context
        console.log(`🔄 Resetting context for ${persona}`);
        // Implementation would clear conversation history
        return true;

      case 'fallback_model':
        // Switch to backup model
        console.log(`🔄 Switching to fallback model for ${persona}`);
        // Implementation would update model configuration
        return true;

      case 'simplified_prompt':
        // Reduce prompt complexity
        console.log(`🔄 Simplifying prompt for ${persona}`);
        // Implementation would modify prompt generation
        return true;

      case 'format_correction':
        // Apply format-specific corrections
        console.log(`🔄 Applying format corrections for ${persona}`);
        return true;

      case 'quality_relaxation':
        // Temporarily relax quality requirements
        console.log(`🔄 Relaxing quality requirements for ${persona}`);
        return true;

      case 'manual_intervention':
        // Requires manual intervention - don't retry automatically
        console.warn(`⚠️ Manual intervention required for ${persona}: ${errorType}`);
        return false;

      default:
        return true;
    }
  }

  private calculateRetryDelay(attemptNumber: number, config: RetryConfig): number {
    const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attemptNumber);
    return Math.min(delay, config.maxDelay);
  }

  private recordSuccessfulAttempt(operationId: string, persona: PersonaType, attempts: number): void {
    const attempt: RecoveryAttempt = {
      id: this.generateAttemptId(),
      persona,
      errorType: 'unknown_error', // Not applicable for success
      attemptNumber: attempts,
      strategy: 'simple_retry',
      timestamp: new Date(),
      success: true,
      duration: 0
    };

    this.addAttemptRecord(operationId, attempt);
  }

  private recordFailedAttempt(
    operationId: string,
    persona: PersonaType,
    attemptNumber: number,
    errorType: ErrorType,
    errorMessage: string
  ): void {
    const strategy = this.errorStrategies.get(errorType)?.strategy || 'simple_retry';
    
    const attempt: RecoveryAttempt = {
      id: this.generateAttemptId(),
      persona,
      errorType,
      attemptNumber,
      strategy,
      timestamp: new Date(),
      success: false,
      duration: 0,
      errorMessage
    };

    this.addAttemptRecord(operationId, attempt);
  }

  private addAttemptRecord(operationId: string, attempt: RecoveryAttempt): void {
    let attempts = this.retryAttempts.get(operationId);
    if (!attempts) {
      attempts = [];
      this.retryAttempts.set(operationId, attempts);
    }
    
    attempts.push(attempt);

    // Keep only recent attempts to manage memory
    if (attempts.length > 100) {
      this.retryAttempts.set(operationId, attempts.slice(-50));
    }
  }

  private getCircuitBreaker(persona: PersonaType): CircuitBreaker {
    let circuitBreaker = this.circuitBreakers.get(persona);
    if (!circuitBreaker) {
      circuitBreaker = new CircuitBreaker({
        failureThreshold: 5,
        timeout: 60000, // 1 minute
        monitoringWindow: 300000 // 5 minutes
      });
      this.circuitBreakers.set(persona, circuitBreaker);
    }
    return circuitBreaker;
  }

  private generateRecoverySuggestions(strategy: ErrorRecoveryStrategy, persona: PersonaType): string[] {
    const suggestions: string[] = [
      `Primary strategy: ${strategy.strategy.replace('_', ' ')}`
    ];

    strategy.fallbackActions.forEach(action => {
      suggestions.push(`Fallback: ${action.replace('_', ' ')}`);
    });

    strategy.preventionMeasures.forEach(measure => {
      suggestions.push(`Prevention: ${measure.replace('_', ' ')}`);
    });

    return suggestions;
  }

  private getAutomaticActions(strategy: ErrorRecoveryStrategy): string[] {
    return [
      `Applied ${strategy.strategy} recovery strategy`,
      ...strategy.fallbackActions.map(action => `Executed ${action}`),
      'Error logged for analysis and monitoring'
    ];
  }

  private getDefaultStrategy(errorType: ErrorType): ErrorRecoveryStrategy {
    return {
      errorType,
      strategy: 'simple_retry',
      fallbackActions: ['request_user_input'],
      preventionMeasures: ['input_validation']
    };
  }

  private initializeErrorStrategies(): void {
    this.errorStrategies.set('api_timeout', {
      errorType: 'api_timeout',
      strategy: 'exponential_backoff',
      fallbackActions: ['switch_provider', 'reduce_complexity'],
      preventionMeasures: ['timeout_adjustment', 'model_warming']
    });

    this.errorStrategies.set('api_rate_limit', {
      errorType: 'api_rate_limit',
      strategy: 'exponential_backoff',
      fallbackActions: ['switch_provider', 'use_cached_response'],
      preventionMeasures: ['rate_limiting', 'request_batching'] as any
    });

    this.errorStrategies.set('format_validation_failed', {
      errorType: 'format_validation_failed',
      strategy: 'format_correction',
      fallbackActions: ['simplified_prompt', 'quality_relaxation'] as any,
      preventionMeasures: ['input_validation', 'prompt_optimization']
    });

    this.errorStrategies.set('quality_check_failed', {
      errorType: 'quality_check_failed',
      strategy: 'quality_relaxation',
      fallbackActions: ['simplified_prompt', 'use_cached_response'],
      preventionMeasures: ['prompt_optimization', 'context_size_management']
    });

    this.errorStrategies.set('character_inconsistency', {
      errorType: 'character_inconsistency',
      strategy: 'character_repair',
      fallbackActions: ['context_reset', 'simplified_prompt'],
      preventionMeasures: ['input_validation', 'context_size_management']
    });

    this.errorStrategies.set('network_error', {
      errorType: 'network_error',
      strategy: 'exponential_backoff',
      fallbackActions: ['switch_provider', 'use_cached_response'],
      preventionMeasures: ['timeout_adjustment', 'rate_limiting']
    });

    // Add more strategies as needed...
  }

  private initializeCircuitBreakers(): void {
    // Circuit breakers will be created on-demand for each persona
    console.log('🔧 Error recovery service initialized with circuit breakers');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateAttemptId(): string {
    return `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Circuit Breaker Implementation
 */
class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  isOpen(): boolean {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.config.timeout) {
        this.state = 'HALF_OPEN';
        return false;
      }
      return true;
    }
    return false;
  }

  isHalfOpen(): boolean {
    return this.state === 'HALF_OPEN';
  }

  recordSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.config.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = 0;
  }
}

// Export singleton instance
export const errorRecoveryService = new ErrorRecoveryService();