import { Test, TestingModule } from '@nestjs/testing';
import { LoggerLevel, LoggerModule, LoggerService } from '@andreafspeziale/nestjs-log';
import {
  MemcachedService,
  MemcachedModule,
  CachingOptions,
  WrappedValue,
  MemcachedModuleOptions,
  getMemcachedLoggerToken,
} from '../';
import { LOGGER_INVOCATION_BY_API_COUNT_MAP } from './test.constants';

// Some random configs options
describe('MemcachedService (e2e)', () => {
  (
    [
      {
        options: {
          ttl: 60,
        },
      },
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
          connections: {
            options: {
              poolSize: 1,
            },
          },
          ttl: 60,
          superjson: false,
        },
      },
      {
        options: {
          connections: {
            locations: [
              {
                host: 'localhost',
                port: 11211,
              },
            ],
            options: {
              poolSize: 1,
            },
          },
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
          log: true,
        },
      },
    ] as { [key: string]: unknown; options: MemcachedModuleOptions }[]
  ).forEach(({ options }) =>
    describe(`Module with options: ${JSON.stringify(options)}`, () => {
      let moduleRef: TestingModule;

      let logger: LoggerService;
      let loggerDebugMethodSpy: jest.SpyInstance<
        ReturnType<LoggerService['debug']>,
        Parameters<LoggerService['debug']>
      >;

      let memcachedService: MemcachedService;

      beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
          imports: [
            LoggerModule.forRoot({ level: LoggerLevel.Silent }),
            MemcachedModule.forRoot(options, [
              { provide: getMemcachedLoggerToken(), useExisting: LoggerService },
            ]),
          ],
        }).compile();

        logger = await moduleRef.resolve(getMemcachedLoggerToken());

        // * Spy intercepts the method calls at the code level,
        // * before Winston's internal logic decides whether to actually log or not.
        loggerDebugMethodSpy = jest.spyOn(logger, 'debug');

        memcachedService = moduleRef.get(MemcachedService);
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

          options.log
            ? expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(
                LOGGER_INVOCATION_BY_API_COUNT_MAP['setWithMeta'] +
                  LOGGER_INVOCATION_BY_API_COUNT_MAP['get'],
              )
            : expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(0);
        });

        it('Should return the value of the cached key/value pair with override keyProcessor', async () => {
          const result = await memcachedService.setWithMeta('key', 'value', {
            keyProcessor: (key: string): string => `t_${key}`,
          });

          expect(result).toBe(true);

          const cached = await memcachedService.get<
            WrappedValue<string> & { createdAt: Date | string } & CachingOptions
          >('key', {
            keyProcessor: (key: string): string => `t_${key}`,
          });

          expect(cached?.ttl).toBe(options.ttl);
          options.ttr ? expect(cached?.ttr).toBe(options.ttr) : expect(cached?.ttr).toBeUndefined();
          expect(cached?.content).toBe('value');

          if (options.wrapperProcessor) {
            expect(cached?.createdAt).toBeDefined();
            options.superjson
              ? expect(cached?.createdAt).toBeInstanceOf(Date)
              : expect(typeof cached?.createdAt).toBe('string');
          }

          options.log
            ? expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(
                LOGGER_INVOCATION_BY_API_COUNT_MAP['setWithMeta'] +
                  LOGGER_INVOCATION_BY_API_COUNT_MAP['get'],
              )
            : expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(0);
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

          options.log
            ? expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(
                LOGGER_INVOCATION_BY_API_COUNT_MAP['setWithMeta'] +
                  LOGGER_INVOCATION_BY_API_COUNT_MAP['get'],
              )
            : expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(0);
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

          options.log
            ? expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(
                LOGGER_INVOCATION_BY_API_COUNT_MAP['setWithMeta'] +
                  LOGGER_INVOCATION_BY_API_COUNT_MAP['get'],
              )
            : expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(0);
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

          options.log
            ? expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(
                LOGGER_INVOCATION_BY_API_COUNT_MAP['setWithMeta'] +
                  LOGGER_INVOCATION_BY_API_COUNT_MAP['get'],
              )
            : expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(0);
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

          options.log
            ? expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(
                LOGGER_INVOCATION_BY_API_COUNT_MAP['setWithMeta'] +
                  LOGGER_INVOCATION_BY_API_COUNT_MAP['get'],
              )
            : expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(0);
        });
      });

      describe('set & get', () => {
        it('Should return the value of the cached key/value pair along with default', async () => {
          const result = await memcachedService.set('key', 'value');

          expect(result).toBe(true);

          const cached = await memcachedService.get('key');

          expect(cached).toBe('value');

          options.log
            ? expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(
                LOGGER_INVOCATION_BY_API_COUNT_MAP['set'] +
                  LOGGER_INVOCATION_BY_API_COUNT_MAP['get'],
              )
            : expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(0);
        });

        it('Should return the value of the cached key/value with override keyProcessor', async () => {
          const result = await memcachedService.set('key', 'value', {
            keyProcessor: (key: string): string => `t_${key}`,
          });

          expect(result).toBe(true);

          const cached = await memcachedService.get('key', {
            keyProcessor: (key: string): string => `t_${key}`,
          });

          expect(cached).toBe('value');

          options.log
            ? expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(
                LOGGER_INVOCATION_BY_API_COUNT_MAP['set'] +
                  LOGGER_INVOCATION_BY_API_COUNT_MAP['get'],
              )
            : expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(0);
        });

        it('Should return a Date object only if superjson is active', async () => {
          await memcachedService.set('key', new Date());
          const result = await memcachedService.get('key');

          options.superjson
            ? expect(result).toBeInstanceOf(Date)
            : expect(typeof result).toBe('string');

          options.log
            ? expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(
                LOGGER_INVOCATION_BY_API_COUNT_MAP['set'] +
                  LOGGER_INVOCATION_BY_API_COUNT_MAP['get'],
              )
            : expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(0);
        });

        it('Should always return a number when set', async () => {
          await memcachedService.set('key', 1);
          const result = await memcachedService.get('key');

          expect(result).toBe(1);

          options.log
            ? expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(3 + 3)
            : expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(0);
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

          options.log
            ? expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(
                LOGGER_INVOCATION_BY_API_COUNT_MAP['set'] +
                  LOGGER_INVOCATION_BY_API_COUNT_MAP['get'],
              )
            : expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(0);
        });

        it('Should return null', async () => {
          const cached = await memcachedService.get('key');

          expect(cached).toBe(null);

          options.log
            ? expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(
                LOGGER_INVOCATION_BY_API_COUNT_MAP['get'],
              )
            : expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(0);
        });
      });

      describe('add & get', () => {
        it('Should return the value of the cached key/value pair along with default', async () => {
          const result = await memcachedService.add('key', 'value');

          expect(result).toBe(true);

          const cached = await memcachedService.get('key');

          expect(cached).toBe('value');

          options.log
            ? expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(
                LOGGER_INVOCATION_BY_API_COUNT_MAP['add'] +
                  LOGGER_INVOCATION_BY_API_COUNT_MAP['get'],
              )
            : expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(0);
        });

        it('Should return the value of the cached key/value with override keyProcessor', async () => {
          const result = await memcachedService.add('key', 'value', {
            keyProcessor: (key: string): string => `t_${key}`,
          });

          expect(result).toBe(true);

          const cached = await memcachedService.get('key', {
            keyProcessor: (key: string): string => `t_${key}`,
          });

          expect(cached).toBe('value');

          options.log
            ? expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(
                LOGGER_INVOCATION_BY_API_COUNT_MAP['add'] +
                  LOGGER_INVOCATION_BY_API_COUNT_MAP['get'],
              )
            : expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(0);
        });

        it('Should return a Date object only if superjson is active', async () => {
          await memcachedService.add('key', new Date());
          const result = await memcachedService.get('key');

          options.superjson
            ? expect(result).toBeInstanceOf(Date)
            : expect(typeof result).toBe('string');

          options.log
            ? expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(
                LOGGER_INVOCATION_BY_API_COUNT_MAP['add'] +
                  LOGGER_INVOCATION_BY_API_COUNT_MAP['get'],
              )
            : expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(0);
        });

        it('Should always return a number when set', async () => {
          await memcachedService.add('key', 1);
          const result = await memcachedService.get('key');

          expect(result).toBe(1);

          options.log
            ? expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(
                LOGGER_INVOCATION_BY_API_COUNT_MAP['add'] +
                  LOGGER_INVOCATION_BY_API_COUNT_MAP['get'],
              )
            : expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(0);
        });

        it('Should return the value of the cached key/value pair as complex object', async () => {
          const data = {
            property: 'myProperty',
            list: [],
            date: new Date(),
          };

          const result = await memcachedService.add('key', data);

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

          options.log
            ? expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(
                LOGGER_INVOCATION_BY_API_COUNT_MAP['add'] +
                  LOGGER_INVOCATION_BY_API_COUNT_MAP['get'],
              )
            : expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(0);
        });

        it('Should return false if cached key/value pair already exists', async () => {
          await memcachedService.add('key', 'value');

          await expect(memcachedService.add('key', 'value2')).rejects.toThrow({
            name: 'OperationalError',
            message: 'Item is not stored',
            cause: new Error('Item is not stored'),
          });

          options.log
            ? expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(
                LOGGER_INVOCATION_BY_API_COUNT_MAP['add'] +
                  LOGGER_INVOCATION_BY_API_COUNT_MAP['add'],
              )
            : expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(0);
        });
      });

      describe('set & incr', () => {
        it('Should correclty increment the key numeric value', async () => {
          const incr = 1;
          const curr = 0;

          await memcachedService.set('key', curr);

          const result = await memcachedService.incr('key', incr);

          expect(result).toBe(curr + incr);

          options.log
            ? expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(
                LOGGER_INVOCATION_BY_API_COUNT_MAP['set'] +
                  LOGGER_INVOCATION_BY_API_COUNT_MAP['incr'],
              )
            : expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(0);
        });

        it('Should correclty increment the key numeric value with override keyProcessor', async () => {
          const incr = 1;
          const curr = 0;

          await memcachedService.set('key', curr, {
            keyProcessor: (key: string): string => `t_${key}`,
          });

          const result = await memcachedService.incr('key', incr, {
            keyProcessor: (key: string): string => `t_${key}`,
          });

          expect(result).toBe(curr + incr);

          options.log
            ? expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(
                LOGGER_INVOCATION_BY_API_COUNT_MAP['set'] +
                  LOGGER_INVOCATION_BY_API_COUNT_MAP['incr'],
              )
            : expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(0);
        });

        it('Should return false since key has never been set as whatever', async () => {
          const result = await memcachedService.incr('key', 1);

          expect(result).toBe(false);

          options.log
            ? expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(
                LOGGER_INVOCATION_BY_API_COUNT_MAP['incr'],
              )
            : expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(0);
        });

        it('Should throw Error if key value is set but not numeric', async () => {
          await memcachedService.set('key', 'value');

          await expect(memcachedService.incr('key', 1)).rejects.toThrow({
            name: 'OperationalError',
            message: 'cannot increment or decrement non-numeric value',
            cause: new Error('cannot increment or decrement non-numeric value'),
          });

          options.log
            ? expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(
                LOGGER_INVOCATION_BY_API_COUNT_MAP['set'] +
                  LOGGER_INVOCATION_BY_API_COUNT_MAP['incr'],
              )
            : expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(0);
        });
      });

      describe('set & incr & get', () => {
        it('Should correclty increment the key numeric value', async () => {
          const incr = 1;
          const curr = 0;

          await memcachedService.set('key', curr);
          await memcachedService.incr('key', incr);

          const result = await memcachedService.get('key');

          expect(result).toBe(curr + incr);

          options.log
            ? expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(
                LOGGER_INVOCATION_BY_API_COUNT_MAP['set'] +
                  LOGGER_INVOCATION_BY_API_COUNT_MAP['incr'] +
                  LOGGER_INVOCATION_BY_API_COUNT_MAP['get'],
              )
            : expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(0);
        });
      });

      describe('set & decr', () => {
        it('Should correclty decrement the key numeric value', async () => {
          const decr = 1;
          const curr = 1;

          await memcachedService.set('key', curr);

          const result = await memcachedService.decr('key', decr);

          expect(result).toBe(curr - decr);

          options.log
            ? expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(
                LOGGER_INVOCATION_BY_API_COUNT_MAP['set'] +
                  LOGGER_INVOCATION_BY_API_COUNT_MAP['decr'],
              )
            : expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(0);
        });

        it('Should correclty decrement returning 0 even if decrement goes negative', async () => {
          const decr = 100;
          const curr = 50;

          await memcachedService.set('key', curr);

          const result = await memcachedService.decr('key', decr);

          expect(result).toBe(0);

          options.log
            ? expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(
                LOGGER_INVOCATION_BY_API_COUNT_MAP['set'] +
                  LOGGER_INVOCATION_BY_API_COUNT_MAP['decr'],
              )
            : expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(0);
        });

        it('Should correclty decrement the key numeric value with override keyProcessor', async () => {
          const decr = 1;
          const curr = 1;

          await memcachedService.set('key', curr, {
            keyProcessor: (key: string): string => `t_${key}`,
          });

          const result = await memcachedService.decr('key', decr, {
            keyProcessor: (key: string): string => `t_${key}`,
          });

          expect(result).toBe(curr - decr);

          options.log
            ? expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(
                LOGGER_INVOCATION_BY_API_COUNT_MAP['set'] +
                  LOGGER_INVOCATION_BY_API_COUNT_MAP['decr'],
              )
            : expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(0);
        });

        it('Should return 0 if try to decrement from 0', async () => {
          const decr = 1;
          const curr = 0;

          await memcachedService.set('key', curr);

          const result = await memcachedService.decr('key', decr);

          expect(result).toBe(curr);

          options.log
            ? expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(
                LOGGER_INVOCATION_BY_API_COUNT_MAP['set'] +
                  LOGGER_INVOCATION_BY_API_COUNT_MAP['decr'],
              )
            : expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(0);
        });

        it('Should return false since key has never been set as whatever', async () => {
          const result = await memcachedService.decr('key', 1);

          expect(result).toBe(false);

          options.log
            ? expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(
                LOGGER_INVOCATION_BY_API_COUNT_MAP['decr'],
              )
            : expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(0);
        });

        it('Should throw Error if key value is set but not numeric', async () => {
          await memcachedService.set('key', 'value');

          await expect(memcachedService.decr('key', 1)).rejects.toThrow({
            name: 'OperationalError',
            message: 'cannot increment or decrement non-numeric value',
            cause: new Error('cannot increment or decrement non-numeric value'),
          });

          options.log
            ? expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(
                LOGGER_INVOCATION_BY_API_COUNT_MAP['set'] +
                  LOGGER_INVOCATION_BY_API_COUNT_MAP['decr'],
              )
            : expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(0);
        });
      });

      describe('set & decr & get', () => {
        it('Should correclty decrement the key numeric value', async () => {
          const decr = 1;
          const curr = 1;

          await memcachedService.set('key', curr);
          await memcachedService.decr('key', decr);

          const result = await memcachedService.get('key');

          expect(result).toBe(curr - decr);

          options.log
            ? expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(
                LOGGER_INVOCATION_BY_API_COUNT_MAP['set'] +
                  LOGGER_INVOCATION_BY_API_COUNT_MAP['decr'] +
                  LOGGER_INVOCATION_BY_API_COUNT_MAP['get'],
              )
            : expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(0);
        });
      });

      describe('set & del', () => {
        it('Should return true since cached key/value has been deleted', async () => {
          await memcachedService.set('key', 'value');

          const deleted = await memcachedService.del('key');

          expect(deleted).toBe(true);

          options.log
            ? expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(
                LOGGER_INVOCATION_BY_API_COUNT_MAP['set'] +
                  LOGGER_INVOCATION_BY_API_COUNT_MAP['del'],
              )
            : expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(0);
        });

        it('Should return false since key/value has never been cached', async () => {
          const deleted = await memcachedService.del('key');

          expect(deleted).toBe(false);

          options.log
            ? expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(
                LOGGER_INVOCATION_BY_API_COUNT_MAP['del'],
              )
            : expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(0);
        });
      });

      afterEach(async () => {
        await memcachedService.flush();
        // * After flush otherwise flush will be counted in the next test iteration
        loggerDebugMethodSpy.mockClear();
      });

      afterAll(async () => {
        await moduleRef.close();
      });
    }),
  );
});
