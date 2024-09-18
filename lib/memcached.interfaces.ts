import { Pool } from '@joshbetz/memcached';
import { PoolOptions } from '@joshbetz/memcached/build/pool';
import { ModuleMetadata, Provider, Type } from '@nestjs/common';

/**
 * Memcache client alias
 */

export type MemcachedClient = Pool;

/**
 * The following is what we can actually
 */

type CachablePrimitiveJSONValue = string | number | boolean;

interface CachableJSONArray extends Array<CachableJSONValue> {}

interface CachableJSONObject {
  [key: string]: CachableJSONValue;
}

type CachableJSONValue = CachablePrimitiveJSONValue | CachableJSONArray | CachableJSONObject;

interface CachableArray extends Array<CachableValue> {}

interface CachableObject {
  [key: string]: CachableValue;
}

type CachableSerializableJSONValue =
  | symbol
  | Set<CachableValue>
  | Map<CachableValue, CachableValue>
  | undefined
  | bigint
  | Date
  | RegExp;

export type CachableValue =
  | CachableJSONValue
  | CachableSerializableJSONValue
  | CachableArray
  | CachableObject;

/**
 * Options
 */

export type ConnectionOptions = Omit<PoolOptions, 'prefix'>;

export interface ConnectionOption {
  connection?: {
    host?: string;
    port?: number;
    options?: ConnectionOptions;
  };
}

export interface Lifetimes {
  ttl: number;
  ttr?: number;
}

export interface LifetimesOption {
  lifetimes: Lifetimes;
}

export interface OptionalLifetimesOption {
  lifetimes?: Lifetimes;
}

export interface OptionalVersionOption {
  version?: string;
}

export interface OptionalPrefixOption {
  prefix?: string;
}

export interface OptionalLogOption {
  log?: boolean;
}

/**
 * KeyProcessor options
 */

export interface KeyProcessorInput extends Lifetimes, OptionalVersionOption, OptionalPrefixOption {
  key: string;
}

export type KeyProcessor = (i: KeyProcessorInput) => string;

export type OptionalKeyProcessorOption = {
  keyProcessor?: { disable?: boolean; fn?: KeyProcessor };
};

/**
 * GetProcessor options
 */

export type DisableGetProcessor = {
  getProcessor?: { disable?: boolean };
};

export type GetProcessor<
  Cached extends CachableValue = CachableValue,
  ValueGetProcessorInput extends CachableValue = Cached,
> = (i: ValueGetProcessorInput) => Cached;

export type OptionalGetProcessorOption<
  Cached extends CachableValue = CachableValue,
  ValueGetProcessorInput extends CachableValue = Cached,
> = {
  getProcessor?: {
    disable?: boolean;
    fn?: GetProcessor<Cached, ValueGetProcessorInput>;
  };
};

/**
 * SetProcessor options
 */

export type DisableSetProcessor = {
  setProcessor?: { disable?: boolean };
};

export interface SetProcessorInput<ToBeCached extends CachableValue = CachableValue>
  extends Lifetimes,
    OptionalVersionOption,
    OptionalPrefixOption {
  value: ToBeCached;
}

export type SetProcessor<
  ToBeCached extends CachableValue = CachableValue,
  ValueSetProcessorOutput extends CachableValue = ToBeCached,
> = (i: SetProcessorInput<ToBeCached>) => ValueSetProcessorOutput;

export type OptionalSetProcessorOption<
  ToBeCached extends CachableValue = CachableValue,
  ValueSetProcessorOutput extends CachableValue = ToBeCached,
> = {
  setProcessor?: {
    disable?: boolean;
    fn?: SetProcessor<ToBeCached, ValueSetProcessorOutput>;
  };
};

/**
 * Module options
 */

export interface MemcachedModuleOptions<
  ValueProcessorInputAndOutput extends CachableValue = CachableValue,
> extends ConnectionOption,
    LifetimesOption,
    OptionalVersionOption,
    OptionalPrefixOption,
    OptionalLogOption,
    OptionalKeyProcessorOption,
    OptionalGetProcessorOption<CachableValue, ValueProcessorInputAndOutput>,
    OptionalSetProcessorOption<CachableValue, ValueProcessorInputAndOutput> {}

export interface MemcachedConfig<
  ValueProcessorInputAndOutput extends CachableValue = CachableValue,
> {
  memcached: MemcachedModuleOptions<ValueProcessorInputAndOutput>;
}

export interface MemcachedModuleOptionsFactory<
  ValueProcessorInputAndOutput extends CachableValue = CachableValue,
> {
  createMemcachedModuleOptions():
    | Promise<MemcachedModuleOptions<ValueProcessorInputAndOutput>>
    | MemcachedModuleOptions<ValueProcessorInputAndOutput>;
}

export interface MemcachedModuleAsyncOptions<
  ValueProcessorInputAndOutput extends CachableValue = CachableValue,
> extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[];
  useClass?: Type<MemcachedModuleOptionsFactory<ValueProcessorInputAndOutput>>;
  useExisting?: Type<MemcachedModuleOptionsFactory<ValueProcessorInputAndOutput>>;
  useFactory?: (
    ...args: any[]
  ) =>
    | Promise<MemcachedModuleOptions<ValueProcessorInputAndOutput>>
    | MemcachedModuleOptions<ValueProcessorInputAndOutput>;
  extraProviders?: Provider[];
}
