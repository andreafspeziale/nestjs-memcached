import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { stringify, parse } from 'superjson';
import { MemcachedService, MemcachedModule, MemcachedModuleOptions, CachingOptions } from '../';

describe('MemcachedService (e2e)', () => {
  (
    [
      {
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
        options: {
          ttl: 60,
          ttr: 30,
          // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
          valueProcessor: ({ value, ttl, ttr }) => ({
            content: value,
            ttl,
            ...(ttr ? { ttr } : {}),
            createdAt: new Date(),
          }),
        },
      },
    ] as { options: MemcachedModuleOptions }[]
  ).forEach(({ options }) =>
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

      describe('setWithMeta', () => {
        it('Should return the value of the cached key/value pair along with default', async () => {
          const cached = await memcachedService.setWithMeta<
            string,
            { createdAt?: string } & CachingOptions
          >('key', 'value');

          expect(cached.ttl).toBe(options.ttl);
          options.ttr ? expect(cached.ttr).toBe(options.ttr) : expect(cached.ttr).toBeUndefined();
          expect(cached.content).toBe('value');

          if (options.valueProcessor) {
            expect(cached.createdAt).toBeDefined();
            options.parser
              ? expect(cached.createdAt).toBeInstanceOf(Date)
              : expect(typeof cached.createdAt).toBe('string');
          } else {
            expect(cached?.createdAt).toBeUndefined();
          }
        });

        it('Should return the value of the cached key/value pair along with specified', async () => {
          const cached = await memcachedService.setWithMeta<
            string,
            { createdAt?: string } & CachingOptions
          >('key', 'value', { ttl: 100 });

          expect(cached.ttl).toBe(100);
          options.ttr ? expect(cached.ttr).toBe(options.ttr) : expect(cached.ttr).toBeUndefined();
          expect(cached.content).toBe('value');

          if (options.valueProcessor) {
            expect(cached.createdAt).toBeDefined();
            options.parser
              ? expect(cached.createdAt).toBeInstanceOf(Date)
              : expect(typeof cached.createdAt).toBe('string');
          } else {
            expect(cached?.createdAt).toBeUndefined();
          }
        });

        it('Should return the value of the cached key/value pair along with specified ttl and ttr', async () => {
          const cached = await memcachedService.setWithMeta<
            string,
            { createdAt?: string } & CachingOptions
          >('key', 'value', { ttl: 100, ttr: 50 });

          expect(cached.ttl).toBe(100);
          expect(cached.ttr).toBe(50);
          expect(cached.content).toBe('value');

          if (options.valueProcessor) {
            expect(cached.createdAt).toBeDefined();
            options.parser
              ? expect(cached.createdAt).toBeInstanceOf(Date)
              : expect(typeof cached.createdAt).toBe('string');
          } else {
            expect(cached?.createdAt).toBeUndefined();
          }
        });

        it('Should return the value of the cached key/value with override valueProcessor', async () => {
          const cached = await memcachedService.setWithMeta<
            string,
            { test: string } & CachingOptions
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

          expect(cached.ttl).toBe(100);
          expect(cached.ttr).toBe(50);
          expect(cached.content).toBe('value');

          expect(cached.test).toBeDefined();
          expect(cached.test).toBe('test');
        });

        it('Should return the value of the cached key/value pair as complex object', async () => {
          const data = {
            property: 'myProperty',
            list: [],
            date: new Date(),
          };

          const {
            content: { property, list, date },
            ...rest
          } = await memcachedService.setWithMeta<
            typeof data,
            { createdAt: Date | string } & CachingOptions
          >('key', data);

          expect(rest.ttl).toBe(options.ttl);
          options.ttr ? expect(rest.ttr).toBe(options.ttr) : expect(rest.ttr).toBeUndefined();

          expect(property).toBe(data.property);
          expect(list).toEqual(data.list);

          options.parser ? expect(date).toBeInstanceOf(Date) : expect(typeof date).toBe('string');

          if (options.valueProcessor) {
            expect(rest.createdAt).toBeDefined();
            options.parser
              ? expect(rest.createdAt).toBeInstanceOf(Date)
              : expect(typeof rest.createdAt).toBe('string');
          } else {
            expect(rest?.createdAt).toBeUndefined();
          }
        });
      });

      describe('set', () => {
        it('Should return true when the value of the cached key/value pair is successfully cached', async () => {
          const cached = await memcachedService.set('key', 'value');

          expect(cached).toBe(true);
        });
      });

      describe('get', () => {
        describe('by set', () => {
          it('Should return the value of the cached key/value pair since "set" tests should be passing', async () => {
            const data = {
              property: 'myProperty',
              list: [],
              date: new Date(),
            };

            await memcachedService.set('key', data);

            const { property, list, date } = (await memcachedService.get<typeof data>(
              'key'
            )) as typeof data;

            expect(property).toBe(data.property);
            expect(list).toEqual(data.list);
            options.parser ? expect(date).toBeInstanceOf(Date) : expect(typeof date).toBe('string');
          });

          it('Should return null since nothing has been cached and "set" tests should be passing', async () => {
            const cached = await memcachedService.get('key');

            expect(cached).toBe(null);
          });
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
