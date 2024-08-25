import { forwardRef, Inject, Injectable } from '@nestjs/common';
import {
  InjectMemcached,
  InjectMemcachedOptions,
  MemcachedModuleOptions,
  MemcachedClient,
  MemcachedService,
} from '../';

@Injectable()
export class TestService {
  constructor(
    @InjectMemcachedOptions()
    private readonly memcachedModuleOptions: MemcachedModuleOptions,
    @InjectMemcached() private readonly memcachedClient: MemcachedClient,
    @Inject(forwardRef(() => MemcachedService))
    private readonly memcachedService: MemcachedService,
  ) {}

  getConfig(): MemcachedModuleOptions {
    return this.memcachedModuleOptions;
  }

  getClient(): MemcachedClient {
    return this.memcachedClient;
  }

  getService(): MemcachedService {
    return this.memcachedService;
  }
}
