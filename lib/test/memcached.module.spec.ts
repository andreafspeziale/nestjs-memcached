import MemcachedClient from 'memcached';
import type { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
        description: 'With connection and ttl',
        options: {
          connections: [
            {
              host: 'localhost',
              port: 11211,
            },
          ],
          ttl: 60,
        },
      },
      {
        description: 'With only ttl',
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
          imports: [MemcachedModule.register(options)],
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
            MemcachedModule.registerAsync({
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
