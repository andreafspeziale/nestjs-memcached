import { parse, stringify } from 'superjson';
import { Injectable, OnModuleDestroy, Optional } from '@nestjs/common';
import { LoggerService } from '@andreafspeziale/nestjs-log';
import { MEMCACHED_HOST, MEMCACHED_PORT } from './memcached.defaults';
import {
  InjectMemcached,
  InjectMemcachedOptionalLogger,
  InjectMemcachedOptions,
} from './memcached.decorators';
import {
  MemcachedModuleOptions,
  CachableValue,
  OptionalLifetimesOption,
  OptionalVersionOption,
  OptionalPrefixOption,
  KeyProcessor,
  OptionalKeyProcessorOption,
  GetProcessor,
  OptionalGetProcessorOption,
  SetProcessor,
  OptionalSetProcessorOption,
  SetProcessorInput,
  DisableGetProcessor,
  DisableSetProcessor,
  MemcachedClient,
} from './memcached.interfaces';
import { MemcachedException } from './memcached.exception';

@Injectable()
export class MemcachedService implements OnModuleDestroy {
  private readonly keyProcessor?: KeyProcessor;
  private readonly getProcessor?: GetProcessor;
  private readonly setProcessor?: SetProcessor;

  constructor(
    @InjectMemcachedOptions()
    private readonly memcachedModuleOptions: MemcachedModuleOptions,
    @InjectMemcached() private readonly memcachedClient: MemcachedClient,
    @Optional()
    @InjectMemcachedOptionalLogger()
    private readonly logger?: LoggerService,
  ) {
    this.memcachedModuleOptions.log && this.logger?.setContext(MemcachedService.name);

    if (memcachedModuleOptions.keyProcessor?.fn) {
      this.keyProcessor = memcachedModuleOptions.keyProcessor.fn;
    }

    if (memcachedModuleOptions.getProcessor?.fn) {
      this.getProcessor = memcachedModuleOptions.getProcessor.fn;
    }

    if (memcachedModuleOptions.setProcessor?.fn) {
      this.setProcessor = memcachedModuleOptions.setProcessor.fn;
    }
  }

  async get<
    Cached extends CachableValue = never,
    ValueGetProcessorInput extends CachableValue = never,
  >(
    key: string,
    options?: [Cached] extends [never]
      ? [ValueGetProcessorInput] extends [never]
        ? OptionalLifetimesOption &
            OptionalVersionOption &
            OptionalPrefixOption &
            OptionalKeyProcessorOption
        : OptionalLifetimesOption &
            OptionalVersionOption &
            OptionalPrefixOption &
            OptionalKeyProcessorOption &
            DisableGetProcessor
      : [ValueGetProcessorInput] extends [never]
        ? OptionalLifetimesOption &
            OptionalVersionOption &
            OptionalPrefixOption &
            OptionalKeyProcessorOption &
            DisableGetProcessor
        : OptionalLifetimesOption &
            OptionalVersionOption &
            OptionalPrefixOption &
            OptionalKeyProcessorOption &
            OptionalGetProcessorOption<Cached, ValueGetProcessorInput>,
  ): Promise<([Cached] extends [never] ? CachableValue : Cached) | null>;

