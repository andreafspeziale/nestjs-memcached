<div align="center">
  <p>
    <!-- <a href="https://memcached.org/" target="blank">
      <img src="./assets/memcached-logo.png" width="160" alt="Memcached Logo" />
    </a> -->
    <img src="./assets/memcached-logo.png" width="160" alt="Memcached Logo" />
    <b></b>
    <!-- <a href="https://nestjs.com/" target="blank">
      <img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" />
    </a> -->
    <img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" />
  </p>
  <p>
    <a href="https://memcached.org/" target="blank">Memcached</a> module and service for <a href="https://github.com/nestjs/nest" target="blank">Nest</a>,<br>
    a progressive Node.js framework for building efficient and scalable server-side applications.
  </p>
  <p>
    <a href="https://www.npmjs.com/@andreafspeziale/nestjs-memcached" target="_blank"><img src="https://img.shields.io/npm/v/@andreafspeziale/nestjs-memcached.svg" alt="NPM Version" /></a>
    <a href="https://www.npmjs.com/@andreafspeziale/nestjs-memcached" target="_blank"><img src="https://img.shields.io/npm/l/@andreafspeziale/nestjs-memcached.svg" alt="Package License" /></a>
    <a href="https://github.com/andreafspeziale/nestjs-memcached/actions" target="_blank"><img src="https://img.shields.io/github/actions/workflow/status/andreafspeziale/nestjs-memcached/test.yml" alt="Test Status"/></a>
  <p>
</div>

## From v3 to v4

TLDR:

- New module options
- New underlying memcached client, <a href="https://bun.sh" target="blank">Bun</a> compatible
- `superjson` is no more a module option, it's used as the default serializer
- `.setWithMeta` API has been removed, now there is only `.set`
- `wrapperProcessor` option has been splitted in a more generic purpose functions `getProcessor` and `setProcessor`

## Installation

### npm

```sh
npm install @andreafspeziale/nestjs-memcached
```

### yarn

```sh
yarn add @andreafspeziale/nestjs-memcached
```

### pnpm

```sh
pnpm add @andreafspeziale/nestjs-memcached
```

## How to use?

### Module

The module is <a href="https://docs.nestjs.com/modules#global-modules" target="blank">Global</a> by default.

#### MemcachedModule.forRoot(options)

`src/core/core.module.ts`

```ts
import { Module } from '@nestjs/common';
import { MemcachedModule, CachableValue } from '@andreafspeziale/nestjs-memcached';

@Module({
  imports: [
    MemcachedModule.forRoot<{
      content: CachableValue;
      version?: string;
    }>({
      connection: { host: '0.0.0.0', port: 11211 },
      lifetimes: { ttl: 60, ttr: 30 },
      version: '1',
      prefix: 'api',
      keyProcessor: {
        fn: ({ prefix, version, key }) =>
          `${prefix ? prefix + '::' : ''}${version ? version + '::' : ''}${key}`,
        disable: true,
      },
      getProcessor: {
        fn: ({ content }) => content,
        disable: true,
      },
      setProcessor: {
        fn: ({ value, version }) => ({
          content: value,
          ...(version ? { version } : {}),
        }),
        disable: true,
      },
    }),
  ],
  ....
})
export class CoreModule {}
```

- `connection` can be omitted in case of `localhost` connection
- `lifetimes.ttl` is the global time to live
- `lifetimes.ttr` is the global optional time to refresh
- `version` is an optional string which will be injected in `keyProcessor`, `getProcessor` and `setProcessor` in order to eventually enrich data
- `prefix` is an optional string which will be injected in `keyProcessor`, `getProcessor` and `setProcessor` in order to eventually enrich data
- `keyProcessor` is the global optional key processor function which process your cache keys
- `getProcessor` is the global optional get processor function which can unwrap the cached value
- `setProcessor` is the global optional set processor function which can add metadata wrapping the value to be cached

Test files are full of configuration shapes.

#### MemcachedModule.forRootAsync(options)

