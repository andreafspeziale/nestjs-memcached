import { Pool } from '@joshbetz/memcached';
import { ConnectionOption, MemcachedClient } from './memcached.interfaces';
import {
  MEMCACHED_MODULE_OPTIONS_TOKEN,
  MEMCACHED_CLIENT_TOKEN,
  MEMCACHED_OPTIONAL_LOGGER_TOKEN,
} from './memcached.constants';
import { MEMCACHED_HOST, MEMCACHED_PORT } from './memcached.defaults';

export const getMemcachedModuleOptionsToken = (): string => MEMCACHED_MODULE_OPTIONS_TOKEN;
export const getMemcachedClientToken = (): string => MEMCACHED_CLIENT_TOKEN;
export const getMemcachedOptionalLoggerToken = (): string => MEMCACHED_OPTIONAL_LOGGER_TOKEN;

export const createMemcachedClient = (
  connection: ConnectionOption['connection'],
): MemcachedClient =>
  new Pool(
    connection?.port || MEMCACHED_PORT,
    connection?.host || MEMCACHED_HOST,
    connection?.options,
  );
