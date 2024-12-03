import * as request from 'supertest';
import { redisKeys } from '../../src/common/redis/redis.constant';
import { INestApplication } from '@nestjs/common';
import { RedisService } from '../../src/common/redis/redis.service';
import { FeedRepository } from '../../src/feed/feed.repository';
import { RssAcceptRepository } from '../../src/rss/rss.repository';
import { FeedFixture } from '../fixture/feed.fixture';
import { RssFixture } from '../fixture/rss.fixture';

describe('POST /api/feed/:feedId E2E Test', () => {
  let app: INestApplication;
  let redisService: RedisService;
  const testFeedId = 1;
  const testIp = `1.1.1.1`;
  const latestId = 20;

  beforeAll(async () => {
    app = global.testApp;
    redisService = app.get(RedisService);
    const feedRepository = app.get(FeedRepository);
    const rssAcceptRepository = app.get(RssAcceptRepository);

    const blog = await rssAcceptRepository.save(RssFixture.createRssFixture());

    const feeds = Array.from({ length: latestId }).map((_, i) => {
      return FeedFixture.createFeedFixture(blog, _, i + 1);
    });

    await Promise.all([
      feedRepository.save(feeds),
      redisService.redisClient.sadd(`feed:${testFeedId}:ip`, testIp),
    ]);
  });

  it('Redis에 저장된 IP가 아니면서 쿠키가 없으면 조회수는 정상적으로 상승한다.', async () => {
    //given
    const testNewIp = `123.234.123.234`;

    try {
      //when
      const response = await request(app.getHttpServer())
        .post(`/api/feed/${testFeedId}`)
        .set('X-Forwarded-For', testNewIp);
      const feedDailyViewCount = parseInt(
        await redisService.redisClient.zscore(
          redisKeys.FEED_TREND_KEY,
          testFeedId.toString(),
        ),
      );

      //then
      expect(response.status).toBe(200);
      expect(feedDailyViewCount).toBe(1);
    } finally {
      //cleanup
      await Promise.all([
        redisService.redisClient.zrem(
          redisKeys.FEED_TREND_KEY,
          testFeedId.toString(),
        ),
        redisService.redisClient.srem(`feed:${testFeedId}:ip`, testNewIp),
      ]);
    }
  });

  it('해당 피드 ID가 존재하지 않으면 404 예외가 발생한다.', async () => {
    //given
    const notExistFeedId = 50000;

    //when
    const response = await request(app.getHttpServer()).post(
      `/api/feed/${notExistFeedId}`,
    );

    //then
    expect(response.status).toBe(404);
  });

  it('쿠키가 있으면 조회수는 올라가지 않는다.', async () => {
    //when
    const response = await request(app.getHttpServer())
      .post(`/api/feed/${testFeedId}`)
      .set('Cookie', `View_count_${testFeedId}=${testFeedId}`)
      .set('X-Forwarded-For', testIp);
    const feedDailyViewCount = await redisService.redisClient.zscore(
      redisKeys.FEED_TREND_KEY,
      testFeedId.toString(),
    );

    //then
    expect(response.status).toBe(200);
    expect(feedDailyViewCount).toBeNull();
  });

  it('쿠키가 없지만 Redis에 IP가 저장되어 있으면 조회수는 올라가지 않는다.', async () => {
    //when
    const response = await request(app.getHttpServer())
      .post(`/api/feed/${testFeedId}`)
      .set('X-Forwarded-For', testIp);
    const feedDailyViewCount = await redisService.redisClient.zscore(
      redisKeys.FEED_TREND_KEY,
      testFeedId.toString(),
    );

    //then
    expect(response.status).toBe(200);
    expect(feedDailyViewCount).toBeNull();
  });
});
