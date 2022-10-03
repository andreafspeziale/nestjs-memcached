import { ModuleMetadata, Type } from '@nestjs/common';

export interface CachingOptions {
  ttl: number;
  ttr?: number;
}

export interface BaseWrappedValue<T> {
  content: T;
}

export type WrappedValue<T = unknown, M extends CachingOptions = CachingOptions> = Omit<
  M,
  'content'
> &
  BaseWrappedValue<T>;

export type ValueProcessor<T = unknown, M extends CachingOptions = CachingOptions> = (
  p: { value: T } & CachingOptions
) => WrappedValue<T, M>;

export type KeyProcessor = (key: string) => string;

export interface Parser {
  stringify<T = unknown>(objectToStringify: T): string;
  parse<T = unknown>(stringifiedObject: string): T;
}

export interface Processors {
  valueProcessor?: ValueProcessor;
  keyProcessor?: KeyProcessor;
  parser?: Parser;
}

export interface MemcachedAuth {
  user: string;
  password: string;
}

export interface MemcachedConnections {
  host: string;
  port: number;
  auth?: MemcachedAuth;
}

export interface MemcachedModuleOptions extends CachingOptions, Processors {
  connections?: MemcachedConnections[];
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
