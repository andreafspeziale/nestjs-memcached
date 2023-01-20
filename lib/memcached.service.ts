import b from 'bluebird';
import { Injectable } from '@nestjs/common';
import type * as MemcachedClient from 'memcached';
import { stringify, parse } from 'superjson';
import type {
  CachingOptions,
  GetOptions,
  KeyProcessor,
  MemcachedModuleOptions,
  SetOptions,
  SetWithMetaOptions,
  WrapperProcessor,
  WrappedValue,
  Parser,
  IncrDecrOptions,
  AddOptions,
} from './memcached.interfaces';
import { InjectMemcached, InjectMemcachedOptions } from './memcached.decorators';
import { defaultWrapperProcessor } from './memcached.utils';

@Injectable()
export class MemcachedService {
  private readonly client: ReturnType<typeof b.promisifyAll<MemcachedClient>>;
  private readonly wrapperProcessor: WrapperProcessor;
  private readonly keyProcessor: KeyProcessor | undefined;
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
      (options?.superjson || this.memcachedModuleOptions.superjson) && isNaN(Number(value))
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
      (options?.superjson || this.memcachedModuleOptions.superjson) && typeof value !== 'number'
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

  /**
   *
   * * used to handle race conditions
   * ! throws OperationalError if item already stored
   */
  async add<T>(key: string, value: T, options?: AddOptions): Promise<boolean> {
    const processedKey = options?.keyProcessor
      ? options.keyProcessor(key)
      : this.keyProcessor
      ? this.keyProcessor(key)
      : key;

    const parsed =
      (options?.superjson || this.memcachedModuleOptions.superjson) && typeof value !== 'number'
        ? this.parser.stringify(value)
        : value;

    return this.client.addAsync(
      processedKey,
      parsed,
      options?.ttl || this.memcachedModuleOptions.ttl
    );
  }

  /**
   *
   * * returns the current value after success increment
   * ! returns false if key does not exists
   * ! throws OperationalError if incr is applied to non numeric value
   */
  async incr(key: string, amount: number, options?: IncrDecrOptions): Promise<boolean | number> {
    const processedKey = options?.keyProcessor
      ? options.keyProcessor(key)
      : this.keyProcessor
      ? this.keyProcessor(key)
      : key;

    return this.client.incrAsync(processedKey, amount);
  }

  /**
   *
   * * returns the current value after success increment
   * * decr of 0 returns 0
   * ! returns false if key does not exists
   * ! throws OperationalError if incr is applied to non numeric value
   */
  async decr(key: string, amount: number, options?: IncrDecrOptions): Promise<boolean | number> {
    const processedKey = options?.keyProcessor
      ? options.keyProcessor(key)
      : this.keyProcessor
      ? this.keyProcessor(key)
      : key;

    return this.client.decrAsync(processedKey, amount);
  }

  async flush(): Promise<boolean[]> {
    return this.client.flushAsync();
  }

  end(): void {
    return this.client.end();
  }
}
