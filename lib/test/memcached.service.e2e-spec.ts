import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { stringify } from 'superjson';
import { MemcachedService, MemcachedModule } from '../';

describe('MemcachedService (e2e)', () => {
  [
    {
      options: {
        ttl: 60,
      },
    },
    {
      options: {
        ttl: 60,
        ttr: 30,
      },
    },
  ].forEach(({ options }) =>
    describe(`Module with options: ${stringify(options)}`, () => {
      let app: INestApplication;
      let memcachedService: MemcachedService;

      beforeAll(async () => {
        const moduleRef: TestingModule = await Test.createTestingModule({
          imports: [MemcachedModule.forRoot(options)],
        }).compile();

        app = moduleRef.createNestApplication();

        memcachedService = app.get(MemcachedService);

        await app.init();
      });

      describe('set', () => {
        it('Should return the value of the cached key/value pair along with default ttl and createdAt', async () => {
          const cached = await memcachedService.set('key', 'value');

          expect(cached.ttl).toBe(options.ttl);
          options.ttr ? expect(cached.ttr).toBe(options.ttr) : expect(cached.ttr).toBeUndefined();
          expect(cached.content).toBe('value');
          expect(cached.createdAt).toBeDefined();
          expect(cached.createdAt).toBeInstanceOf(Date);
        });

        it('Should return the value of the cached key/value pair along with specified ttl and createdAt', async () => {
          const cached = await memcachedService.set('key', 'value', { ttl: 100 });

          expect(cached.ttl).toBe(100);
          options.ttr ? expect(cached.ttr).toBe(options.ttr) : expect(cached.ttr).toBeUndefined();
          expect(cached.content).toBe('value');
          expect(cached.createdAt).toBeDefined();
          expect(cached.createdAt).toBeInstanceOf(Date);
        });

        it('Should return the value of the cached key/value pair along with specified ttl, ttr and createdAt', async () => {
          const cached = await memcachedService.set('key', 'value', { ttl: 100, ttr: 50 });

          expect(cached.ttl).toBe(100);
          expect(cached.ttr).toBe(50);
          expect(cached.content).toBe('value');
          expect(cached.createdAt).toBeDefined();
          expect(cached.createdAt).toBeInstanceOf(Date);
        });

        it('Should return the value of the cached key/value pair as complex object', async () => {
          const data = {
            property: 'myProperty',
            list: [],
            date: new Date(),
          };

          const cached = await memcachedService.set('key', data);

          expect(cached.ttl).toBe(options.ttl);
          options.ttr ? expect(cached.ttr).toBe(options.ttr) : expect(cached.ttr).toBeUndefined();
          expect(cached.content).toEqual(data);
          expect(cached.content.date).toBeInstanceOf(Date);
          expect(cached.createdAt).toBeDefined();
          expect(cached.createdAt).toBeInstanceOf(Date);
        });
      });

      describe('get', () => {
        it('Should return the value of the cached key/value pair since "set" tests should be passing', async () => {
          const data = {
            property: 'myProperty',
            list: [],
            date: new Date(),
          };

          await memcachedService.set('key', data);
          const cached = await memcachedService.get<typeof data>('key');

          expect(cached?.ttl).toBe(options.ttl);
          options.ttr ? expect(cached?.ttr).toBe(options.ttr) : expect(cached?.ttr).toBeUndefined();
          expect(cached?.content).toEqual(data);
          expect(cached?.content.date).toBeInstanceOf(Date);
          expect(cached?.createdAt).toBeDefined();
          expect(cached?.createdAt).toBeInstanceOf(Date);
        });

        it('Should return null since nothing has been cached and "set" tests should be passing', async () => {
          const cached = await memcachedService.get('key');

          expect(cached).toBe(null);
        });
      });

      afterEach(async () => {
        await memcachedService.flush();
      });

      afterAll(async () => {
        memcachedService.quit();
        await app.close();
      });
    })
  );
});