`src/core/core.module.ts`

```ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MemcachedModule } from '@andreafspeziale/nestjs-memcached';
import { Config } from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      ....
    }),
    MemcachedModule.forRootAsync({
      useFactory: (cs: ConfigService<Config, true>) => cs.get<ConfigService['memcached']>('memcached'),
      inject: [ConfigService],
    }),
  ],
  ....
})
export class CoreModule {}
```

### Decorators

> use the client and create your own service

#### InjectMemcachedOptions() and InjectMemcached()

`src/samples/samples.service.ts`

```ts
import { Injectable } from '@nestjs/common';
import {
  InjectMemcachedOptions,
  InjectMemcached,
  MemcachedClient,
  MemcachedModuleOptions,
  MemcachedClient
} from '@andreafspeziale/nestjs-memcached';

@Injectable()
export class SamplesService {
  constructor(
    @InjectMemcachedOptions()
    private readonly memcachedModuleOptions: MemcachedModuleOptions, // Showcase purposes
    @InjectMemcached() private readonly memcachedClient: MemcachedClient
  ) {}

  ....
}
```

### Service

> out of the box service with a set of features

#### MemcachedService

`src/samples/samples.facade.ts`

```ts
import { MemcachedService } from '@andreafspeziale/nestjs-memcached';
import { SampleReturnType } from './samples.interfaces'

@Injectable()
export class SamplesFacade {
  constructor(
    private readonly memcachedService: MemcachedService,
  ) {}

  async sampleMethod(): Promise<SampleReturnType> {
    const cachedItem = await this.memcachedService.get<string>('my-key');

    if(cachedItem === null) {
      ....
      await this.memcachedService.set<string>('my-key', 'my-value');
      ....
    }
  }
}
```

### APIs

`getProcessor` (in `.get` API) and `setProcessor` (in `.set` API) are optional functions which can be defined globally when the Memcached NestJS module is initialized, along with all the other options.

Both processors and options can be overwritten or even disabled inline.

Since bad thigs may happen, even using TS, inline `getProcessor` and `setProcessor` capabilities can change based on the provided generic types.

Let's suppose you setted up globally both, `getProcessor` and `setProcessor`, disabling inline `setProcessor` may result in unexpected behaviours when the `.get` API will run the global `getProcessor` under the hood.

Types will force you thinking a lil'bit more about what you are doing.

BTW for fast prototyping/debugging we both know about the `any` type ;-).

### Get API

> Both global or inline `getProcessor` are not executed if the underlying `.get` API is returning `false` (which I translate in `null` to let the consumer cache `boolean`) for a given caching key

#### A. Implicit

We don't know what `my-key` will return, so `a` will be a `CachableValue | null`

```ts
const a = await this.memcachedService.get('my-key');
```

TS will infer

`MemcachedService.get<never, never>(key: string, options?:...`

In the above scenario, `getProcessor` cannot be used.

#### B. First generic TS arg made explicit

First generic TS arg made explicit. `b` will be typed as `string | null`

```ts
const b = await this.memcachedService.get<string>('my-key');
```

TS will infer

`MemcachedService.get<string, never>(key: string, value: "my-value", options?:...`

In the above scenario, `getProcessor` can only be and eventually disabled

```ts
const b = await this.memcachedService.get('my-key', { getProcessor: { disable: true } });
```

#### C. First and second generic TS arg made explicit

`c` will be typed as `string | null`.

`{ content: string }` is what has been actually cached and is intended to be processed inline

```ts
const c = await this.memcachedService.get<string, { content: string }>('my-key', {
  getProcessor: { fn: (i) => i.content },
});
```

#### D. Full options

`d` will be typed as `string | null` and `.get` second arg is an optional "options" object

- `lifetimes` is an optional object in which
  - `ttl` is a required `number`
  - `ttr` is an optional `number`
- `version` is an optional `string`
- `prefix` is an optional `string`
- `keyProcessor` is an optional function which can manipulate the caching key
- `getProcessor` is an optional function which can manipulate the cached value

