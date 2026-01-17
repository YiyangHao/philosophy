import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { AIService } from '../AIService';
import { AIError } from '../types';
import type { AIProvider, AIServiceConfig } from '../types';

/**
 * Property-Based Tests for AIService
 * Using fast-check to verify universal properties across many inputs
 */

describe('AIService Property Tests', () => {
  // Helper to create a valid AIServiceConfig
  const createConfig = (defaultProvider: string): AIServiceConfig => ({
    defaultProvider,
    apiKeys: {
      openai: 'test-key',
    },
    defaultOptions: {
      temperature: 0.7,
      maxTokens: 1000,
    },
  });

  // Arbitrary generator for provider names
  const providerNameArb = fc.stringMatching(/^[a-z][a-z0-9-]{2,15}$/);

  // Arbitrary generator for mock AIProvider
  const providerArb = fc.record({
    name: providerNameArb,
    generateText: fc.constant(vi.fn().mockResolvedValue('test response')),
    generateStream: fc.constant(
      vi.fn().mockImplementation(async function* () {
        yield 'chunk';
      })
    ),
  }) as fc.Arbitrary<AIProvider>;

  // Feature: philonote-skeleton, Property 1: Provider Registration and Interface Compliance
  // **Validates: Requirements 7.1, 7.2**
  describe('Property 1: Provider Registration and Interface Compliance', () => {
    it('any registered provider must have name, generateText, and generateStream', async () => {
      await fc.assert(
        fc.asyncProperty(providerArb, async (provider) => {
          const service = new AIService(createConfig(provider.name));
          
          // Register the provider
          service.registerProvider(provider);
          
          // Verify the provider has required properties
          expect(provider.name).toBeDefined();
          expect(typeof provider.name).toBe('string');
          expect(provider.name.length).toBeGreaterThan(0);
          
          // Verify the provider has required methods
          expect(typeof provider.generateText).toBe('function');
          expect(typeof provider.generateStream).toBe('function');
          
          // Verify the provider is in the available providers list
          expect(service.getAvailableProviders()).toContain(provider.name);
        }),
        { numRuns: 100 }
      );
    });

    it('multiple providers can be registered with unique names', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(providerArb, { minLength: 1, maxLength: 5 }),
          async (providers) => {
            // Ensure unique names
            const uniqueProviders = Array.from(
              new Map(providers.map(p => [p.name, p])).values()
            );
            
            if (uniqueProviders.length === 0) return;
            
            const service = new AIService(createConfig(uniqueProviders[0].name));
            
            // Register all providers
            uniqueProviders.forEach(p => service.registerProvider(p));
            
            // Verify all providers are registered
            const availableProviders = service.getAvailableProviders();
            expect(availableProviders.length).toBe(uniqueProviders.length);
            
            uniqueProviders.forEach(provider => {
              expect(availableProviders).toContain(provider.name);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('registered providers maintain their interface contract', async () => {
      await fc.assert(
        fc.asyncProperty(providerArb, async (provider) => {
          const service = new AIService(createConfig(provider.name));
          service.registerProvider(provider);
          
          // Verify generateText returns a Promise
          const textPromise = provider.generateText('test prompt');
          expect(textPromise).toBeInstanceOf(Promise);
          
          // Verify generateStream returns an AsyncGenerator
          const streamGen = provider.generateStream('test prompt');
          expect(typeof streamGen.next).toBe('function');
          expect(typeof streamGen.return).toBe('function');
          expect(typeof streamGen.throw).toBe('function');
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: philonote-skeleton, Property 2: Provider Switching Correctness
  // **Validates: Requirements 7.4**
  describe('Property 2: Provider Switching Correctness', () => {
    it('after setProvider(), subsequent requests route to the correct provider', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(providerArb, { minLength: 2, maxLength: 5 }),
          fc.nat(),
          async (providers, switchIndex) => {
            // Ensure unique names
            const uniqueProviders = Array.from(
              new Map(providers.map(p => [p.name, p])).values()
            );
            
            if (uniqueProviders.length < 2) return;
            
            const service = new AIService(createConfig(uniqueProviders[0].name));
            
            // Register all providers
            uniqueProviders.forEach(p => service.registerProvider(p));
            
            // Pick a provider to switch to
            const targetProvider = uniqueProviders[switchIndex % uniqueProviders.length];
            
            // Switch to the target provider
            service.setProvider(targetProvider.name);
            
            // Verify the current provider is correct
            expect(service.getCurrentProvider()).toBe(targetProvider.name);
            
            // Make a request and verify it goes to the correct provider
            await service.generateText('test prompt');
            
            // Verify the target provider was called
            expect(targetProvider.generateText).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('random sequences of provider switches maintain correctness', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(providerArb, { minLength: 2, maxLength: 4 }),
          fc.array(fc.nat(), { minLength: 1, maxLength: 10 }),
          async (providers, switchSequence) => {
            // Ensure unique names
            const uniqueProviders = Array.from(
              new Map(providers.map(p => [p.name, p])).values()
            );
            
            if (uniqueProviders.length < 2) return;
            
            const service = new AIService(createConfig(uniqueProviders[0].name));
            
            // Register all providers
            uniqueProviders.forEach(p => service.registerProvider(p));
            
            // Perform random switches
            for (const index of switchSequence) {
              const targetProvider = uniqueProviders[index % uniqueProviders.length];
              service.setProvider(targetProvider.name);
              
              // Verify the switch was successful
              expect(service.getCurrentProvider()).toBe(targetProvider.name);
            }
            
            // After all switches, verify the final provider is correct
            const finalIndex = switchSequence[switchSequence.length - 1];
            const finalProvider = uniqueProviders[finalIndex % uniqueProviders.length];
            expect(service.getCurrentProvider()).toBe(finalProvider.name);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('switching to unregistered provider always throws error', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(providerArb, { minLength: 1, maxLength: 3 }),
          providerNameArb,
          async (providers, unregisteredName) => {
            // Ensure unique names
            const uniqueProviders = Array.from(
              new Map(providers.map(p => [p.name, p])).values()
            );
            
            const service = new AIService(createConfig(uniqueProviders[0].name));
            
            // Register all providers
            uniqueProviders.forEach(p => service.registerProvider(p));
            
            // If the unregistered name happens to be registered, skip
            if (uniqueProviders.some(p => p.name === unregisteredName)) {
              return;
            }
            
            // Attempt to switch to unregistered provider should throw
            expect(() => service.setProvider(unregisteredName)).toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: philonote-skeleton, Property 3: Error Wrapping and Propagation
  // **Validates: Requirements 7.5, 8.1, 8.3**
  describe('Property 3: Error Wrapping and Propagation', () => {
    // Arbitrary generator for different error types (using 4xx errors to avoid retries)
    // All errors include "400" to prevent retry logic from triggering
    const errorArb = fc.oneof(
      fc.constant(new Error('API error: 400 Bad Request')),
      fc.constant(new Error('API error: 401 Unauthorized - 400')),
      fc.constant(new Error('API error: 403 Forbidden - 400')),
      fc.constant(new Error('API error: 404 Not Found - 400')),
      fc.string().map(msg => new Error(`400 ${msg}`))
    );

    it('any provider error is caught and wrapped in AIError', async () => {
      await fc.assert(
        fc.asyncProperty(
          providerArb,
          errorArb,
          async (provider, error) => {
            // Create a provider that throws the error
            const errorProvider: AIProvider = {
              ...provider,
              generateText: vi.fn().mockRejectedValue(error),
            };

            const service = new AIService(createConfig(errorProvider.name));
            service.registerProvider(errorProvider);

            // Attempt to generate text should throw AIError
            try {
              await service.generateText('test prompt');
              // If we get here, the test should fail
              expect.fail('Expected AIError to be thrown');
            } catch (e) {
              // Verify it's an AIError
              expect(e).toBeInstanceOf(AIError);
              
              if (e instanceof AIError) {
                // Verify AIError contains provider name
                expect(e.provider).toBe(errorProvider.name);
                
                // Verify AIError contains original error
                expect(e.originalError).toBe(error);
                
                // Verify error message is descriptive
                expect(e.message).toContain('Failed to generate text');
              }
            }
          }
        ),
        { numRuns: 20 } // Reduced to 20 for reasonable test time
      );
    });

    it('AIError preserves provider name across different error types', async () => {
      await fc.assert(
        fc.asyncProperty(
          providerArb,
          errorArb,
          async (provider, error) => {
            const errorProvider: AIProvider = {
              ...provider,
              generateText: vi.fn().mockRejectedValue(error),
            };

            const service = new AIService(createConfig(errorProvider.name));
            service.registerProvider(errorProvider);

            try {
              await service.generateText('test prompt');
              expect.fail('Expected AIError to be thrown');
            } catch (e) {
              if (e instanceof AIError) {
                // Provider name should always match
                expect(e.provider).toBe(errorProvider.name);
                expect(e.provider).toBe(provider.name);
              }
            }
          }
        ),
        { numRuns: 20 } // Reduced to 20 for reasonable test time
      );
    });

    it('streaming errors are also wrapped in AIError', async () => {
      await fc.assert(
        fc.asyncProperty(
          providerArb,
          errorArb,
          async (provider, error) => {
            const errorProvider: AIProvider = {
              ...provider,
              generateStream: vi.fn().mockImplementation(async function* () {
                throw error;
              }),
            };

            const service = new AIService(createConfig(errorProvider.name));
            service.registerProvider(errorProvider);

            try {
              const generator = service.generateStream('test prompt');
              // Try to get the first chunk
              await generator.next();
              expect.fail('Expected AIError to be thrown');
            } catch (e) {
              expect(e).toBeInstanceOf(AIError);
              
              if (e instanceof AIError) {
                expect(e.provider).toBe(errorProvider.name);
                expect(e.originalError).toBe(error);
                expect(e.message).toContain('Failed to generate stream');
              }
            }
          }
        ),
        { numRuns: 20 } // Reduced to 20 for reasonable test time
      );
    });

    it('application does not crash when provider throws error', async () => {
      await fc.assert(
        fc.asyncProperty(
          providerArb,
          errorArb,
          async (provider, error) => {
            const errorProvider: AIProvider = {
              ...provider,
              generateText: vi.fn().mockRejectedValue(error),
            };

            const service = new AIService(createConfig(errorProvider.name));
            service.registerProvider(errorProvider);

            // Multiple calls should all be handled gracefully
            for (let i = 0; i < 3; i++) {
              try {
                await service.generateText('test prompt');
              } catch (e) {
                // Error should be caught and wrapped
                expect(e).toBeInstanceOf(AIError);
              }
            }

            // Service should still be functional
            expect(service.getCurrentProvider()).toBe(errorProvider.name);
            expect(service.getAvailableProviders()).toContain(errorProvider.name);
          }
        ),
        { numRuns: 20 } // Reduced to 20 for reasonable test time
      );
    });
  });

  // Feature: philonote-skeleton, Property 4: Retry with Exponential Backoff
  // **Validates: Requirements 8.2**
  describe('Property 4: Retry with Exponential Backoff', () => {
    it('retryable errors trigger retries with exponential backoff delays', async () => {
      await fc.assert(
        fc.asyncProperty(
          providerArb,
          fc.integer({ min: 1, max: 2 }), // Number of failures before success (limited to 2 for test speed)
          async (provider, failureCount) => {
            let callCount = 0;
            const startTime = Date.now();
            
            // Create a provider that fails N times then succeeds
            const retryableProvider: AIProvider = {
              ...provider,
              generateText: vi.fn().mockImplementation(async () => {
                callCount++;
                if (callCount <= failureCount) {
                  // Throw a 5xx error (retryable)
                  throw new Error('API error: 500 Internal Server Error');
                }
                return 'success';
              }),
            };

            const service = new AIService(createConfig(retryableProvider.name));
            service.registerProvider(retryableProvider);

            // Should eventually succeed after retries
            const result = await service.generateText('test prompt');
            const endTime = Date.now();
            const elapsed = endTime - startTime;

            // Verify it succeeded
            expect(result).toBe('success');
            
            // Verify it was called the expected number of times
            expect(callCount).toBe(failureCount + 1);
            
            // Verify exponential backoff delays were applied
            // For N failures: delays are 1s, 2s, 4s, ...
            // Total minimum delay = sum of 2^i * 1000 for i from 0 to failureCount-1
            if (failureCount > 0) {
              let expectedMinDelay = 0;
              for (let i = 0; i < failureCount; i++) {
                expectedMinDelay += Math.pow(2, i) * 1000;
              }
              // Allow some tolerance for execution time (500ms)
              expect(elapsed).toBeGreaterThanOrEqual(expectedMinDelay - 500);
            }
          }
        ),
        { numRuns: 20 } // Reduced runs due to delays
      );
    }, 120000); // 2 minute timeout for retry delays

    it('4xx client errors do not trigger retries', async () => {
      await fc.assert(
        fc.asyncProperty(
          providerArb,
          fc.oneof(
            fc.constant('400 Bad Request'),
            fc.constant('401 Unauthorized'),
            fc.constant('403 Forbidden'),
            fc.constant('404 Not Found')
          ),
          async (provider, errorStatus) => {
            let callCount = 0;
            
            // Create a provider that always throws a 4xx error
            const clientErrorProvider: AIProvider = {
              ...provider,
              generateText: vi.fn().mockImplementation(async () => {
                callCount++;
                throw new Error(`API error: ${errorStatus}`);
              }),
            };

            const service = new AIService(createConfig(clientErrorProvider.name));
            service.registerProvider(clientErrorProvider);

            const startTime = Date.now();
            
            try {
              await service.generateText('test prompt');
              expect.fail('Expected error to be thrown');
            } catch (e) {
              const endTime = Date.now();
              const elapsed = endTime - startTime;
              
              // Verify it was only called once (no retries)
              expect(callCount).toBe(1);
              
              // Verify no significant delay (should fail immediately)
              // Allow 500ms for execution overhead
              expect(elapsed).toBeLessThan(500);
              
              // Verify error was thrown
              expect(e).toBeInstanceOf(Error);
            }
          }
        ),
        { numRuns: 20 }
      );
    }, 30000); // 30 second timeout

    it('max retries limit is respected', async () => {
      await fc.assert(
        fc.asyncProperty(
          providerArb,
          async (provider) => {
            let callCount = 0;
            
            // Create a provider that always fails with retryable error
            const alwaysFailProvider: AIProvider = {
              ...provider,
              generateText: vi.fn().mockImplementation(async () => {
                callCount++;
                throw new Error('API error: 503 Service Unavailable');
              }),
            };

            const service = new AIService(createConfig(alwaysFailProvider.name));
            service.registerProvider(alwaysFailProvider);

            try {
              await service.generateText('test prompt');
              expect.fail('Expected error to be thrown');
            } catch (e) {
              // Should have tried exactly 3 times (maxRetries = 3)
              expect(callCount).toBe(3);
              
              // Error should be wrapped in AIError
              expect(e).toBeInstanceOf(AIError);
            }
          }
        ),
        { numRuns: 20 }
      );
    }, 180000); // 3 minute timeout (20 runs * 7s per run max)

    it('random failure sequences are handled correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          providerArb,
          fc.array(
            fc.oneof(
              fc.constant('success'),
              fc.constant('500'), // Retryable
              fc.constant('503'), // Retryable
              fc.constant('400')  // Non-retryable
            ),
            { minLength: 1, maxLength: 5 }
          ),
          async (provider, sequence) => {
            let sequenceIndex = 0;
            
            const sequenceProvider: AIProvider = {
              ...provider,
              generateText: vi.fn().mockImplementation(async () => {
                const current = sequence[sequenceIndex];
                sequenceIndex++;
                
                if (current === 'success') {
                  return 'success';
                } else if (current === '400') {
                  throw new Error(`API error: ${current} Bad Request`);
                } else {
                  throw new Error(`API error: ${current} Server Error`);
                }
              }),
            };

            const service = new AIService(createConfig(sequenceProvider.name));
            service.registerProvider(sequenceProvider);

            try {
              const result = await service.generateText('test prompt');
              
              // If we got a result, the sequence must have contained 'success'
              expect(result).toBe('success');
              expect(sequence).toContain('success');
            } catch (e) {
              // If we got an error, verify it's properly wrapped
              expect(e).toBeInstanceOf(AIError);
              
              // If the first item was '400', should fail immediately
              if (sequence[0] === '400') {
                expect(sequenceIndex).toBe(1);
              }
            }
          }
        ),
        { numRuns: 20 }
      );
    }, 180000); // 3 minute timeout
  });
});
