import { DynamicModule, Global, Provider } from '@nestjs/common';
import MemcachedClient from 'memcached';
import {
  MemcachedModuleAsyncOptions,
  MemcachedModuleOptions,
  MemcachedModuleOptionsFactory,
} from './memcached.interfaces';
import { MemcachedService } from './memcached.service';
import {
  createMemcachedClient,
  getMemcachedClientToken,
  getMemcachedModuleOptionsToken,
} from './memcached.utils';

@Global()
export class MemcachedModule {
  public static forRoot(options: MemcachedModuleOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: getMemcachedModuleOptionsToken(),
      useValue: options,
    };

    const clientProvider: Provider = {
      provide: getMemcachedClientToken(),
      useValue: createMemcachedClient(options),
    };

    return {
      module: MemcachedModule,
      providers: [optionsProvider, clientProvider, MemcachedService],
      exports: [optionsProvider, clientProvider, MemcachedService],
    };
  }

  static register(options: MemcachedModuleOptions): DynamicModule {
    return MemcachedModule.forRoot(options);
  }

  public static forRootAsync(options: MemcachedModuleAsyncOptions): DynamicModule {
    const memcachedClientProvider: Provider = {
      provide: getMemcachedClientToken(),
      useFactory: (opts: MemcachedModuleOptions): MemcachedClient =>
        createMemcachedClient({ connections: opts.connections || [] }),
      inject: [getMemcachedModuleOptionsToken()],
    };

    return {
      module: MemcachedModule,
      providers: [...this.createAsyncProviders(options), memcachedClientProvider, MemcachedService],
      exports: [...this.createAsyncProviders(options), memcachedClientProvider, MemcachedService],
    };
  }

  static registerAsync(options: MemcachedModuleAsyncOptions): DynamicModule {
    return MemcachedModule.forRootAsync(options);
  }

  private static createAsyncProviders(options: MemcachedModuleAsyncOptions): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }

    if (options.useClass === undefined) {
      throw new Error('Options "useClass" is undefined');
    }

    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass,
        useClass: options.useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(options: MemcachedModuleAsyncOptions): Provider {
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
        optionsFactory: MemcachedModuleOptionsFactory,
      ): Promise<MemcachedModuleOptions> => optionsFactory.createMemcachedModuleOptions(),
      inject: [options.useExisting || options.useClass],
    };
  }
}