  async get<
    Cached extends CachableValue = CachableValue,
    ValueGetProcessorInput extends CachableValue = CachableValue,
  >(
    key: string,
    options?: OptionalLifetimesOption &
      OptionalVersionOption &
      OptionalPrefixOption &
      OptionalKeyProcessorOption &
      OptionalGetProcessorOption<Cached, ValueGetProcessorInput>,
  ): Promise<Cached | CachableValue | null> {
    const { ttl, ttr } = options?.lifetimes
      ? options?.lifetimes
      : this.memcachedModuleOptions.lifetimes;

    const version = options?.version ? options.version : this.memcachedModuleOptions.version;

    const prefix = options?.prefix ? options.prefix : this.memcachedModuleOptions.prefix;

    let processedkey: string;
    let cachedProcessedValue: Cached | CachableValue | null;

    this.memcachedModuleOptions.log &&
      this.logger?.debug('Ready to eventually process key...', {
        fn: this.get.name,
        key,
        ttl,
        ttr,
        version,
        prefix,
      });

    try {
      if (
        options?.keyProcessor?.disable !== true &&
        this.memcachedModuleOptions.keyProcessor?.disable !== true
      ) {
        const keyProcessorPayload = {
          key,
          ttl,
          ...(ttr ? { ttr } : {}),
          ...(version ? { version } : {}),
          ...(prefix ? { prefix } : {}),
        };

        processedkey = options?.keyProcessor?.fn
          ? options?.keyProcessor.fn(keyProcessorPayload)
          : this.keyProcessor
            ? this.keyProcessor(keyProcessorPayload)
            : key;
      } else {
        processedkey = key;
      }

      this.memcachedModuleOptions.log &&
        this.logger?.debug('Checking connection...', {
          fn: this.get.name,
          key,
          processedkey,
          ttl,
          ttr,
          version,
          prefix,
        });

      const ping = await this.memcachedClient.ping();

      if (!ping) {
        this.memcachedModuleOptions.log &&
          this.logger?.error('Pre connection check failed', {
            fn: this.get.name,
            ping,
            connection: {
              host: this.memcachedModuleOptions.connection?.host || MEMCACHED_HOST,
              port: this.memcachedModuleOptions.connection?.port || MEMCACHED_PORT,
              options: this.memcachedModuleOptions.connection?.port || {},
            },
          });

        throw new Error(`Connection issue`);
      }

      const cached = await this.memcachedClient.get(processedkey);

      this.memcachedModuleOptions.log &&
        this.logger?.debug('Cached data', {
          fn: this.get.name,
          key,
          processedkey,
          ttl,
          ttr,
          version,
          prefix,
          cached,
        });

      if (cached !== false) {
        if (
          options?.getProcessor?.disable !== true &&
          this.memcachedModuleOptions.getProcessor?.disable !== true
        ) {
          cachedProcessedValue = options?.getProcessor?.fn
            ? options?.getProcessor.fn(parse<ValueGetProcessorInput>(cached))
            : this.getProcessor
              ? this.getProcessor(parse<Cached>(cached))
              : parse<Cached>(cached);
        } else {
          cachedProcessedValue = parse<Cached>(cached);
        }
      } else {
        cachedProcessedValue = null;
      }

      this.memcachedModuleOptions.log &&
        this.logger?.debug('Processed cached data', {
          fn: this.get.name,
          key,
          processedkey,
          ttl,
          ttr,
          version,
          prefix,
          cached,
          cachedProcessedValue,
        });

      return cachedProcessedValue;
    } catch (error) {
      this.memcachedModuleOptions.log &&
        this.logger?.error('Command "get" failed', {
          fn: this.get.name,
          error,
        });

      throw new MemcachedException({
        message: 'Command "get" failed',
        details: [(error as Error).message],
      });
    }
  }

  async set<Cached extends CachableValue, ValueSetProcessorOutput extends CachableValue = never>(
    key: string,
    value: Cached,
    options?: [ValueSetProcessorOutput] extends [never]
      ? OptionalLifetimesOption &
          OptionalVersionOption &
          OptionalPrefixOption &
          OptionalKeyProcessorOption &
          DisableSetProcessor
      : OptionalLifetimesOption &
          OptionalVersionOption &
          OptionalPrefixOption &
          OptionalKeyProcessorOption &
          OptionalSetProcessorOption<Cached, ValueSetProcessorOutput>,
  ): Promise<void>;

