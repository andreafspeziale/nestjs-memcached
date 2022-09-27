import { DynamicModule, Module, Global, Provider, InjectionToken, Type } from '@nestjs/common';
import {
  MemcachedModuleAsyncOptions,
  MemcachedModuleOptions,
  MemcachedModuleOptionsFactory,
} from './memcached.interfaces';
import { MemcachedService } from './memcached.service';
import {
  createMemcachedClient,
  getMemcachedOptionsToken,
  getMemcachedConnectionToken,
} from './memcached.utils';

@Global()
@Module({})
export class MemcachedCoreModule {
  static forRoot(options: MemcachedModuleOptions, connection?: string): DynamicModule {
    const memcachedOptionsProvider: Provider = {
      provide: getMemcachedOptionsToken(connection),
      useValue: options,
    };

    const memcachedConnectionProvider: Provider = {
      provide: getMemcachedConnectionToken(connection),
      useValue: createMemcachedClient(options),
    };

    return {
      module: MemcachedCoreModule,
      providers: [memcachedOptionsProvider, memcachedConnectionProvider, MemcachedService],
      exports: [memcachedOptionsProvider, memcachedConnectionProvider, MemcachedService],
    };
  }

  public static forRootAsync(
    options: MemcachedModuleAsyncOptions,
    connection?: string
  ): DynamicModule {
    const memcachedConnectionProvider: Provider = {
      provide: getMemcachedConnectionToken(connection),
      useFactory(opt: MemcachedModuleOptions) {
        return createMemcachedClient(opt);
      },
      inject: [getMemcachedOptionsToken(connection)],
    };

    return {
      module: MemcachedCoreModule,
      imports: options.imports,
      providers: [
        ...this.createAsyncProviders(options, connection),
        memcachedConnectionProvider,
        MemcachedService,
      ],
      exports: [memcachedConnectionProvider, MemcachedService],
    };
  }

  public static createAsyncProviders(
    options: MemcachedModuleAsyncOptions,
    connection?: string
  ): Provider[] {
    if (!(options.useExisting || options.useFactory || options.useClass)) {
      throw new Error('Invalid configuration. Must provide useFactory, useClass or useExisting');
    }

    if (options.useExisting !== undefined || options.useFactory !== undefined) {
      return [this.createAsyncOptionsProvider(options, connection)];
    }

    return [
      this.createAsyncOptionsProvider(options, connection),
      {
        provide: options.useClass as InjectionToken,
        useClass: options.useClass as Type<MemcachedModuleOptionsFactory>,
      },
    ];
  }

  public static createAsyncOptionsProvider(
    options: MemcachedModuleAsyncOptions,
    connection?: string
  ): Provider {
    if (!(options.useExisting || options.useFactory || options.useClass)) {
      throw new Error('Invalid configuration. Must provide useFactory, useClass or useExisting');
    }

    if (options.useFactory) {
      return {
        provide: getMemcachedOptionsToken(connection),
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    return {
      provide: getMemcachedOptionsToken(connection),
      async useFactory(
        optionsFactory: MemcachedModuleOptionsFactory
      ): Promise<MemcachedModuleOptions> {
        return await optionsFactory.createMemcachedModuleOptions();
      },
      inject: [(options.useClass as Type<MemcachedModuleOptionsFactory>) || options.useExisting],
    };
  }
}
