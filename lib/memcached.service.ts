import b from 'bluebird';
import { Injectable, OnModuleDestroy, Optional } from '@nestjs/common';
import { LoggerService } from '@andreafspeziale/nestjs-log';
import { stringify, parse } from 'superjson';
import {
  MemcachedClient,
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
  DelOptions,
} from './memcached.interfaces';
import {
  InjectMemcached,
  InjectMemcachedLogger,
  InjectMemcachedOptions,
} from './memcached.decorators';
import { defaultWrapperProcessor } from './memcached.utils';

@Injectable()
export class MemcachedService implements OnModuleDestroy {
  private readonly client: ReturnType<typeof b.promisifyAll<MemcachedClient>>;
  private readonly wrapperProcessor: WrapperProcessor;
  private readonly keyProcessor: KeyProcessor | undefined;
  private readonly parser: Parser;

  constructor(
    @InjectMemcachedOptions()
    private readonly memcachedModuleOptions: MemcachedModuleOptions,
    @InjectMemcached() private readonly memcachedClient: MemcachedClient,
    @Optional()
    @InjectMemcachedLogger()
    private readonly logger?: LoggerService,
  ) {
    this.memcachedModuleOptions.log && this.logger?.setContext(MemcachedService.name);

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
    options?: SetWithMetaOptions<T, R>,
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

    this.memcachedModuleOptions.log &&
      this.logger?.debug('Ready to eventually process key...', {
        fn: this.setWithMeta.name,
        key,
        value,
        wrapperProcessorPayload,
      });

    const processedKey = options?.keyProcessor
      ? options.keyProcessor(key)
      : this.keyProcessor
        ? this.keyProcessor(key)
        : key;

    this.memcachedModuleOptions.log &&
      this.logger?.debug('Ready to wrap cache data with meta...', {
        fn: this.setWithMeta.name,
        key,
        processedKey,
        value,
        wrapperProcessorPayload,
      });

    const wrappedValue = options?.wrapperProcessor
      ? options.wrapperProcessor(wrapperProcessorPayload)
      : this.wrapperProcessor(wrapperProcessorPayload);

    this.memcachedModuleOptions.log &&
      this.logger?.debug('Ready to eventualy serialize data...', {
        fn: this.setWithMeta.name,
        key,
        processedKey,
        value,
        wrapperProcessorPayload,
        wrappedValue,
      });

    const searialized =
      (options?.superjson || this.memcachedModuleOptions.superjson) && isNaN(Number(value))
        ? this.parser.stringify(wrappedValue)
        : wrappedValue;

    this.memcachedModuleOptions.log &&
      this.logger?.debug('Ready to cache with meta...', {
        fn: this.setWithMeta.name,
        key,
        processedKey,
        value,
        wrapperProcessorPayload,
        wrappedValue,
        searialized,
      });

    return this.client.setAsync(processedKey, searialized, ttl);
  }

  async set<T>(key: string, value: T, options?: SetOptions): Promise<boolean> {
    this.memcachedModuleOptions.log &&
      this.logger?.debug('Ready to eventually process key...', {
        fn: this.set.name,
        key,
        value,
      });

    const processedKey = options?.keyProcessor
      ? options.keyProcessor(key)
      : this.keyProcessor
        ? this.keyProcessor(key)
        : key;

    this.memcachedModuleOptions.log &&
      this.logger?.debug('Ready to eventually serialize data...', {
        fn: this.set.name,
        key,
        processedKey,
        value,
      });

    const serialized =
      (options?.superjson || this.memcachedModuleOptions.superjson) && typeof value !== 'number'
        ? this.parser.stringify(value)
        : value;

    this.memcachedModuleOptions.log &&
      this.logger?.debug('Ready to cache...', {
        fn: this.set.name,
        key,
        processedKey,
        value,
        serialized,
      });

    return this.client.setAsync(
      processedKey,
      serialized,
      options?.ttl || this.memcachedModuleOptions.ttl,
    );
  }

