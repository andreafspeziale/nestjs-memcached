import { DynamicModule, Global, Provider } from '@nestjs/common';
import {
  MemcachedModuleAsyncOptions,
  MemcachedModuleOptionsFactory,
  MemcachedModuleOptions,
  MemcachedClient,
  CachableValue,
} from './memcached.interfaces';
import { MemcachedService } from './memcached.service';
import {
  createMemcachedClient,
  getMemcachedClientToken,
  getMemcachedModuleOptionsToken,
} from './memcached.utils';

@Global()
export class MemcachedModule {
  public static forRoot<ValueProcessorInputAndOutput extends CachableValue = CachableValue>(
    options: MemcachedModuleOptions<ValueProcessorInputAndOutput>,
    extraProviders?: Provider[],
  ): DynamicModule {
    const optionsProvider: Provider = {
      provide: getMemcachedModuleOptionsToken(),
      useValue: options,
    };

    const clientProvider: Provider = {
      provide: getMemcachedClientToken(),
      useValue: createMemcachedClient(options.connection),
    };

    return {
      module: MemcachedModule,
      providers: [...(extraProviders || []), optionsProvider, clientProvider, MemcachedService],
      exports: [optionsProvider, clientProvider, MemcachedService],
    };
  }

  static register<ValueProcessorInputAndOutput extends CachableValue = CachableValue>(
    options: MemcachedModuleOptions<ValueProcessorInputAndOutput>,
    extraProviders?: Provider[],
  ): DynamicModule {
    return MemcachedModule.forRoot<ValueProcessorInputAndOutput>(options, extraProviders);
  }

  public static forRootAsync<ValueProcessorInputAndOutput extends CachableValue = CachableValue>(
    options: MemcachedModuleAsyncOptions<ValueProcessorInputAndOutput>,
  ): DynamicModule {
    const memcachedClientProvider: Provider = {
      provide: getMemcachedClientToken(),
      useFactory: (opts: MemcachedModuleOptions<ValueProcessorInputAndOutput>): MemcachedClient =>
        createMemcachedClient(opts.connection),
      inject: [getMemcachedModuleOptionsToken()],
    };

    return {
      module: MemcachedModule,
      providers: [
        ...(options.extraProviders || []),
        ...this.createAsyncProviders<ValueProcessorInputAndOutput>(options),
        memcachedClientProvider,
        MemcachedService,
      ],
      exports: [
        ...this.createAsyncProviders<ValueProcessorInputAndOutput>(options),
        memcachedClientProvider,
        MemcachedService,
      ],
    };
  }

  static registerAsync<ValueProcessorInputAndOutput extends CachableValue = CachableValue>(
    options: MemcachedModuleAsyncOptions<ValueProcessorInputAndOutput>,
  ): DynamicModule {
    return MemcachedModule.forRootAsync<ValueProcessorInputAndOutput>(options);
  }

  private static createAsyncProviders<
    ValueProcessorInputAndOutput extends CachableValue = CachableValue,
  >(options: MemcachedModuleAsyncOptions<ValueProcessorInputAndOutput>): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider<ValueProcessorInputAndOutput>(options)];
    }

    if (options.useClass === undefined) {
      throw new Error('Options "useClass" is undefined');
    }

    return [
      this.createAsyncOptionsProvider<ValueProcessorInputAndOutput>(options),
      {
        provide: options.useClass,
        useClass: options.useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider<
    ValueProcessorInputAndOutput extends CachableValue = CachableValue,
  >(options: MemcachedModuleAsyncOptions<ValueProcessorInputAndOutput>): Provider {
    if (options.useFactory) {
      return {
        provide: getMemcachedModuleOptionsToken(),
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    if (options.useClass === undefined) {
      throw new Error('Options "useClass" is undefined');
    }

    return {
      provide: getMemcachedModuleOptionsToken(),
      useFactory: async (
        optionsFactory: MemcachedModuleOptionsFactory<ValueProcessorInputAndOutput>,
      ): Promise<MemcachedModuleOptions<ValueProcessorInputAndOutput>> =>
        await optionsFactory.createMemcachedModuleOptions(),
      inject: [options.useExisting || options.useClass],
    };
  }
}
