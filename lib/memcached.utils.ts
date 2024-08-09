import MemcachedClient from 'memcached';
import { MEMCACHED_MODULE_OPTIONS_TOKEN, MEMCACHED_CLIENT_TOKEN } from './memcached.constants';
import { MemcachedModuleOptions, WrapperProcessor } from './memcached.interfaces';

export const getMemcachedModuleOptionsToken = (): string => MEMCACHED_MODULE_OPTIONS_TOKEN;
export const getMemcachedClientToken = (): string => MEMCACHED_CLIENT_TOKEN;

export const createMemcachedClient = ({
  connections = [],
}: Pick<MemcachedModuleOptions, 'connections'>): MemcachedClient =>
  new MemcachedClient(
    connections.map((c) => (c.port ? `${c.host}:${c.port}` : `${c.host}`)).join(','),
  );

export const defaultWrapperProcessor: WrapperProcessor = ({ value, ttl, ttr }) => ({
  content: value,
  ttl,
  ...(ttr ? { ttr } : {}),
});
