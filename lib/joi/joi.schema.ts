import Joi from 'joi';
import {
  MEMCACHED_HOST,
  MEMCACHED_PORT,
  MEMCACHED_TTL,
  MEMCACHED_TTR,
  MEMCACHED_VERSION,
} from '../memcached.defaults';

export const MEMCACHED_SCHEMA = Joi.object({
  MEMCACHED_HOST: Joi.string().default(MEMCACHED_HOST),
  MEMCACHED_PORT: Joi.number().default(MEMCACHED_PORT),
  MEMCACHED_TTL: Joi.number().default(MEMCACHED_TTL),
  MEMCACHED_TTR: Joi.number().less(Joi.ref('MEMCACHED_TTL')).default(MEMCACHED_TTR),
  MEMCACHED_PREFIX: Joi.string().optional(),
  MEMCACHED_VERSION: Joi.string().default(MEMCACHED_VERSION),
});
