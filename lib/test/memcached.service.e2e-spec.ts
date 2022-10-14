import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { MemcachedService, MemcachedModule, CachingOptions, WrappedValue } from '../';

describe('MemcachedService (e2e)', () => {
  [
    {
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
      options: {
        ttl: 60,
        ttr: 30,
        keyProcessor: (key: string): string => `v_${key}`,
      },
    },
  ].forEach(({ options }) =>
    describe(`Module with options: ${JSON.stringify(options)}`, () => {
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

      describe('setWithMeta & get', () => {
        it('Should return the value of the cached key/value pair along with default', async () => {
          const result = await memcachedService.setWithMeta('key', 'value');

          expect(result).toBe(true);

          const cached = await memcachedService.get<WrappedValue<string> & CachingOptions>('key');

          expect(cached?.ttl).toBe(options.ttl);
          options.ttr ? expect(cached?.ttr).toBe(options.ttr) : expect(cached?.ttr).toBeUndefined();
          expect(cached?.content).toBe('value');
        });

        it('Should return the value of the cached key/value pair along with specified', async () => {
          const result = await memcachedService.setWithMeta<string>('key', 'value', { ttl: 100 });

          expect(result).toBe(true);

          const cached = await memcachedService.get<WrappedValue<string> & CachingOptions>('key');

          expect(cached?.ttl).toBe(100);
          options.ttr ? expect(cached?.ttr).toBe(options.ttr) : expect(cached?.ttr).toBeUndefined();
          expect(cached?.content).toBe('value');
        });

        it('Should return the value of the cached key/value pair along with specified ttl and ttr', async () => {
          const result = await memcachedService.setWithMeta('key', 'value', {
            ttl: 100,
            ttr: 50,
          });

          expect(result).toBe(true);

          const cached = await memcachedService.get<WrappedValue<string> & CachingOptions>('key');

          expect(cached?.ttl).toBe(100);
          expect(cached?.ttr).toBe(50);
          expect(cached?.content).toBe('value');
        });

        it('Should return the value of the cached key/value with override valueProcessor', async () => {
          const result = await memcachedService.setWithMeta<
            string,
            WrappedValue<string> & { test: string } & CachingOptions
          >('key', 'value', {
            ttl: 100,
            ttr: 50,
            valueProcessor: ({ value, ttl, ttr }) => ({
              content: value,
              ttl,
              ...(ttr ? { ttr } : {}),
              test: 'test',
            }),
          });

          expect(result).toBe(true);

          const cached = await memcachedService.get<
            WrappedValue<string> & { test: string } & CachingOptions
          >('key');

          expect(cached?.ttl).toBe(100);
          expect(cached?.ttr).toBe(50);
          expect(cached?.content).toBe('value');

          expect(cached?.test).toBeDefined();
          expect(cached?.test).toBe('test');
        });

        it('Should return the value of the cached key/value pair as complex object', async () => {
          const data = {
            property: 'myProperty',
            list: [],
            date: new Date(),
          };

          const result = await memcachedService.setWithMeta('key', data);

          expect(result).toBe(true);

          const cashed = await memcachedService.get<
            WrappedValue<typeof data> & { createdAt?: Date } & CachingOptions
          >('key');

          const {
            content: { property, list, date },
            ...rest
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          } = cashed!;

          expect(rest.ttl).toBe(options.ttl);
          options.ttr ? expect(rest.ttr).toBe(options.ttr) : expect(rest.ttr).toBeUndefined();

          expect(property).toBe(data.property);
          expect(list).toEqual(data.list);
          expect(typeof date).toBe('string');
        });
      });

      describe('set & get', () => {
        it('Should return true when the value of the cached key/value pair is successfully cached', async () => {
          const cached = await memcachedService.set('key', 'value');

          expect(cached).toBe(true);
        });
      });

      afterEach(async () => {
        await memcachedService.flush();
      });

      afterAll(async () => {
        memcachedService.end();
        await app.close();
      });
    })
  );
});
