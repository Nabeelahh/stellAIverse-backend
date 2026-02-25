import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { IAIProvider, AIProviderType } from "./provider.interface";
import {
  CompletionRequestDto,
  CompletionResponseDto,
  EmbeddingRequestDto,
  EmbeddingResponseDto,
} from "./base.dto";
import { ProviderRegistry } from "./provider.registry";

/**
 * ComputeBridge Service
 *
 * Central orchestration service for AI provider interactions.
 * Routes requests to appropriate providers via the ProviderRegistry.
 */
@Injectable()
export class ComputeBridgeService implements OnModuleInit {
  private readonly logger = new Logger(ComputeBridgeService.name);

  constructor(private readonly registry: ProviderRegistry) {}

  async onModuleInit() {
    this.logger.log("ComputeBridge service initializing...");
    this.logger.log(`Available providers: ${this.registry.list().join(", ")}`);
    this.logger.log("ComputeBridge service initialized");
  }

  /**
   * Register a new AI provider
   */
  async registerProvider(provider: IAIProvider, config: any): Promise<void> {
    await this.registry.register(config.type, provider, config);
  }

  /**
   * Get a registered provider by type
   */
  async getProvider(type: AIProviderType): Promise<IAIProvider | undefined> {
    return this.registry.get(type);
  }

  /**
   * Check if a provider is registered
   */
  hasProvider(type: AIProviderType): boolean {
    return this.registry.has(type);
  }

  /**
   * List all registered providers
   */
  listProviders(): AIProviderType[] {
    return this.registry.list();
  }

  /**
   * Generate a completion using specified provider
   */
  async complete(
    request: CompletionRequestDto,
  ): Promise<CompletionResponseDto> {
    const provider = await this.registry.get(request.provider);

    if (!provider) {
      throw new Error(`Provider ${request.provider} is not registered`);
    }

    if (!provider.isInitialized()) {
      throw new Error(`Provider ${request.provider} is not initialized`);
    }

    this.logger.debug(
      `Processing completion request with provider: ${request.provider}, model: ${request.model}`,
    );

    throw new Error("Completion method not yet implemented");
  }

  /**
   * Generate embeddings using specified provider
   */
  async generateEmbeddings(
    request: EmbeddingRequestDto,
  ): Promise<EmbeddingResponseDto> {
    const provider = await this.registry.get(request.provider);

    if (!provider) {
      throw new Error(`Provider ${request.provider} is not registered`);
    }

    if (!provider.isInitialized()) {
      throw new Error(`Provider ${request.provider} is not initialized`);
    }

    this.logger.debug(
      `Processing embedding request with provider: ${request.provider}, model: ${request.model}`,
    );

    throw new Error("Embedding method not yet implemented");
  }

  /**
   * Validate a model is available for a specific provider
   */
  async validateModel(
    provider: AIProviderType,
    modelId: string,
  ): Promise<boolean> {
    const providerInstance = await this.registry.get(provider);

    if (!providerInstance) {
      return false;
    }

    try {
      return await providerInstance.validateModel(modelId);
    } catch (error) {
      this.logger.error(
        `Model validation failed for ${provider}/${modelId}: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Get available models for a specific provider
   */
  async getAvailableModels(provider: AIProviderType) {
    const providerInstance = await this.registry.get(provider);

    if (!providerInstance) {
      throw new Error(`Provider ${provider} is not registered`);
    }

    return await providerInstance.listModels();
  }
}
