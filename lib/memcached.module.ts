import { DynamicModule, Global, Provider } from '@nestjs/common';
import * as MemcachedClient from 'memcached';
import { MEMCACHED_CLIENT_TOKEN, MEMCACHED_MODULE_OPTIONS_TOKEN } from './memcached.constants';
import {
  MemcachedModuleAsyncOptions,
  MemcachedModuleOptions,
  MemcachedModuleOptionsFactory,
} from './memcached.interfaces';
import { MemcachedService } from './memcached.service';
import { createMemcachedClient } from './memcached.utils';

@Global()
export class MemcachedModule {
  public static forRoot(options: MemcachedModuleOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: MEMCACHED_MODULE_OPTIONS_TOKEN,
      useValue: options,
    };

    const clientProvider: Provider = {
      provide: MEMCACHED_CLIENT_TOKEN,
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
    const clientAsyncProvider = {
      provide: MEMCACHED_CLIENT_TOKEN,
      useFactory: async ({ connections, ttl }: MemcachedModuleOptions): Promise<MemcachedClient> =>
        createMemcachedClient({ connections, ttl }),
      inject: [MEMCACHED_MODULE_OPTIONS_TOKEN],
    };

    const asyncProviders = this.createAsyncProviders(options);

    return {
      module: MemcachedModule,
      providers: [...asyncProviders, clientAsyncProvider, MemcachedService],
      exports: [...asyncProviders, clientAsyncProvider, MemcachedService],
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
        provide: MEMCACHED_MODULE_OPTIONS_TOKEN,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    if (options.useClass === undefined) {
      throw new Error('Options "useClass" is undefined');
    }

    return {
      provide: MEMCACHED_MODULE_OPTIONS_TOKEN,
      useFactory: async (
        optionsFactory: MemcachedModuleOptionsFactory
      ): Promise<MemcachedModuleOptions> => optionsFactory.createMemcachedModuleOptions(),
      inject: [options.useExisting || options.useClass],
    };
  }
}
