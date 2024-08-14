import MemcachedClient from 'memcached';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  MemcachedService,
  MemcachedModule,
  getMemcachedModuleOptionsToken,
  getMemcachedClientToken,
  MemcachedConfig,
} from '../';
import { TestService } from './test.service';

describe('Module, options, client and service load', () => {
  (
    [
      {
        description: 'With connection and ttl',
        memcached: {
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
        memcached: {
          ttl: 60,
        },
      },
      {
        description: 'With ttl and ttr',
        memcached: {
          ttl: 60,
          ttr: 30,
        },
      },
    ] as ({ description: string } & MemcachedConfig)[]
  ).forEach(({ description, memcached }) =>
    describe(`${description}`, () => {
      let module: TestingModule;
      let app: INestApplication;

      const returnConfig = (): MemcachedConfig => ({ memcached });

      it('Should create the expected MemcachedModule and MemcachedService instance using forRoot', async () => {
        module = await Test.createTestingModule({
          imports: [MemcachedModule.forRoot(memcached)],
        }).compile();

        app = module.createNestApplication();
        await app.init();

        const memcachedModule = app.get(MemcachedModule);
        const memcachedService = app.get(MemcachedService);
        const memcachedModuleOptions = app.get(getMemcachedModuleOptionsToken());
        const memcachedClient = module.get(getMemcachedClientToken());

        expect(memcachedModule).toBeInstanceOf(MemcachedModule);
        expect(memcachedService).toBeInstanceOf(MemcachedService);

        expect(memcachedModuleOptions).toEqual(memcached);

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
              useFactory: (configService: ConfigService<MemcachedConfig, true>) =>
                configService.get('memcached'),
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

        expect(memcachedModuleOptions).toEqual(memcached);

        expect(memcachedClient).toBeInstanceOf(MemcachedClient);
      });

      it('Should be possible to access MemcachedModuleOptions and MemcachedClient in another provider using register', async () => {
        module = await Test.createTestingModule({
          imports: [MemcachedModule.register(memcached)],
          providers: [TestService],
        }).compile();

        app = module.createNestApplication();
        await app.init();

        const sampleService = module.get(TestService);

        expect(sampleService).toBeInstanceOf(TestService);

        expect(sampleService.getClient()).toBeInstanceOf(MemcachedClient);
      });

      it('Should be possible to access MemcachedModuleOptions and MemcachedClient in another provider using registerAsync', async () => {
        module = await Test.createTestingModule({
          imports: [
            ConfigModule.forRoot({
              isGlobal: true,
              load: [returnConfig],
            }),
            MemcachedModule.registerAsync({
              useFactory: (configService: ConfigService<MemcachedConfig, true>) =>
                configService.get('memcached'),
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
    }),
  );
});
