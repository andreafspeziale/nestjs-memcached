import { Inject } from '@nestjs/common';
import {
  getMemcachedClientToken,
  getMemcachedLoggerToken,
  getMemcachedModuleOptionsToken,
} from './memcached.utils';

export const InjectMemcachedOptions = (): ReturnType<typeof Inject> => {
  return Inject(getMemcachedModuleOptionsToken());
};

export const InjectMemcached = (): ReturnType<typeof Inject> => {
  return Inject(getMemcachedClientToken());
};

export const InjectMemcachedLogger = (): ReturnType<typeof Inject> => {
  return Inject(getMemcachedLoggerToken());
};
