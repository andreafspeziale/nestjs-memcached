import { DynamicModule, Module } from '@nestjs/common';
import { MemcachedCoreModule } from './memcached.core-module';
import { MemcachedModuleAsyncOptions, MemcachedModuleOptions } from './memcached.interfaces';

@Module({})
export class MemcachedModule {
  public static forRoot(options: MemcachedModuleOptions, connection?: string): DynamicModule {
    return {
      module: MemcachedModule,
      imports: [MemcachedCoreModule.forRoot(options, connection)],
      exports: [MemcachedCoreModule],
    };
  }

  public static forRootAsync(
    options: MemcachedModuleAsyncOptions,
    connection?: string
  ): DynamicModule {
    return {
      module: MemcachedModule,
      imports: [MemcachedCoreModule.forRootAsync(options, connection)],
      exports: [MemcachedCoreModule],
    };
  }
}
