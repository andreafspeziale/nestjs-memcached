import { z } from 'zod';
import {
  MEMCACHED_HOST,
  MEMCACHED_PORT,
  MEMCACHED_TTL,
  MEMCACHED_TTR,
  MEMCACHED_VERSION,
} from '../memcached.defaults';

export const memcachedSchema = z.object({
  MEMCACHED_HOST: z.string().default(MEMCACHED_HOST),
  MEMCACHED_PORT: z.coerce.number().int().default(MEMCACHED_PORT),
  MEMCACHED_TTL: z.coerce.number().int().default(MEMCACHED_TTL),
  MEMCACHED_TTR: z.coerce.number().int().default(MEMCACHED_TTR),
  MEMCACHED_PREFIX: z.string().optional(),
  MEMCACHED_VERSION: z.string().default(MEMCACHED_VERSION),
});
