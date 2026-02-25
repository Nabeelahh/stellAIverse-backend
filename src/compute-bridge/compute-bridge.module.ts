import { Module, OnModuleInit } from "@nestjs/common";
import { ComputeBridgeService } from "./compute-bridge.service";
import { ComputeBridgeController } from "./compute-bridge.controller";
import { ProviderRegistry } from "./provider.registry";
import { MockProvider } from "./providers/mock.provider";
import { AIProviderType } from "./provider.interface";

/**
 * ComputeBridge Module
 *
 * Orchestrates AI provider calls across multiple providers.
 * Provides a unified interface for interacting with different AI services
 * while maintaining provider-specific implementations.
 *
 * @module ComputeBridgeModule
 */
@Module({
  imports: [],
  controllers: [ComputeBridgeController],
  providers: [
    ProviderRegistry,
    ComputeBridgeService,
    MockProvider,
  ],
  exports: [ComputeBridgeService, ProviderRegistry],
})
export class ComputeBridgeModule implements OnModuleInit {
  constructor(
    private readonly registry: ProviderRegistry,
    private readonly mockProvider: MockProvider,
  ) {}

  async onModuleInit() {
    // Register MockProvider with default config
    await this.registry.register(
      AIProviderType.CUSTOM,
      this.mockProvider,
      {
        type: AIProviderType.CUSTOM,
        apiKey: "mock-key",
      },
    );
  }
}