```ts
const d = await this.memcachedService.get<string, { content: string }>('my-key', {
  lifetimes: { ttl: 20, ttr: 10 },
  version: '1',
  prefix: 'api',
  keyProcessor: {
    fn: ({ key, version }) => `${version ? version + '::' : ''}${key}`, // "version", "ttl", "ttr" and "prefix" are injected into the function along with the actual "key"
    disable: true, // global and inline "keyProcessor" execution are ignored
  },
  getProcessor: {
    fn: ({ content }) => content, // "fn" input is "{ content: string }" and the output is "string" as defined in the generic args
    disable: true, // global and inline "getProcessor" execution are ignored - in this scenario you probably need to specify just the first generic arg.
  },
});
```

### Set API

> `.set` will return a `Promise<void>` or will throw a `MemcachedException` if something were to break. Type annotations will help you enforce what is going to be cached

> What can be cached is a custom subset of what the `superjson` library can serialize

#### A. Implicit

As far as a `CachableValue` is cached, "you good"

```ts
await this.memcachedService.set('my-key', 'my-value');
```

TS will infer

`MemcachedService.set<"my-value", never>(key: string, value: "my-value", options?:...`

In the above scenario, `setProcessor` can only be and eventually disabled

```ts
await this.memcachedService.set('my-key', 'my-value', { setProcessor: { disable: true } });
```

#### B. First generic TS arg made explicit

```ts
await this.memcachedService.set<string>('my-key', 'my-value');
await this.memcachedService.set<string>('my-key', 1); // TS will be complaining because 1 is not a "string"
```

In the above scenario, `setProcessor` can only be and eventually disabled

```ts
await this.memcachedService.set('my-key', 'my-value', { setProcessor: { disable: true } });
```

#### C. First and second generic TS arg made explicit

```ts
await this.memcachedService.set<string, { content: string; created: Date }>('my-key', 'my-value', {
  setProcessor: { fn: (i) => ({ content: i.value, created: new Date() }) },
});

await this.memcachedService.set<string, { content: string; created: Date }>('my-key', 'my-value', {
  setProcessor: {
    fn: (i) => ({
      content: i.value,
      created: new Date().toISOString(), // TS will be complaining because "created" is a "string" instead of a Date object
    }),
  },
});
```

#### D. Full options

`.set` third arg is an optional "options" object

- `lifetimes` is an optional object in which
  - `ttl` is a required `number`
  - `ttr` is an optional `number`
- `version` is an optional `string`
- `keyProcessor` is an optional function which can manipulate the caching key
- `setProcessor` is an optional function which can manipulate the cached value

```ts
await this.memcachedService.set<string, { content: string }>('my-key', 'my-value' {
  lifetimes: { ttl: 20, ttr: 10 },
  version: '1',
  keyProcessor: {
    fn: ({ key, version, ttl, ttr }) =>
      `${version ? version + '::' : ''}${key}`, // "version", "ttl", "ttr" and "prefix" are injected into the function along with the actual "key"
    disable: true, // global and inline "keyProcessor" execution are ignored
  },
  setProcessor: {
    fn: ({ value, version, ttl, ttr, prefix }) => ({ content: value }), // "version", "ttl", "ttr" and "prefix" are injected into the function along with the actual "value"
    disable: true, // global and inline "setProcessor" execution are ignored
  },
});
```

### Health

I usually expose an `/healthz` controller from my microservices in order to check third parties connection.

#### HealthController

`src/health/health.controller.ts`

