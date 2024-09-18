import { Inject } from '@nestjs/common';
import {
  getMemcachedClientToken,
  getMemcachedModuleOptionsToken,
  getMemcachedOptionalLoggerToken,
} from './memcached.utils';

export const InjectMemcachedOptions = (): ReturnType<typeof Inject> => {
  return Inject(getMemcachedModuleOptionsToken());
};

export const InjectMemcached = (): ReturnType<typeof Inject> => {
  return Inject(getMemcachedClientToken());
};

export const InjectMemcachedOptionalLogger = (): ReturnType<typeof Inject> => {
  return Inject(getMemcachedOptionalLoggerToken());
};
