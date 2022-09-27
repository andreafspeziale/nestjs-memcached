import { ModuleMetadata, Type } from '@nestjs/common';

export interface CachingOptions {
  ttl: number;
  ttr?: number;
}

export interface CachedValue<T> {
  ttl: number;
  ttr?: number;
  createdAt: Date;
  content: T;
}

export interface MemcachedModuleOptions extends CachingOptions {
  connections?: {
    host: string;
    port: number;
    auth?: {
      user: string;
      password: string;
    };
  }[];
}

export interface MemcachedModuleOptionsFactory {
  createMemcachedModuleOptions(): Promise<MemcachedModuleOptions> | MemcachedModuleOptions;
}

export interface MemcachedModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[];
  useClass?: Type<MemcachedModuleOptionsFactory>;
  useExisting?: Type<MemcachedModuleOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<MemcachedModuleOptions> | MemcachedModuleOptions;
}
