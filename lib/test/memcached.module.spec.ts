/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Pool } from '@joshbetz/memcached';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  MemcachedService,
  MemcachedModule,
  getMemcachedModuleOptionsToken,
  getMemcachedClientToken,
  MemcachedConfig,
  CachableValue,
} from '../';
import { TestService } from './test.service';

// This is more a nice way to enumerate the module options than an effective test suite
describe('Module, options, client and service load (spec)', () => {
  (
    [
      {
        description: 'Minimal',
        memcached: {
          lifetimes: { ttl: 60 },
        },
      },
      {
        description: 'With host',
        memcached: {
          connection: { host: '0.0.0.0' },
          lifetimes: { ttl: 60 },
        },
      },
      {
        description: 'With host, port and ttr',
        memcached: {
          connection: { host: '0.0.0.0', port: 11211 },
          lifetimes: { ttl: 60, ttr: 30 },
        },
      },
      {
        description: 'With host, port, ttr and version',
        memcached: {
          connection: { host: '0.0.0.0', port: 11211 },
          lifetimes: { ttl: 60, ttr: 30 },
          version: '1',
        },
      },
      {
        description: 'With host, port, ttr, version and keyProcessor',
        memcached: {
          connection: { host: '0.0.0.0', port: 11211 },
          lifetimes: { ttl: 60, ttr: 30 },
          version: '1',
          keyProcessor: {
            fn: ({ key, version }) => `${version ? version + '::' : ''}${key}`,
          },
        },
      },
      {
        description: 'With host, port, ttr, version and keyProcessor (+ disable)',
        memcached: {
          connection: { host: '0.0.0.0', port: 11211 },
          lifetimes: { ttl: 60, ttr: 30 },
          version: '1',
          keyProcessor: {
            fn: ({ key, version }) => `${version ? version + '::' : ''}${key}`,
            disable: true,
          },
        },
      },
      {
        description: 'With host, port, ttr, version and keyProcessor (+ disable)',
        memcached: {
          connection: { host: '0.0.0.0', port: 11211 },
          lifetimes: { ttl: 60, ttr: 30 },
          version: '1',
          keyProcessor: {
            fn: ({ key, version }) => `${version ? version + '::' : ''}${key}`,
            disable: true,
          },
        },
      },
      {
        description: 'With host, port, ttr, version, keyProcessor (+ disable) and getProcessor',
        memcached: {
          connection: { host: '0.0.0.0', port: 11211 },
          lifetimes: { ttl: 60, ttr: 30 },
          version: '1',
          keyProcessor: {
            fn: ({ key, version }) => `${version ? version + '::' : ''}${key}`,
            disable: true,
          },
          getProcessor: {
            fn: (i) => i.content,
          },
        },
      },
      {
        description:
          'With host, port, ttr, version, keyProcessor (+ disable) and getProcessor (+ disable)',
        memcached: {
          connection: { host: '0.0.0.0', port: 11211 },
          lifetimes: { ttl: 60, ttr: 30 },
          version: '1',
          keyProcessor: {
            fn: ({ key, version }) => `${version ? version + '::' : ''}${key}`,
            disable: true,
          },
          getProcessor: {
            fn: (i) => i.content,
            disable: true,
          },
        },
      },
      {
        description:
          'With host, port, ttr, version, keyProcessor (+ disable) getProcessor (+ disable) and setProcessor',
        memcached: {
          connection: { host: '0.0.0.0', port: 11211 },
          lifetimes: { ttl: 60, ttr: 30 },
          version: '1',
          keyProcessor: {
            fn: ({ key, version }) => `${version ? version + '::' : ''}${key}`,
            disable: true,
          },
          getProcessor: {
            fn: (i) => i.content,
            disable: true,
          },
          setProcessor: {
            fn: ({ value, version }) => ({
              content: value,
              ...(version ? { version } : {}),
            }),
          },
        },
      },
      {
        description:
          'With host, port, ttr, version, keyProcessor (+ disable) getProcessor (+ disable) and setProcessor (+ disable)',
        memcached: {
          connection: { host: '0.0.0.0', port: 11211 },
          lifetimes: { ttl: 60, ttr: 30 },
          version: '1',
          keyProcessor: {
            fn: ({ key, version }) => `${version ? version + '::' : ''}${key}`,
            disable: true,
          },
          getProcessor: {
            fn: (i) => i.content,
            disable: true,
          },
          setProcessor: {
            fn: ({ value, version }) => ({
              content: value,
              ...(version ? { version } : {}),
            }),
            disable: true,
          },
        },
      },
      {
        description:
          'With host, port, ttr, version, keyProcessor (+ disable) getProcessor (+ disable), setProcessor (+ disable) and log',
        memcached: {
          connection: { host: '0.0.0.0', port: 11211 },
          lifetimes: { ttl: 60, ttr: 30 },
          version: '1',
          keyProcessor: {
            fn: ({ key, version }) => `${version ? version + '::' : ''}${key}`,
            disable: true,
          },
          getProcessor: {
            fn: (i) => i.content,
            disable: true,
          },
          setProcessor: {
            fn: ({ value, version }) => ({
              content: value,
              ...(version ? { version } : {}),
            }),
            disable: true,
          },
          log: true,
        },
      },
    ] as ({ description: string } & MemcachedConfig<{
      content: CachableValue;
      version?: string;
    }>)[]
  ).forEach(({ description, memcached }) =>
    describe(`${description}`, () => {
      let module: TestingModule;

      const returnConfig = (): MemcachedConfig<{ content: CachableValue; version?: string }> => ({
        memcached,
      });

      it('Should create the expected "MemcachedModule" and "MemcachedService" instance using "forRoot"', async () => {
        module = await Test.createTestingModule({
          imports: [MemcachedModule.forRoot(memcached)],
        }).compile();

        const memcachedModule = module.get(MemcachedModule);
        const memcachedService = module.get(MemcachedService);
        const memcachedModuleOptions = module.get(getMemcachedModuleOptionsToken());
        const memcachedClient = module.get(getMemcachedClientToken());

        expect(memcachedModule).toBeInstanceOf(MemcachedModule);
        expect(memcachedService).toBeInstanceOf(MemcachedService);
        expect(memcachedModuleOptions).toStrictEqual(memcached);
        expect(memcachedClient).toBeInstanceOf(Pool);
      });

      it('Should create the expected "MemcachedModule" and "MemcachedService" instance using "forRootAsync"', async () => {
        module = await Test.createTestingModule({
          imports: [
            ConfigModule.forRoot({
              isGlobal: true,
              load: [returnConfig],
            }),
            MemcachedModule.forRootAsync({
              useFactory: (
                configService: ConfigService<
                  MemcachedConfig<{ content: CachableValue; version?: string }>,
                  true
                >,
              ) => configService.get('memcached'),
              inject: [ConfigService],
            }),
          ],
        }).compile();

        const memcachedModule = module.get(MemcachedModule);
        const memcachedService = module.get(MemcachedService);
        const memcachedModuleOptions = module.get(getMemcachedModuleOptionsToken());
        const memcachedClient = module.get(getMemcachedClientToken());

        expect(memcachedModule).toBeInstanceOf(MemcachedModule);
        expect(memcachedService).toBeInstanceOf(MemcachedService);
        expect(memcachedModuleOptions).toStrictEqual(memcached);
        expect(memcachedClient).toBeInstanceOf(Pool);
      });

      it('Should be possible to access "MemcachedModuleOptions" and "Pool" (AKA "MemcachedClient") in another provider using "register"', async () => {
        module = await Test.createTestingModule({
          imports: [MemcachedModule.register(memcached)],
          providers: [TestService],
        }).compile();

        const sampleService = module.get(TestService);

        expect(sampleService).toBeInstanceOf(TestService);
        expect(sampleService.getConfig()).toStrictEqual(memcached);
        expect(sampleService.getClient()).toBeInstanceOf(Pool);

        const memcachedService = sampleService.getService();

        expect(memcachedService).toBeInstanceOf(MemcachedService);
      });

      it('Should be possible to access "MemcachedModuleOptions" and "Pool" (AKA "MemcachedClient") in another provider using "registerAsync"', async () => {
        module = await Test.createTestingModule({
          imports: [
            ConfigModule.forRoot({
              isGlobal: true,
              load: [returnConfig],
            }),
            MemcachedModule.registerAsync({
              useFactory: (
                configService: ConfigService<
                  MemcachedConfig<{ content: CachableValue; version?: string }>,
                  true
                >,
              ) => configService.get('memcached'),
              inject: [ConfigService],
            }),
          ],
          providers: [TestService],
        }).compile();

        const sampleService = module.get(TestService);

        expect(sampleService).toBeInstanceOf(TestService);
        expect(sampleService.getClient()).toBeInstanceOf(Pool);
        expect(sampleService.getClient()).toBeInstanceOf(Pool);

        const memcachedService = sampleService.getService();

        expect(memcachedService).toBeInstanceOf(MemcachedService);
      });

      afterEach(async () => {
        await module.close();
      });
    }),
  );
});
