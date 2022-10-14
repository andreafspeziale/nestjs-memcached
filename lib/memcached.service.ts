import * as b from 'bluebird';
import { Injectable } from '@nestjs/common';
import * as MemcachedClient from 'memcached';
import {
  CachingOptions,
  MemcachedModuleOptions,
  Processors,
  WrappedValue,
} from './memcached.interfaces';
import { InjectMemcached, InjectMemcachedOptions } from './memcached.decorators';
import { defaultValueProcessor } from './memcached.utils';

@Injectable()
export class MemcachedService {
  private readonly client: ReturnType<typeof b.promisifyAll<MemcachedClient>>;

  constructor(
    @InjectMemcachedOptions()
    private readonly memcachedModuleOptions: MemcachedModuleOptions,
    @InjectMemcached() private readonly memcachedClient: MemcachedClient
  ) {
    this.client = b.promisifyAll(this.memcachedClient);
  }

  // eslint-disable-next-line @typescript-eslint/no-shadow
  async setWithMeta<T, R = WrappedValue<T> & CachingOptions>(
    key: string,
    value: T,
    options?: Partial<CachingOptions> & Processors<T, R>
  ): Promise<boolean> {
    const ttl = options?.ttl || this.memcachedModuleOptions.ttl;

    const wrapperProcessorPayload = {
      value,
      ttl,
      ...(options?.ttr
        ? { ttr: options?.ttr }
        : this.memcachedModuleOptions.ttr
        ? { ttr: this.memcachedModuleOptions.ttr }
        : {}),
    };

    const processedKey = options?.keyProcessor
      ? options.keyProcessor(key)
      : this.memcachedModuleOptions.keyProcessor
      ? this.memcachedModuleOptions.keyProcessor(key)
      : key;

    const wrappedValue = options?.valueProcessor
      ? options.valueProcessor(wrapperProcessorPayload)
      : defaultValueProcessor<T>(wrapperProcessorPayload);

    return this.client.setAsync(processedKey, wrappedValue, ttl);
  }

  async set<T>(
    key: string,
    value: T,
    options?: Partial<Pick<CachingOptions, 'ttl'>> & Pick<Processors, 'keyProcessor'>
  ): Promise<boolean> {
    const processedKey = options?.keyProcessor
      ? options.keyProcessor(key)
      : this.memcachedModuleOptions.keyProcessor
      ? this.memcachedModuleOptions.keyProcessor(key)
      : key;

    return this.client.setAsync(
      processedKey,
      value,
      options?.ttl || this.memcachedModuleOptions.ttl
    );
  }

  async get<T = unknown>(
    key: string,
    options?: Pick<Processors, 'keyProcessor'>
  ): Promise<T | null> {
    const processedKey = options?.keyProcessor
      ? options.keyProcessor(key)
      : this.memcachedModuleOptions.keyProcessor
      ? this.memcachedModuleOptions.keyProcessor(key)
      : key;
    return (await this.client.getAsync(processedKey)) || null;
  }

  async flush(): Promise<boolean[]> {
    return this.client.flushAsync();
  }

  end(): void {
    return this.client.end();
  }
}
