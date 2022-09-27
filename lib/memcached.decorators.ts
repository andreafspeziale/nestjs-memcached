import { Inject } from '@nestjs/common';
import { getMemcachedOptionsToken, getMemcachedConnectionToken } from './memcached.utils';

export const InjectMemcachedOptions = (connection?: string): ReturnType<typeof Inject> => {
  return Inject(getMemcachedOptionsToken(connection));
};

export const InjectMemcached = (connection?: string): ReturnType<typeof Inject> => {
  return Inject(getMemcachedConnectionToken(connection));
};
