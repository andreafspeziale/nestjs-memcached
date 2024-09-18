import { Test, TestingModule } from '@nestjs/testing';
import { LoggerLevel, LoggerModule, LoggerService } from '@andreafspeziale/nestjs-log';
import {
  MemcachedModuleOptions,
  MemcachedService,
  MemcachedModule,
  CachableValue,
  getMemcachedOptionalLoggerToken,
} from '../';

// Some random configs options
describe('MemcachedService (e2e)', () => {
  describe('With basic configuration', () => {
    const moduleOptions: MemcachedModuleOptions = {
      lifetimes: { ttl: 60 },
    };

    let module: TestingModule;
    let memcachedService: MemcachedService;

    beforeAll(async () => {
      module = await Test.createTestingModule({
        imports: [MemcachedModule.forRoot(moduleOptions)],
      }).compile();

      memcachedService = module.get(MemcachedService);
    });

    describe('set & get', () => {
      [
        {
          value: true,
          type: 'boolean',
        },
        {
          value: false,
          type: 'boolean',
        },
        {
          value: 'value',
          type: 'string',
        },
        {
          value: 1,
          type: 'number',
        },
        {
          value: 1.1,
          type: 'number',
        },
        {
          value: new Date('2024-09-06'),
          type: 'date',
        },
        {
          value: {
            message: 'hello',
            a: 1,
            b: 1.1,
            c: true,
            date: new Date('2024-09-06'),
          },
          type: 'object',
        },
        {
          value: [1, '2', { message: 'hello', prop: true }, true, 1.1],
          type: 'list',
        },
      ].forEach(({ value, type }) =>
        it(`Should be possible to set a ${type} and get the correct cached value`, async () => {
          await memcachedService.set('key', value);
          const cached = await memcachedService.get('key');
          expect(cached).toStrictEqual(value);
        }),
      );

      it('Should get "null" as cached because "keyProcessor" is used inline in "set" API changing the cache key', async () => {
        const value = true;

        await memcachedService.set('key', value, {
          keyProcessor: { fn: (i) => `my_prefix${i.key}` },
        });

        const cached = await memcachedService.get('key');

        expect(cached).toStrictEqual(null);
      });

      it('Should get the expected cached value when "keyProcessor" is used inline on "set" and "get" APIs', async () => {
        const value = true;

        await memcachedService.set('key', value, {
          keyProcessor: { fn: (i) => `my_prefix${i.key}` },
        });

        const cached = await memcachedService.get('key', {
          keyProcessor: { fn: (i) => `my_prefix${i.key}` },
        });

        expect(cached).toStrictEqual(value);
      });

      it('Should be possible disable "keyProcessor" inline when used on "set" and "get" APIs the expected cached value', async () => {
        const value = true;

        await memcachedService.set('key', value, {
          keyProcessor: { fn: (i) => `my_prefix${i.key}`, disable: true },
        });

        const cached = await memcachedService.get('key');

        expect(cached).toStrictEqual(value);
      });

      it('Should be possible disable "keyProcessor" inline when used on "get" API and get the expected cached value', async () => {
        const value = true;

        await memcachedService.set('key', value);

        const cached = await memcachedService.get('key', {
          keyProcessor: { fn: (i) => `my_prefix${i.key}`, disable: true },
        });

        expect(cached).toStrictEqual(value);
      });

      it('Should get the expected "setProcessor" cached item on "set" API', async () => {
        const value = true;

        await memcachedService.set<boolean, { content: boolean }>('key', value, {
          setProcessor: { fn: (i) => ({ content: i.value }) },
        });

        const cached = await memcachedService.get('key');

        expect(cached).toStrictEqual({ content: value });
      });

      it('Should get the expected value "set/getProcessor" cached item on "set" and "get" APIs', async () => {
        const value = true;

        await memcachedService.set<boolean, { content: boolean }>('key', value, {
          setProcessor: { fn: (i) => ({ content: i.value }) },
        });

        const cached = await memcachedService.get<boolean, { content: boolean }>('key', {
          getProcessor: { fn: (i) => i.content },
        });

        expect(cached).toStrictEqual(value);
      });

      it('Should get the expected cached item by disable inline "setProcessor" on "set" API', async () => {
        const value = true;

        await memcachedService.set<boolean, { content: boolean }>('key', value, {
          setProcessor: { fn: (i) => ({ content: i.value }), disable: true },
        });

        const cached = await memcachedService.get('key');

        expect(cached).toStrictEqual(value);
      });

      it('Should get the expected cached item by disable inline "getProcessor" on "get" API', async () => {
        const value = true;

        await memcachedService.set<boolean, { content: boolean }>('key', value, {
          setProcessor: { fn: (i) => ({ content: i.value }) },
        });

        const cached = await memcachedService.get<boolean, { content: boolean }>('key', {
          getProcessor: { fn: (i) => i.content, disable: true },
        });

        expect(cached).toStrictEqual({ content: value });
      });
    });

    afterEach(async () => {
      await memcachedService.flush();
    });

    afterAll(async () => {
      await module.close();
    });
  });

  describe('With full configuration', () => {
    const moduleOptions: MemcachedModuleOptions<{
      content: CachableValue;
      version?: string;
    }> = {
      connection: { host: '0.0.0.0', port: 11211 },
      lifetimes: { ttl: 60, ttr: 30 },
      version: '1',
      keyProcessor: {
        fn: ({ key, version }) => `${version ? version + '::' : ''}${key}`,
      },
      getProcessor: {
        fn: (i) => i.content,
      },
      setProcessor: {
        fn: ({ value, version }) => ({
          content: value,
          ...(version ? { version } : {}),
        }),
      },
    };

    let module: TestingModule;
    let memcachedService: MemcachedService;

    beforeAll(async () => {
      module = await Test.createTestingModule({
        imports: [MemcachedModule.forRoot(moduleOptions)],
      }).compile();

      memcachedService = module.get(MemcachedService);
    });

    describe('set & get', () => {
      [
        {
          value: true,
          type: 'boolean',
        },
        {
          value: false,
          type: 'boolean',
        },
        {
          value: 'value',
          type: 'string',
        },
        {
          value: 1,
          type: 'number',
        },
        {
          value: 1.1,
          type: 'number',
        },
        {
          value: new Date('2024-09-06'),
          type: 'date',
        },
        {
          value: {
            message: 'hello',
            a: 1,
            b: 1.1,
            c: true,
            date: new Date('2024-09-06'),
          },
          type: 'object',
        },
        {
          value: [1, '2', { message: 'hello', prop: true }, true, 1.1],
          type: 'list',
        },
      ].forEach(({ value, type }) =>
        it(`Should be possible to set a ${type} and get the correct cached value`, async () => {
          await memcachedService.set('key', value);
          const cached = await memcachedService.get('key');
          expect(cached).toStrictEqual(value);
        }),
      );

      it('Should get "null" as cached because global "keyProcessor" is used in "set" API but disabled inline in "get" API', async () => {
        const value = true;

        await memcachedService.set('key', value);

        const cached = await memcachedService.get('key', { keyProcessor: { disable: true } });

        expect(cached).toStrictEqual(null);
      });

      it('Should get "null" as cached because global "keyProcessor" is used in "get" API but disabled inline in "set" API', async () => {
        const value = true;

        await memcachedService.set('key', value, { keyProcessor: { disable: true } });

        const cached = await memcachedService.get('key');

        expect(cached).toStrictEqual(null);
      });

      it('Should return the expected cached value overriding global "keyProcessor" inline on both APIs side', async () => {
        const value = true;

        await memcachedService.set('key', value, {
          keyProcessor: { fn: (i) => `my_prefix${i.key}` },
        });

        const cached = await memcachedService.get('key', {
          keyProcessor: { fn: (i) => `my_prefix${i.key}` },
        });

        expect(cached).toStrictEqual(value);
      });

      it('Should return the expected processed cached value disabling global "getProcessor"', async () => {
        const value = true;

        await memcachedService.set<boolean>('key', value);

        const cached = await memcachedService.get<{
          content: boolean;
          version: string;
        }>('key', {
          getProcessor: { disable: true },
        });

        expect(cached).toStrictEqual({
          content: value,
          version: '1',
        });
      });

      it('Should return the expected processed cached value overriding inline both "setProcessor" and "getProcessor"', async () => {
        const value = true;

        await memcachedService.set<boolean, { value: boolean }>('key', value, {
          setProcessor: { fn: ({ value: v }) => ({ value: v }) },
        });

        const cached = await memcachedService.get<
          boolean,
          {
            value: boolean;
          }
        >('key', {
          getProcessor: { fn: (i) => i.value },
        });

        expect(cached).toStrictEqual(value);
      });
    });

    afterEach(async () => {
      await memcachedService.flush();
    });

    afterAll(async () => {
      await module.close();
    });
  });

  describe('With LoggerService', () => {
    [
      {
        description:
          'Should NOT SPY but WORK even if "log" is TRUE, LoggerService is INIT but NOT PROVIDED',
        memcached: {
          lifetimes: { ttl: 60 },
          log: true,
        },
        init: true,
        provide: false,
      },
      {
        description:
          'Should NOT SPY but WORK even if "log" is TRUE, LoggerService is NOT INIT and NOT PROVIDED',
        memcached: {
          lifetimes: { ttl: 60 },
          log: true,
        },
        init: false,
        provide: false,
      },
      {
        description: 'Should SPY AND WORK if "log" is TRUE, LoggerService is INIT and PROVIDED',
        memcached: {
          lifetimes: { ttl: 60 },
          log: true,
        },
        init: true,
        provide: true,
      },
      {
        description: 'Should SPY AND WORK if "log" is false, LoggerService is INIT and PROVIDED',
        memcached: {
          lifetimes: { ttl: 60 },
          log: false,
        },
        init: true,
        provide: true,
      },
    ].forEach(({ description, memcached, init, provide }) =>
      it(description, async () => {
        const key = 'key';
        const value = 'value';

        let cached: string | null;

        const module = await Test.createTestingModule({
          imports: [
            ...(init ? [LoggerModule.forRoot({ level: LoggerLevel.Silent })] : []),
            MemcachedModule.forRoot(
              memcached,
              provide
                ? [{ provide: getMemcachedOptionalLoggerToken(), useExisting: LoggerService }]
                : [],
            ),
          ],
        }).compile();

        const memcachedService = module.get(MemcachedService);

        if (init && provide) {
          const logger = await module.resolve<LoggerService>(getMemcachedOptionalLoggerToken());
          const loggerDebugMethodSpy = jest.spyOn(logger, 'debug');

          await memcachedService.set(key, value);
          cached = await memcachedService.get(key);

          if (memcached.log) {
            expect(loggerDebugMethodSpy).toHaveBeenCalled();
          } else {
            expect(loggerDebugMethodSpy).toHaveBeenCalledTimes(0);
          }

          expect(cached).toStrictEqual(value);
          loggerDebugMethodSpy.mockClear();
        }

        await memcachedService.set(key, value);
        cached = await memcachedService.get(key);

        expect(cached).toStrictEqual(value);

        await module.close();
      }),
    );
  });
});