  async get<T = unknown>(key: string, options?: GetOptions): Promise<T | null> {
    this.memcachedModuleOptions.log &&
      this.logger?.debug('Ready to eventually process key...', {
        fn: this.get.name,
        key,
      });

    const processedKey = options?.keyProcessor
      ? options.keyProcessor(key)
      : this.keyProcessor
        ? this.keyProcessor(key)
        : key;

    this.memcachedModuleOptions.log &&
      this.logger?.debug('Ready to get data...', {
        fn: this.get.name,
        key,
        processedKey,
      });

    const cached: T | undefined = await this.client.getAsync(processedKey);

    this.memcachedModuleOptions.log &&
      this.logger?.debug('Raw cached data', {
        fn: this.get.name,
        key,
        processedKey,
        cached,
      });

    return cached !== undefined
      ? options?.superjson || this.memcachedModuleOptions.superjson
        ? typeof cached === 'string'
          ? this.parser.parse<T>(cached)
          : cached
        : cached
      : null;
  }

  /**
   *
   * * used to handle race conditions
   * ! throws OperationalError if item already stored
   */
  async add<T>(key: string, value: T, options?: AddOptions): Promise<boolean> {
    this.memcachedModuleOptions.log &&
      this.logger?.debug('Ready to eventually process key...', {
        fn: this.add.name,
        key,
        value,
      });

    const processedKey = options?.keyProcessor
      ? options.keyProcessor(key)
      : this.keyProcessor
        ? this.keyProcessor(key)
        : key;

    this.memcachedModuleOptions.log &&
      this.logger?.debug('Ready to eventually serialize data...', {
        fn: this.add.name,
        key,
        processedKey,
        value,
      });

    const searialized =
      (options?.superjson || this.memcachedModuleOptions.superjson) && typeof value !== 'number'
        ? this.parser.stringify(value)
        : value;

    this.memcachedModuleOptions.log &&
      this.logger?.debug('Ready to add data...', {
        fn: this.add.name,
        key,
        processedKey,
        value,
        searialized,
      });

    return this.client.addAsync(
      processedKey,
      searialized,
      options?.ttl || this.memcachedModuleOptions.ttl,
    );
  }

  /**
   *
   * * returns the current value after success increment
   * ! returns false if key does not exists
   * ! throws OperationalError if incr is applied to non numeric value
   */
  async incr(key: string, amount: number, options?: IncrDecrOptions): Promise<boolean | number> {
    this.memcachedModuleOptions.log &&
      this.logger?.debug('Ready to eventually process key...', {
        fn: this.incr.name,
        key,
        amount,
      });

    const processedKey = options?.keyProcessor
      ? options.keyProcessor(key)
      : this.keyProcessor
        ? this.keyProcessor(key)
        : key;

    this.memcachedModuleOptions.log &&
      this.logger?.debug('Ready to incr...', {
        fn: this.incr.name,
        key,
        processedKey,
        amount,
      });

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
    this.memcachedModuleOptions.log &&
      this.logger?.debug('Ready to eventually process key...', {
        fn: this.decr.name,
        key,
        amount,
      });

    const processedKey = options?.keyProcessor
      ? options.keyProcessor(key)
      : this.keyProcessor
        ? this.keyProcessor(key)
        : key;

    this.memcachedModuleOptions.log &&
      this.logger?.debug('Ready to decr...', {
        fn: this.decr.name,
        key,
        processedKey,
        amount,
      });

    return this.client.decrAsync(processedKey, amount);
  }

  async del(key: string, options?: DelOptions): Promise<boolean> {
    this.memcachedModuleOptions.log &&
      this.logger?.debug('Ready to eventually process key...', {
        fn: this.del.name,
        key,
      });

    const processedKey = options?.keyProcessor
      ? options.keyProcessor(key)
      : this.keyProcessor
        ? this.keyProcessor(key)
        : key;

    this.memcachedModuleOptions.log &&
      this.logger?.debug('Ready to del...', {
        fn: this.del.name,
        key,
        processedKey,
      });

    return this.client.delAsync(processedKey);
  }

  async flush(): Promise<boolean[]> {
    this.memcachedModuleOptions.log &&
      this.logger?.debug('Flushing...', {
        fn: this.flush.name,
      });

    return this.client.flushAsync();
  }

  end(): void {
    this.memcachedModuleOptions.log &&
      this.logger?.debug('Closing connection...', {
        fn: this.end.name,
      });

    this.client.end();
  }

  onModuleDestroy(): void {
    this.memcachedModuleOptions.log &&
      this.logger?.debug('Closing connection...', {
        fn: this.onModuleDestroy.name,
      });

    this.client.end();
  }
}
