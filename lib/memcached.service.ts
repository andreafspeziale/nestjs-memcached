// eslint-disable-next-line import/no-extraneous-dependencies
import { stringify, parse } from 'superjson';
import { Injectable } from '@nestjs/common';
import { Client as MemcachedClient } from 'memjs';
import { CachedValue, CachingOptions, MemcachedModuleOptions } from './memcached.interfaces';
import { toCachedValue } from './memcached.utils';
import { InjectMemcached, InjectMemcachedOptions } from './memcached.decorators';

@Injectable()
export class MemcachedService {
  constructor(
    @InjectMemcachedOptions() private readonly memcachedModuleOptions: MemcachedModuleOptions,
    @InjectMemcached() private readonly memcachedClient: MemcachedClient
  ) {}

  async set<T>(key: string, value: T, options?: CachingOptions): Promise<CachedValue<T>> {
    const valueToChache = toCachedValue(
      value,
      options?.ttl || this.memcachedModuleOptions.ttl,
      options?.ttr || this.memcachedModuleOptions.ttr
    );

    await this.memcachedClient.set(key, Buffer.from(stringify(valueToChache)), {
      expires: options?.ttl,
    });

    return valueToChache;
  }

  async get<T>(key: string): Promise<CachedValue<T> | null> {
    const cachedValue = (await this.memcachedClient.get(key)).value;

    return cachedValue !== null ? parse(cachedValue.toString()) : (cachedValue as null);
  }

  async flush(): Promise<Record<string, boolean>> {
    return this.memcachedClient.flush();
  }

  quit(): void {
    return this.memcachedClient.quit();
  }
}
