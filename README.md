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
  
  <a href="">[![Test](https://github.com/andreafspeziale/nestjs-memcached/actions/workflows/test.yml/badge.svg)](https://github.com/andreafspeziale/nestjs-memcached/actions/workflows/test.yml)</a>
  <a href="">[![Release](https://github.com/andreafspeziale/nestjs-memcached/actions/workflows/release.yml/badge.svg)](https://github.com/andreafspeziale/nestjs-memcached/actions/workflows/release.yml)</a>
</div>

## Installation

### npm

```sh
npm install @andreafspeziale/nestjs-memcached memjs superjson
```

### yarn

```sh
yarn add @andreafspeziale/nestjs-memcached memjs superjson
```

### pnpm

```sh
pnpm install @andreafspeziale/nestjs-memcached memjs superjson
```

## How to use?

### Module

#### MemcachedModule.forRoot(options, connection?)

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
          auth: {
            user: 'user',
            password: 'secret',
          },
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

For signle connection without authentication you can omit the `connections` property.

#### MemcachedModule.forRootAsync(options, connection?)

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

#### InjectMemcached(connection?) | InjectMemcachedOptions(connection?)

```ts
import { Injectable } from '@nestjs/common';
import { InjectMemcached, InjectMemcachedOptions } from '@andreafspeziale/nestjs-memcached';

@Injectable()
export class SampleService {
  constructor(
    @InjectMemcachedOptions() private readonly memcachedModuleOptions: MemcachedModuleOptions,
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

  async sampleMethod(): Promise<SampleReturnType> {
    const cachedItem = await this.memcachedService.get<CachedItemType>(cachedItemKey);

    if(cachedItem === null) {
      ...
      const { content, ...meta } = await this.memcachedService.set<string>('key', 'value');
      ...
    }
}
```

You can also set `ttl` and/or `ttr` inline in order to override the global values specified during the `MemcachedModule` import

```ts
    await this.memcachedService.set<string>('key', 'value', { ttl: 100 });
    ...
    await this.memcachedService.set<string>('key', 'value', { ttl: 100, ttr: 50 });
```

The provided `MemcachedService` is an opinionated wrapper around `memjs`.

It enables `refresh-ahead` cache pattern in order to let you add a logical expiration called `ttr (time to refresh)` to the cached data.

So each time you get some cached data it will contain additional properties in order to help you decide whatever business logic needs to be applied.

```ts
export interface CachedValue<T> {
  ttl: number;
  ttr?: number;
  createdAt: Date;
  content: T;
}
```

## License

nestjs-memcached [MIT licensed](LICENSE).
