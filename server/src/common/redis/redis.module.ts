import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import Redis from 'ioredis';
import Redis_Mock from 'ioredis-mock';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const envType = process.env.NODE_ENV;
        let redis: Redis;
        if (envType === 'test') {
          redis = new Redis_Mock();
        } else {
          redis = new Redis({
            host: configService.get<string>('REDIS_HOST'),
            port: configService.get<number>('REDIS_PORT'),
            username: configService.get<string>('REDIS_USERNAME'),
            password: configService.get<string>('REDIS_PASSWORD'),
          });
        }
        return redis;
      },
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}
