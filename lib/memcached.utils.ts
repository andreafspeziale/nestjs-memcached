import { Client as MemcachedClient } from 'memjs';
import {
  MEMCACHED_MODULE_CONNECTION,
  MEMCACHED_MODULE_CONNECTION_TOKEN,
  MEMCACHED_MODULE_OPTIONS_TOKEN,
} from './memcached.constants';
import { MemcachedModuleOptions, CachedValue } from './memcached.interfaces';

export function getMemcachedOptionsToken(connection?: string): string {
  return `${connection || MEMCACHED_MODULE_CONNECTION}_${MEMCACHED_MODULE_OPTIONS_TOKEN}`;
}

export function getMemcachedConnectionToken(connection?: string): string {
  return `${connection || MEMCACHED_MODULE_CONNECTION}_${MEMCACHED_MODULE_CONNECTION_TOKEN}`;
}

export const createMemcachedClient = ({
  connections = [],
  ttl,
}: Pick<MemcachedModuleOptions, 'connections' | 'ttl'>): MemcachedClient =>
  MemcachedClient.create(
    connections
      .map((c) =>
        c.auth ? `${c.auth.user}:${c.auth.password}@${c.host}:${c.port}` : `${c.host}:${c.port}`
      )
      .join(','),
    { expires: ttl }
  );

export const toCachedValue = <T>(value: T, ttl: number, ttr?: number): CachedValue<T> => ({
  ttl,
  ...(ttr ? { ttr } : {}),
  createdAt: new Date(),
  content: value,
});
