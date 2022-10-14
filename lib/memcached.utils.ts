import * as MemcachedClient from 'memcached';
import { MEMCACHED_MODULE_OPTIONS_TOKEN, MEMCACHED_CLIENT_TOKEN } from './memcached.constants';
import { WrappedValue, CachingOptions, MemcachedModuleOptions } from './memcached.interfaces';

export const getMemcachedModuleOptionsToken = (): string => MEMCACHED_MODULE_OPTIONS_TOKEN;
export const getMemcachedClientToken = (): string => MEMCACHED_CLIENT_TOKEN;

export const createMemcachedClient = ({
  connections = [],
}: Pick<MemcachedModuleOptions, 'connections' | 'ttl'>): MemcachedClient =>
  new MemcachedClient(
    connections.map((c) => (c.port ? `${c.host}:${c.port}` : `${c.host}`)).join(',')
  );

export const defaultValueProcessor = <T = unknown>({
  value,
  ttl,
  ttr,
}: Record<'value', T> & CachingOptions): WrappedValue<T> & CachingOptions => ({
  content: value,
  ttl,
  ...(ttr ? { ttr } : {}),
});