```ts
import { Controller, Get } from '@nestjs/common';
import { MEMCACHED_HOST, MEMCACHED_PORT } from '@andreafspeziale/nestjs-memcached';
import {
  HealthCheckService,
  HealthCheckResult,
  HealthIndicatorResult,
  MicroserviceHealthIndicator,
} from '@nestjs/terminus';
import { Transport } from '@nestjs/microservices';
import { Config } from '../config';
import { ConfigService } from '@nestjs/config';

@Controller('healthz')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly microservice: MicroserviceHealthIndicator,
    private readonly cs: ConfigService<Config, true>,
  ) {}

  @Get()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      (): Promise<HealthIndicatorResult> =>
        this.microservice.pingCheck('memcached', {
          transport: Transport.TCP,
          options: {
            host: this.cs.get<Config['memcached']>('memcached').connection?.host || MEMCACHED_HOST,
            port: this.cs.get<Config['memcached']>('memcached').connection?.port || MEMCACHED_PORT,
          },
        }),
    ]);
  }
}
```

### Environment variables management

Please refer to <a href="https://github.com/andreafspeziale/nestjs-search" target="blank">`@andreafspeziale/nestjs-search`</a> for more info about the environment variables features exported from my packages.

`nestjs-memcached` exports some features as well.

#### Zod

```ts
import { memcachedSchema } from '@andreafspeziale/nestjs-memcached/dist/zod';

....
```

#### Joi

```ts
import { MEMCACHED_SCHEMA } from '@andreafspeziale/nestjs-memcached/dist/joi';

....
```

### Extra Providers

This is one of the most recent additions.

I was looking for a nice way to introduce logging after I created and published the `nestjs-log` [npm package](https://www.npmjs.com/package/@andreafspeziale/nestjs-log).

My thoughts were:

- `nestjs-log`
  - can be declared as _peerDependency_ and be installed as _devDependency_ of consumer packages which may need logging
  - can be installed as _dependency_ of applications which will need logging for sure
- `nestjs-memcached`
  - can be a `nestjs-log` consumer
  - can be installed as _dependency_ of applications (or even packages, why not?) which will need caching
- `application` which can install both the above packages and orchestrate everything like configs and Providers DI

A visual representation can be

<div align="center">
  <p>
    <img src="./assets/extra-providers.png" width="800" alt="Extra Providers Example" />
  </p>
</div>

In terms of code, in `nestjs-memcached` itself:

```ts
import { Injectable, Optional } from '@nestjs/common';
import { LoggerService } from '@andreafspeziale/nestjs-log';
import {
  InjectMemcachedOptions,
  InjectMemcached,
  InjectMemcachedOptionalLogger,
} from './memcached.decorators';
....

@Injectable()
export class MemcachedService {
  ....
  constructor(
    @InjectMemcachedOptions()
    private readonly memcachedModuleOptions: MemcachedModuleOptions,
    @InjectMemcached() private readonly memcachedClient: MemcachedClient,
    @Optional()
    @InjectMemcachedOptionalLogger()
    private readonly logger?: LoggerService,
  ) {
    this.memcachedModuleOptions.log && this.logger?.setContext(MemcachedService.name);

    ....
  }
}
```

In your application:

`src/core/core.module.ts`

```ts
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule, LoggerService } from '@andreafspeziale/nestjs-log';
import { getMemcachedLoggerToken, MemcachedModule } from '@andreafspeziale/nestjs-memcached';
import config, { envSchema, Config } from '../config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
      validationSchema: envSchema,
    }),
    LoggerModule.forRootAsync({
      useFactory: (cs: ConfigService<Config, true>) => cs.get<Config['logger']>('logger'),
      inject: [ConfigService],
    }),
    MemcachedModule.forRootAsync({
      useFactory: (cs: ConfigService<Config, true>) => cs.get<Config['memcached']>('memcached'),
      inject: [ConfigService],
      extraProviders: [{ provide: getMemcachedLoggerToken(), useExisting: LoggerService }],
    }),
    ....
  ],
})
export class CoreModule {}
```

The above `extraProviders` option is optional and the actual logging is driven by:

- the application logger level configured within the `LoggerModule`
- the `MemcachedModule` `log` configuration key

## Test

- `docker compose up -d`
- `pnpm test`

## Stay in touch

- Author - [Andrea Francesco Speziale](https://twitter.com/andreafspeziale)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

nestjs-memcached [MIT licensed](LICENSE).
