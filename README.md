<div align="center">
  <p>
    <a href="https://memcached.org/" target="blank">
      <img src="./assets/memcached-logo.png" width="160" alt="Memcached Logo" />
    </a>
    <b></b>
    <a href="https://nestjs.com/" target="blank">
      <img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" />
    </a>
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
pnpm install @andreafspeziale/nestjs-memcached
```

## How to use?

### Module

The module is <a href="https://docs.nestjs.com/modules#global-modules" target="blank">Global</a> by default.

#### MemcachedModule.forRoot(options)

```ts
import { Module } from '@nestjs/common';
import { MemcachedModule } from '@andreafspeziale/nestjs-memcached';
import { AppController } from './app.controller';

@Module({
  imports: [
    MemcachedModule.forRoot({
      connections: [
        {
          host: 'localhost',
          port: '11211',
        },
      ],
      ttl: 60,
      ttr: 30,
      superjson: true,
      keyProcessor: (key) => `prefix_${key}`,
      wrapperProcessor: ({ value, ttl, ttr }) => ({
        content: value,
        ttl,
        ...(ttr ? { ttr } : {}),
        createdAt: new Date(),
      }),
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
```

- For signle connection you can omit the `connections` property.
- For multiple connections you can omit the `port` property if the server is using the default one.
- `ttl` is the global time to live.
- `ttr` is the global optional time to refresh.
- Typically when caching a JS object like `Date` you will get back a `string` from the cache, [superjson](https://github.com/blitz-js/superjson) will `stringify` on cache `sets` adding metadata in order to later `parse` on cache `gets` and retrieve the initial "raw" data.
- `wrapperProcessor` is the global optional wrapper processor function which wraps the value to be cached and adds metadata.
- `keyProcessor` is the global optional key processor function which process your cache keys.

#### MemcachedModule.forRootAsync(options)

```ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MemcachedModule } from '@andreafspeziale/nestjs-memcached';
import { Config } from './config';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      ...
    }),
    MemcachedModule.forRootAsync({
      useFactory: (configService: ConfigService<Config>) => configService.get('memcached'),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
```

### Decorators

#### InjectMemcachedOptions() and InjectMemcached()

```ts
import { Injectable } from '@nestjs/common';
import { InjectMemcachedOptions, InjectMemcached } from '@andreafspeziale/nestjs-memcached';

@Injectable()
export class SampleService {
  constructor(
    @InjectMemcachedOptions()
    private readonly memcachedModuleOptions: MemcachedModuleOptions,
    @InjectMemcached() private readonly memcachedClient: MemcachedClient
  ) {}

  ...
}
```

### Service

#### MemcachedService

```ts
import { MemcachedService } from '@andreafspeziale/nestjs-memcached';
import { SampleReturnType, CachedItemType } from './interfaces'

@Injectable()
export class SampleFacade {
  constructor(
    private readonly memcachedService: MemcachedService
  ) {}

  async sampleMethod(): Promise<SampleReturn> {
    const cachedItem = await this.memcachedService.get<CachedPlainOrWrappedItem>(cachedItemKey);

    if(cachedItem === null) {
      ...
      await this.memcachedService.set<string>('key', 'value');
      ...
    }
}
```

You can also set all the proper `Processors` and `CachingOptions` inline in order to override the global values specified during the `MemcachedModule` import

```ts
await this.memcachedService.set<string>('key', 'value', { ttl: 100 });
```

The provided `MemcachedService` is an opinionated wrapper around [memcached](https://github.com/3rd-Eden/memcached#readme) trying to be unopinionated as much as possibile at the same time.

`setWithMeta` enables `refresh-ahead` cache pattern in order to let you add a logical expiration called `ttr (time to refresh)` to the cached data and more.

So each time you get some cached data it will contain additional properties in order to help you decide whatever business logic needs to be applied.

## Test

- `docker compose -f docker-compose.test.yml up -d`
- `pnpm test`

## Stay in touch

- Author - [Andrea Francesco Speziale](https://twitter.com/andreafspeziale)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

nestjs-memcached [MIT licensed](LICENSE).
