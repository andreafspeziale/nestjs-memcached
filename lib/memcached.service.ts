import * as b from 'bluebird';
import { Injectable } from '@nestjs/common';
import * as MemcachedClient from 'memcached';
import { stringify, parse } from 'superjson';
import {
  CachingOptions,
  GetOptions,
  KeyProcessor,
  MemcachedModuleOptions,
  SetOptions,
  SetWithMetaOptions,
  WrapperProcessor,
  WrappedValue,
  Parser,
} from './memcached.interfaces';
import { InjectMemcached, InjectMemcachedOptions } from './memcached.decorators';
import { defaultWrapperProcessor } from './memcached.utils';

@Injectable()
export class MemcachedService {
  private readonly client: ReturnType<typeof b.promisifyAll<MemcachedClient>>;
  private readonly wrapperProcessor: WrapperProcessor;
  private readonly keyProcessor?: KeyProcessor;
  private readonly parser: Parser;

  constructor(
    @InjectMemcachedOptions()
    private readonly memcachedModuleOptions: MemcachedModuleOptions,
    @InjectMemcached() private readonly memcachedClient: MemcachedClient
  ) {
    this.client = b.promisifyAll(this.memcachedClient);

    this.wrapperProcessor = memcachedModuleOptions.wrapperProcessor
      ? memcachedModuleOptions.wrapperProcessor
      : defaultWrapperProcessor;

    this.keyProcessor = memcachedModuleOptions.keyProcessor;

    this.parser = {
      stringify,
      parse,
    };
  }

  async setWithMeta<T, R = WrappedValue<T> & CachingOptions>(
    key: string,
    value: T,
    options?: SetWithMetaOptions<T, R>
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
      : this.keyProcessor
      ? this.keyProcessor(key)
      : key;

    const wrappedValue = options?.wrapperProcessor
      ? options.wrapperProcessor(wrapperProcessorPayload)
      : this.wrapperProcessor(wrapperProcessorPayload);

    const parsed =
      options?.superjson || this.memcachedModuleOptions.superjson
        ? this.parser.stringify(wrappedValue)
        : wrappedValue;

    return this.client.setAsync(processedKey, parsed, ttl);
  }

  async set<T>(key: string, value: T, options?: SetOptions): Promise<boolean> {
    const processedKey = options?.keyProcessor
      ? options.keyProcessor(key)
      : this.keyProcessor
      ? this.keyProcessor(key)
      : key;

    const parsed =
      options?.superjson || this.memcachedModuleOptions.superjson
        ? this.parser.stringify(value)
        : value;

    return this.client.setAsync(
      processedKey,
      parsed,
      options?.ttl || this.memcachedModuleOptions.ttl
    );
  }

  async get<T = unknown>(key: string, options?: GetOptions): Promise<T | null> {
    const processedKey = options?.keyProcessor
      ? options.keyProcessor(key)
      : this.keyProcessor
      ? this.keyProcessor(key)
      : key;

    const cached: T | undefined = await this.client.getAsync(processedKey);

    return cached
      ? (options?.superjson || this.memcachedModuleOptions.superjson) && typeof cached === 'string'
        ? this.parser.parse<T>(cached)
        : cached
      : null;
  }

  async flush(): Promise<boolean[]> {
    return this.client.flushAsync();
  }

  end(): void {
    return this.client.end();
  }
}
