import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import {
  MemcachedService,
  MemcachedModule,
  CachingOptions,
  WrappedValue,
  MemcachedModuleOptions,
} from '../';

describe('MemcachedService (e2e)', () => {
  (
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
          superjson: true,
        },
      },
      {
        options: {
          ttl: 60,
          ttr: 30,
          // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
          wrapperProcessor: ({ value, ttl, ttr }) => ({
            content: value,
            ttl,
            ...(ttr ? { ttr } : {}),
            createdAt: new Date(),
          }),
          keyProcessor: (key: string): string => `v_${key}`,
        },
      },
    ] as { [key: string]: unknown; options: MemcachedModuleOptions }[]
  ).forEach(({ options }) =>
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
        it('Should return the value of the cached key/value pair along with defaults', async () => {
          const result = await memcachedService.setWithMeta('key', 'value');

          expect(result).toBe(true);

          const cached = await memcachedService.get<
            WrappedValue<string> & { createdAt: Date | string } & CachingOptions
          >('key');

          expect(cached?.ttl).toBe(options.ttl);
          options.ttr ? expect(cached?.ttr).toBe(options.ttr) : expect(cached?.ttr).toBeUndefined();
          expect(cached?.content).toBe('value');

          if (options.wrapperProcessor) {
            expect(cached?.createdAt).toBeDefined();
            options.superjson
              ? expect(cached?.createdAt).toBeInstanceOf(Date)
              : expect(typeof cached?.createdAt).toBe('string');
          }
        });

        it('Should return the value of the cached key/value pair along with specified ttl', async () => {
          const result = await memcachedService.setWithMeta<string>('key', 'value', { ttl: 100 });

          expect(result).toBe(true);

          const cached = await memcachedService.get<
            WrappedValue<string> & { createdAt: Date | string } & CachingOptions
          >('key');

          expect(cached?.ttl).toBe(100);
          options.ttr ? expect(cached?.ttr).toBe(options.ttr) : expect(cached?.ttr).toBeUndefined();
          expect(cached?.content).toBe('value');

          if (options.wrapperProcessor) {
            expect(cached?.createdAt).toBeDefined();
            options.superjson
              ? expect(cached?.createdAt).toBeInstanceOf(Date)
              : expect(typeof cached?.createdAt).toBe('string');
          }
        });

        it('Should return the value of the cached key/value pair along with specified ttl and ttr', async () => {
          const result = await memcachedService.setWithMeta('key', 'value', {
            ttl: 100,
            ttr: 50,
          });

          expect(result).toBe(true);

          const cached = await memcachedService.get<
            WrappedValue<string> & { createdAt: Date | string } & CachingOptions
          >('key');

          expect(cached?.ttl).toBe(100);
          expect(cached?.ttr).toBe(50);
          expect(cached?.content).toBe('value');

          if (options.wrapperProcessor) {
            expect(cached?.createdAt).toBeDefined();
            options.superjson
              ? expect(cached?.createdAt).toBeInstanceOf(Date)
              : expect(typeof cached?.createdAt).toBe('string');
          }
        });

        it('Should return the value of the cached key/value with override wrapperProcessor', async () => {
          const result = await memcachedService.setWithMeta<
            string,
            WrappedValue<string> & { test: string } & CachingOptions
          >('key', 'value', {
            ttl: 100,
            ttr: 50,
            wrapperProcessor: ({ value, ttl, ttr }) => ({
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

          const cached = await memcachedService.get<
            WrappedValue<typeof data> & { createdAt: Date | string } & CachingOptions
          >('key');

          const {
            content: { property, list, date },
            ...rest
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          } = cached!;

          expect(rest.ttl).toBe(options.ttl);
          options.ttr ? expect(rest.ttr).toBe(options.ttr) : expect(rest.ttr).toBeUndefined();

          expect(property).toBe(data.property);
          expect(list).toEqual(data.list);
          options.superjson
            ? expect(date).toBeInstanceOf(Date)
            : expect(typeof date).toBe('string');

          if (options.wrapperProcessor) {
            expect(cached?.createdAt).toBeDefined();
            options.superjson
              ? expect(cached?.createdAt).toBeInstanceOf(Date)
              : expect(typeof cached?.createdAt).toBe('string');
          }
        });
      });

      describe('set & get', () => {
        it('Should return the value of the cached key/value pair along with default', async () => {
          const result = await memcachedService.set('key', 'value');

          expect(result).toBe(true);

          const cached = await memcachedService.get('key');

          expect(cached).toBe('value');
        });

        it('Should return the value of the cached key/value pair as complex object', async () => {
          const data = {
            property: 'myProperty',
            list: [],
            date: new Date(),
          };

          const result = await memcachedService.set('key', data);

          expect(result).toBe(true);

          const cached = await memcachedService.get<
            Omit<typeof data, 'date'> & { date: Date | string }
          >('key');

          const {
            property,
            list,
            date,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          } = cached!;

          expect(property).toBe(data.property);
          expect(list).toEqual(data.list);
          options.superjson
            ? expect(date).toBeInstanceOf(Date)
            : expect(typeof date).toBe('string');
        });

        it('Should return null', async () => {
          const cached = await memcachedService.get('key');

          expect(cached).toBe(null);
        });
      });

      describe('incr', () => {
        it('Should correclty increment the key numeric value', async () => {
          const incr = 1;
          const curr = 0;

          await memcachedService.set('key', curr);
          const result = await memcachedService.incr('key', incr);

          expect(result).toBe(curr + incr);
        });

        it('Should return false since key has never been set as whatever', async () => {
          const result = await memcachedService.incr('key', 1);

          expect(result).toBe(false);
        });

        it('Should throw Error if key value is set but not numeric', async () => {
          await memcachedService.set('key', 'value');

          await expect(memcachedService.incr('key', 1)).rejects.toThrow(
            new Error('cannot increment or decrement non-numeric value')
          );
        });
      });

      describe('decr', () => {
        it('Should correclty decrement the key numeric value', async () => {
          const decr = 1;
          const curr = 1;

          await memcachedService.set('key', curr);
          const result = await memcachedService.decr('key', decr);

          expect(result).toBe(curr - decr);
        });

        it('Should return 0 if try to decrement from 0', async () => {
          const decr = 1;
          const curr = 0;

          await memcachedService.set('key', curr);
          const result = await memcachedService.decr('key', decr);

          expect(result).toBe(curr);
        });

        it('Should return false since key has never been set as whatever', async () => {
          const result = await memcachedService.decr('key', 1);

          expect(result).toBe(false);
        });

        it('Should throw Error if key value is set but not numeric', async () => {
          await memcachedService.set('key', 'value');

          await expect(memcachedService.decr('key', 1)).rejects.toThrow(
            new Error('cannot increment or decrement non-numeric value')
          );
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
