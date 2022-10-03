import { Client as MemcachedClient } from 'memjs';
import { MEMCACHED_MODULE_OPTIONS_TOKEN, MEMCACHED_CLIENT_TOKEN } from './memcached.constants';
import {
  KeyProcessor,
  MemcachedModuleOptions,
  Parser,
  ValueProcessor,
} from './memcached.interfaces';

export const getMemcachedModuleOptionsToken = (): string => MEMCACHED_MODULE_OPTIONS_TOKEN;
export const getMemcachedClientToken = (): string => MEMCACHED_CLIENT_TOKEN;

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

export const defaultValueProcessor: ValueProcessor = ({ value, ttl, ttr }) => ({
  content: value,
  ttl,
  ...(ttr ? { ttr } : {}),
});

export const defaultKeyProcessor: KeyProcessor = (key: string): string => key;

export const defaultParser: Parser = {
  stringify: (objectToStringify) => JSON.stringify(objectToStringify),
  parse: (stringifiedObject) => JSON.parse(stringifiedObject),
};