  async set<
    Cached extends CachableValue = CachableValue,
    ValueSetProcessorOutput extends CachableValue = CachableValue,
  >(
    key: string,
    value: Cached,
    options?: OptionalLifetimesOption &
      OptionalVersionOption &
      OptionalPrefixOption &
      OptionalKeyProcessorOption &
      OptionalSetProcessorOption<Cached, ValueSetProcessorOutput>,
  ): Promise<void> {
    const { ttl, ttr } = options?.lifetimes
      ? options?.lifetimes
      : this.memcachedModuleOptions.lifetimes;

    const version = options?.version ? options.version : this.memcachedModuleOptions.version;

    const prefix = options?.prefix ? options.prefix : this.memcachedModuleOptions.prefix;

    let processedKey: string;
    let processedValue: Cached | ValueSetProcessorOutput | CachableValue;

    this.memcachedModuleOptions.log &&
      this.logger?.debug('Ready to eventually process key...', {
        fn: this.set.name,
        key,
        ttl,
        ttr,
        version,
        prefix,
        value,
      });

    try {
      if (
        options?.keyProcessor?.disable !== true &&
        this.memcachedModuleOptions.keyProcessor?.disable !== true
      ) {
        const keyProcessorPayload = {
          key,
          ttl,
          ...(ttr ? { ttr } : {}),
          ...(version ? { version } : {}),
          ...(prefix ? { prefix } : {}),
        };

        processedKey = options?.keyProcessor?.fn
          ? options?.keyProcessor.fn(keyProcessorPayload)
          : this.keyProcessor
            ? this.keyProcessor(keyProcessorPayload)
            : key;
      } else {
        processedKey = key;
      }

      this.memcachedModuleOptions.log &&
        this.logger?.debug('Ready to eventually process value...', {
          fn: this.set.name,
          key,
          processedKey,
          ttl,
          ttr,
          version,
          prefix,
          value,
        });

      if (
        options?.setProcessor?.disable !== true &&
        this.memcachedModuleOptions.setProcessor?.disable !== true
      ) {
        const valueProcessorPayload: SetProcessorInput<Cached> = {
          value,
          ttl,
          ...(ttr ? { ttr } : {}),
          ...(version ? { version } : {}),
          ...(prefix ? { prefix } : {}),
        };

        processedValue = options?.setProcessor?.fn
          ? options?.setProcessor.fn(valueProcessorPayload)
          : this.setProcessor
            ? this.setProcessor(valueProcessorPayload)
            : value;
      } else {
        processedValue = value;
      }

      this.memcachedModuleOptions.log &&
        this.logger?.debug('Processed value', {
          fn: this.set.name,
          key,
          processedKey,
          ttl,
          ttr,
          version,
          prefix,
          value,
          processedValue,
        });

      const ping = await this.memcachedClient.ping();

      if (!ping) {
        this.memcachedModuleOptions.log &&
          this.logger?.error('Pre connection check failed', {
            fn: this.set.name,
            ping,
            connection: {
              host: this.memcachedModuleOptions.connection?.host || MEMCACHED_HOST,
              port: this.memcachedModuleOptions.connection?.port || MEMCACHED_PORT,
              options: this.memcachedModuleOptions.connection?.port || {},
            },
          });

        throw new Error(`Connection issue`);
      }

      const setResult = await this.memcachedClient.set(
        processedKey,
        stringify(processedValue),
        ttl,
      );

      if (!setResult) {
        this.memcachedModuleOptions.log &&
          this.logger?.error(
            `Possible connection issue, underlying command "set" returned: ${setResult}`,
            {
              fn: this.set.name,
              setResult,
              connection: {
                host: this.memcachedModuleOptions.connection?.host || MEMCACHED_HOST,
                port: this.memcachedModuleOptions.connection?.port || MEMCACHED_PORT,
                options: this.memcachedModuleOptions.connection?.port || {},
              },
              processedKey,
              serializedProcessedValue: stringify(processedValue),
              ttl,
            },
          );

        throw new Error(
          `Possible connection issue, underlying command "set" returned: ${setResult}`,
        );
      }
    } catch (error) {
      this.memcachedModuleOptions.log &&
        this.logger?.error('Command "get" failed', {
          fn: this.set.name,
          error,
        });

      throw new MemcachedException({
        message: 'Command "set" failed',
        details: [(error as Error).message],
      });
    }
  }

  async ping(): Promise<void> {
    this.memcachedModuleOptions.log &&
      this.logger?.debug('Pinging...', {
        fn: this.ping.name,
      });

    try {
      const ping = await this.memcachedClient.ping();

      if (!ping) {
        this.memcachedModuleOptions.log &&
          this.logger?.error('Connection issues', {
            fn: this.ping.name,
            ping,
            connection: {
              host: this.memcachedModuleOptions.connection?.host || MEMCACHED_HOST,
              port: this.memcachedModuleOptions.connection?.port || MEMCACHED_PORT,
              options: this.memcachedModuleOptions.connection?.port || {},
            },
          });

        throw new Error('Connection issues');
      }
    } catch (error) {
      this.memcachedModuleOptions.log &&
        this.logger?.error('Error pinging', {
          fn: this.ping.name,
          error,
        });

      throw new MemcachedException({
        message: 'Command "ping" failed',
        details: [(error as Error).message],
      });
    }
  }

  async flush(): Promise<void> {
    this.memcachedModuleOptions.log &&
      this.logger?.debug('Flushing...', {
        fn: this.flush.name,
      });

    try {
      await this.memcachedClient.flush();
    } catch (error) {
      this.memcachedModuleOptions.log &&
        this.logger?.error('Error flushing', {
          fn: this.flush.name,
          error,
        });

      throw new MemcachedException({
        message: 'Command "flush" failed',
        details: [(error as Error).message],
      });
    }
  }

  async end(): Promise<void> {
    this.memcachedModuleOptions.log &&
      this.logger?.debug('Closing connection...', {
        fn: this.end.name,
      });

    try {
      await this.memcachedClient.end();
    } catch (error) {
      this.memcachedModuleOptions.log &&
        this.logger?.error('Error closing connection', {
          fn: this.end.name,
          error,
        });

      throw new MemcachedException({
        message: 'Command "end" failed',
        details: [(error as Error).message],
      });
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.memcachedModuleOptions.log &&
      this.logger?.debug('Destroying module...', {
        fn: this.onModuleDestroy.name,
      });

    try {
      await this.memcachedClient.end();
    } catch (error) {
      this.memcachedModuleOptions.log &&
        this.logger?.error('Error closing connection', {
          fn: this.onModuleDestroy.name,
          error,
        });

      throw new MemcachedException({
        message: 'Command "end" failed',
        details: [(error as Error).message],
      });
    }
  }
}
