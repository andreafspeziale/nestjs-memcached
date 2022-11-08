import { ModuleMetadata, Type } from '@nestjs/common';
import { stringify, parse } from 'superjson';

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

export type BaseWrapper<T = unknown> = WrappedValue<T> & CachingOptions;

export type WrapperProcessor<T = unknown, R = BaseWrapper<T>> = (
  p: { value: T } & CachingOptions
) => R;

export type KeyProcessor = (key: string) => string;

export interface Processors<T = unknown, R = BaseWrapper<T>> {
  wrapperProcessor?: WrapperProcessor<T, R>;
  keyProcessor?: KeyProcessor;
}

export interface MemcachedModuleOptions<T = unknown, R = BaseWrapper<T> & Record<string, unknown>>
  extends CachingOptions,
    Processors<T, R> {
  connections?: MemcachedConnections[];
  superjson?: boolean;
}

export type SetWithMetaOptions<T = unknown, R = BaseWrapper<T>> = Partial<CachingOptions> &
  Processors<T, R> &
  Pick<MemcachedModuleOptions, 'superjson'>;

export type SetOptions = Partial<Pick<CachingOptions, 'ttl'>> &
  Pick<Processors, 'keyProcessor'> &
  Pick<MemcachedModuleOptions, 'superjson'>;

export type GetOptions = Pick<Processors, 'keyProcessor'> &
  Pick<MemcachedModuleOptions, 'superjson'>;

export type IncrDecrOptions = Pick<Processors, 'keyProcessor'>;

export interface Parser {
  stringify: typeof stringify;
  parse: typeof parse;
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
