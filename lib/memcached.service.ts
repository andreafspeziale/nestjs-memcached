import { Injectable } from '@nestjs/common';
import { Client as MemcachedClient } from 'memjs';
import {
  CachingOptions,
  MemcachedModuleOptions,
  Processors,
  ValueProcessor,
  Parser,
  KeyProcessor,
  WrappedValue,
} from './memcached.interfaces';
import { InjectMemcached, InjectMemcachedOptions } from './memcached.decorators';
import { defaultValueProcessor, defaultKeyProcessor, defaultParser } from './memcached.utils';

@Injectable()
export class MemcachedService {
  private readonly valueProcessor: ValueProcessor;
  private readonly keyProcessor: KeyProcessor;
  private readonly parser: Parser;

  constructor(
    @InjectMemcachedOptions()
    private readonly memcachedModuleOptions: MemcachedModuleOptions,
    @InjectMemcached() private readonly memcachedClient: MemcachedClient
  ) {
    this.valueProcessor = memcachedModuleOptions.valueProcessor
      ? memcachedModuleOptions.valueProcessor
      : defaultValueProcessor;

    this.keyProcessor = memcachedModuleOptions.keyProcessor
      ? memcachedModuleOptions.keyProcessor
      : defaultKeyProcessor;

    this.parser = memcachedModuleOptions.parser ? memcachedModuleOptions.parser : defaultParser;
  }

  async setWithMeta<T = unknown, M extends CachingOptions = CachingOptions>(
    key: string,
    value: T,
    options?: CachingOptions & Processors
  ): Promise<WrappedValue<T, M>> {
    const wrapperProcessorPayload = {
      value,
      ttl: options?.ttl || this.memcachedModuleOptions.ttl,
      ...(options?.ttr
        ? { ttr: options?.ttr }
        : this.memcachedModuleOptions.ttr
        ? { ttr: this.memcachedModuleOptions.ttr }
        : {}),
    };

    const wrappedValue = options?.valueProcessor
      ? options.valueProcessor(wrapperProcessorPayload)
      : this.valueProcessor(wrapperProcessorPayload);

    const processedKey = options?.keyProcessor ? options.keyProcessor(key) : this.keyProcessor(key);

    const wrappedValueToCache = options?.parser
      ? options.parser.stringify(wrappedValue)
      : this.parser.stringify(wrappedValue);

    await this.memcachedClient.set(processedKey, wrappedValueToCache, {
      expires: options?.ttl,
    });

    return options?.parser
      ? options.parser.parse(wrappedValueToCache)
      : this.parser.parse(wrappedValueToCache);
  }

  async set<T>(
    key: string,
    value: T,
    options?: Pick<CachingOptions, 'ttl'> & Pick<Processors, 'keyProcessor' | 'parser'>
  ): Promise<boolean> {
    const processedKey = options?.keyProcessor ? options.keyProcessor(key) : this.keyProcessor(key);

    const valueWithOrWithoutStereoids = options?.parser
      ? options.parser.stringify(value)
      : this.parser.stringify(value);

    return this.memcachedClient.set(processedKey, valueWithOrWithoutStereoids, {
      expires: options?.ttl || this.memcachedModuleOptions.ttl,
    });
  }

  async get<T>(key: string, options?: Omit<Processors, 'valueProcessor'>): Promise<T | null> {
    const processedKey = options?.keyProcessor ? options.keyProcessor(key) : this.keyProcessor(key);

    const cachedValue = (await this.memcachedClient.get(processedKey)).value;

    return cachedValue !== null
      ? options?.parser
        ? options.parser.parse(cachedValue.toString())
        : this.parser.parse(cachedValue.toString())
      : (cachedValue as null);
  }

  async flush(): Promise<Record<string, boolean>> {
    return this.memcachedClient.flush();
  }

  quit(): void {
    return this.memcachedClient.quit();
  }
}
