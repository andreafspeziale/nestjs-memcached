import * as MemcachedClient from 'memcached';
import { Injectable } from '@nestjs/common';
import { InjectMemcached, InjectMemcachedOptions } from '../memcached.decorators';
import { MemcachedModuleOptions } from '../memcached.interfaces';

@Injectable()
export class TestService {
  constructor(
    @InjectMemcachedOptions()
    private readonly memcachedModuleOptions: MemcachedModuleOptions,
    @InjectMemcached() private readonly memcachedClient: MemcachedClient
  ) {}

  getConfig(): MemcachedModuleOptions {
    return this.memcachedModuleOptions;
  }

  getClient(): MemcachedClient {
    return this.memcachedClient;
  }
}
