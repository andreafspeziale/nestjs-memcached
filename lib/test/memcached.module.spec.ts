import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Client as MemcachedClient } from 'memjs';
import { stringify, parse } from 'superjson';
import {
  MemcachedService,
  MemcachedModule,
  MemcachedModuleOptions,
  getMemcachedModuleOptionsToken,
  getMemcachedClientToken,
} from '../';
import { TestService } from './test.service';

describe('MemcachedService (e2e)', () => {
  (
    [
      {
        description: 'With auth connection and ttl',
        options: {
          connections: [
            {
              host: 'localhost',
              port: 11212,
              auth: {
                user: 'user',
                password: 'password',
              },
            },
          ],
          ttl: 60,
        },
      },
      {
        description: 'With onlyc ttl',
        options: {
          ttl: 60,
        },
      },
      {
        description: 'With ttl and ttr',
        options: {
          ttl: 60,
          ttr: 30,
        },
      },
      {
        description: 'With ttl, ttr and parser',
        options: {
          ttl: 60,
          ttr: 30,
          parser: {
            stringify,
            parse,
          },
        },
      },
      {
        description: 'With ttl, ttr, parser and valueProcessor',
        options: {
          ttl: 60,
          ttr: 30,
          parser: {
            stringify,
            parse,
          },
          // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
          valueProcessor: ({ value, ttl, ttr }) => ({
            ttl,
            ...(ttr ? { ttr } : {}),
            content: value,
            createdAt: new Date(),
          }),
        },
      },
      {
        description: 'With ttl, ttr, parser, valueProcessor and keyProcessor',
        options: {
          ttl: 60,
          ttr: 30,
          parser: {
            stringify,
            parse,
          },
          // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
          valueProcessor: ({ value, ttl, ttr }) => ({
            ttl,
            ...(ttr ? { ttr } : {}),
            content: value,
            createdAt: new Date(),
          }),
          keyProcessor: (key: string): string => `prefix::${key}`,
        },
      },
    ] as { [key: string]: unknown; options: MemcachedModuleOptions }[]
  ).forEach(({ description, options }) =>
    describe(`${description}`, () => {
      let module: TestingModule;
      let app: INestApplication;

      const returnConfig = (): { memcached: MemcachedModuleOptions } => ({ memcached: options });

      it('Should create the expected MemcachedModule and MemcachedService instance using forRoot', async () => {
        module = await Test.createTestingModule({
          imports: [MemcachedModule.forRoot(options)],
        }).compile();

        app = module.createNestApplication();
        await app.init();

        const memcachedModule = app.get(MemcachedModule);
        const memcachedService = app.get(MemcachedService);
        const memcachedModuleOptions = app.get(getMemcachedModuleOptionsToken());
        const memcachedClient = module.get(getMemcachedClientToken());

        expect(memcachedModule).toBeInstanceOf(MemcachedModule);
        expect(memcachedService).toBeInstanceOf(MemcachedService);

        expect(memcachedModuleOptions).toEqual(options);

        expect(memcachedClient).toBeInstanceOf(MemcachedClient);

        await app.close();
      });

      it('Should create the expected MemcachedModule and MemcachedService instance using forRootAsync', async () => {
        module = await Test.createTestingModule({
          imports: [
            ConfigModule.forRoot({
              isGlobal: true,
              load: [returnConfig],
            }),
            MemcachedModule.forRootAsync({
              useFactory: (configService: ConfigService<ReturnType<typeof returnConfig>>) =>
                configService.get('memcached') as MemcachedModuleOptions,
              inject: [ConfigService],
            }),
          ],
        }).compile();

        app = module.createNestApplication();
        await app.init();

        const memcachedModule = module.get(MemcachedModule);
        const memcachedService = module.get(MemcachedService);
        const memcachedModuleOptions = module.get(getMemcachedModuleOptionsToken());
        const memcachedClient = module.get(getMemcachedClientToken());

        expect(memcachedModule).toBeInstanceOf(MemcachedModule);
        expect(memcachedService).toBeInstanceOf(MemcachedService);

        expect(memcachedModuleOptions).toEqual(options);

        expect(memcachedClient).toBeInstanceOf(MemcachedClient);
      });

      it('Should be possible to access MemcachedModuleOptions and MemcachedClient in another provider using forRoot', async () => {
        module = await Test.createTestingModule({
          imports: [MemcachedModule.forRoot(options)],
          providers: [TestService],
        }).compile();

        app = module.createNestApplication();
        await app.init();

        const sampleService = module.get(TestService);

        expect(sampleService).toBeInstanceOf(TestService);

        expect(sampleService.getClient()).toBeInstanceOf(MemcachedClient);
      });

      it('Should be possible to access MemcachedModuleOptions and MemcachedClient in another provider using forRootAsync', async () => {
        module = await Test.createTestingModule({
          imports: [
            ConfigModule.forRoot({
              isGlobal: true,
              load: [returnConfig],
            }),
            MemcachedModule.forRootAsync({
              useFactory: (configService: ConfigService<ReturnType<typeof returnConfig>>) => ({
                ...(configService.get('memcached') as MemcachedModuleOptions),
              }),
              inject: [ConfigService],
            }),
          ],
          providers: [TestService],
        }).compile();

        app = module.createNestApplication();
        await app.init();

        const sampleService = module.get(TestService);

        expect(sampleService).toBeInstanceOf(TestService);

        expect(sampleService.getClient()).toBeInstanceOf(MemcachedClient);
      });

      afterEach(async () => {
        await app.close();
      });
    })
  );
});
