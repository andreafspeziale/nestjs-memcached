<div align="center">
  <p>
    <a href="https://nestjs.com/" target="blank">
      <img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" />
    </a>
  </p>

  <p>
    <a href="https://memcached.org/" target="blank">Memcached</a> module and service for <a href="https://github.com/nestjs/nest" target="blank">Nest</a>,<br>
    a progressive Node.js framework for building efficient and scalable server-side applications.
  </p>

<a href="https://www.npmjs.com/@andreafspeziale/nestjs-memcached" target="_blank"><img src="https://img.shields.io/npm/v/@andreafspeziale/nestjs-memcached.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/@andreafspeziale/nestjs-memcached" target="_blank"><img src="https://img.shields.io/npm/l/@andreafspeziale/nestjs-memcached.svg" alt="Package License" /></a>
<a href="https://github.com/andreafspeziale/nestjs-memcached/actions" target="_blank"><img src="https://img.shields.io/github/workflow/status/andreafspeziale/nestjs-memcached/Test" alt="Test Status"/></a>

</div>

## Installation

### npm

```sh
npm install @andreafspeziale/nestjs-memcached memjs
```

### yarn

```sh
yarn add @andreafspeziale/nestjs-memcached memjs
```

### pnpm

```sh
pnpm install @andreafspeziale/nestjs-memcached memjs
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
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
```

For signle connection you can omit the `connections` property.
For multiple connections you can omit the `port` property if the server is using the default one.

```ts
// exploded MemcachedModuleOptions
export interface MemcachedModuleOptions {
  // Pair list of server/s and auth
  connections?: {
    host: string;
    port?: number;
  }[];
  // Global key/value pair time to live
  ttl: number;
  // Optional global key/value pair time to refresh in order to enable wrapping and refresh-ahead
  ttr?: number;
  // Optional global function to manipulate your cached value key (default: no manipulation)
  keyProcessor?: KeyProcessor;
}
```

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
      const { content, ...meta } = await this.memcachedService.set<string>('key', 'value');
      ...
    }
}
```

You can also set all the proper `Processors` and `CachingOptions` inline in order to override the global values specified during the `MemcachedModule` import

```ts
    await this.memcachedService.set<string>('key', 'value', { ttl: 100 });
    ...
    await this.memcachedService.set<string>('key', 'value', { ttl: 100, ttr: 50 });
```

The provided `MemcachedService` is an opinionated wrapper around `memjs` trying to be unopinionated as much as possibile at the same time.

`setWithMeta` enables `refresh-ahead` cache pattern in order to let you add a logical expiration called `ttr (time to refresh)` to the cached data and more.

So each time you get some cached data it will contain additional properties in order to help you decide whatever business logic needs to be applied.

## License

nestjs-memcached [MIT licensed](LICENSE).
