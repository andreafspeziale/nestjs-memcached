import { Inject } from '@nestjs/common';
import { getMemcachedClientToken, getMemcachedModuleOptionsToken } from './memcached.utils';

export const InjectMemcachedOptions = (): ReturnType<typeof Inject> => {
  return Inject(getMemcachedModuleOptionsToken());
};

export const InjectMemcached = (): ReturnType<typeof Inject> => {
  return Inject(getMemcachedClientToken());
};
