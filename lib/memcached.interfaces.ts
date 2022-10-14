import { ModuleMetadata, Type } from '@nestjs/common';

export interface CachingOptions {
  ttl: number;
  ttr?: number;
}

export interface WrappedValue<T> {
  content: T;
}

export interface MemcachedConnections {
  host: string;
  port?: number;
}

export type ValueProcessor<T = unknown, R = unknown> = (p: { value: T } & CachingOptions) => R;
export type KeyProcessor = (key: string) => string;

export interface Processors<T = unknown, R = unknown> {
  valueProcessor?: ValueProcessor<T, R>;
  keyProcessor?: KeyProcessor;
}

export interface MemcachedModuleOptions extends CachingOptions {
  connections?: MemcachedConnections[];
  keyProcessor?: KeyProcessor;
}

export interface MemcachedModuleOptionsFactory {
  createMemcachedModuleOptions(): Promise<MemcachedModuleOptions> | MemcachedModuleOptions;
}

export interface MemcachedModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<MemcachedModuleOptionsFactory>;
  useClass?: Type<MemcachedModuleOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<MemcachedModuleOptions> | MemcachedModuleOptions;
  inject?: any[];
}
