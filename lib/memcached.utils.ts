import Memcached from 'memcached';
import {
  MEMCACHED_MODULE_OPTIONS_TOKEN,
  MEMCACHED_CLIENT_TOKEN,
  MEMCACHED_LOGGER_TOKEN,
} from './memcached.constants';
import { MemcachedModuleOptions, WrapperProcessor, MemcachedClient } from './memcached.interfaces';

export const getMemcachedModuleOptionsToken = (): string => MEMCACHED_MODULE_OPTIONS_TOKEN;
export const getMemcachedClientToken = (): string => MEMCACHED_CLIENT_TOKEN;
export const getMemcachedLoggerToken = (): string => MEMCACHED_LOGGER_TOKEN;

export const createMemcachedClient = ({
  connections = [],
}: Pick<MemcachedModuleOptions, 'connections'>): MemcachedClient =>
  Array.isArray(connections)
    ? new Memcached(
        connections.map((c) => (c.port ? `${c.host}:${c.port}` : `${c.host}`)).join(','),
      )
    : new Memcached(
        connections.locations
          ? connections.locations
              .map((c) => (c.port ? `${c.host}:${c.port}` : `${c.host}`))
              .join(',')
          : [],
        connections.options,
      );

export const defaultWrapperProcessor: WrapperProcessor = ({ value, ttl, ttr }) => ({
  content: value,
  ttl,
  ...(ttr ? { ttr } : {}),
});
