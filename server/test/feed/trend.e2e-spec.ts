import { INestApplication } from '@nestjs/common';
import { EventEmitter } from 'stream';
import { RedisService } from '../../src/common/redis/redis.service';
import { redisKeys } from '../../src/common/redis/redis.constant';
import { RssAcceptFixture } from '../fixture/rssAccept.fixture';
import { FeedRepository } from '../../src/feed/feed.repository';
import { RssAcceptRepository } from '../../src/rss/rss.repository';
import { Feed } from '../../src/feed/feed.entity';
import { FeedFixture } from '../fixture/feed.fixture';
import * as EventSource from 'eventsource';

describe('SSE /api/trend/sse E2E Test', () => {
  let events: EventEmitter;
  let app: INestApplication;
  let feedRepository: FeedRepository;
  beforeAll(async () => {
    events = new EventEmitter();
    app = global.testApp;
    feedRepository = app.get(FeedRepository);
    const rssAcceptRepository = app.get(RssAcceptRepository);
    const redisService = app.get(RedisService);
    const [blog] = await Promise.all([
      rssAcceptRepository.save(RssAcceptFixture.createRssAcceptFixture()),
      redisService.redisClient.rpush(redisKeys.FEED_ORIGIN_TREND_KEY, 1, 2),
    ]);
    const feeds: Feed[] = [];
    for (let i = 1; i <= 2; i++) {
      feeds.push(FeedFixture.createFeedFixture(blog, {}, i));
    }
    await feedRepository.save(feeds);
    await app.listen(7000);
  });

  it('최초 연결이 되면 트랜드 데이터를 최대 4개 받을 수 있다.', async () => {
    const es = new EventSource('http://localhost:7000/api/feed/trend/sse');

    const timeout = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error('Timeout occurred before receiving data')),
        1000,
      ),
    );

    const eventResult = new Promise((resolve, reject) => {
      es.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          const data = response.data;
          const idList = data.map((item) => item.id);
          es.close();
          resolve(idList);
        } catch (error) {
          es.close();
          reject(error);
        }
      };

      es.onerror = (error) => {
        es.close();
        reject(error);
      };
    });

    const idList = await Promise.race([eventResult, timeout]);
    expect(idList).toStrictEqual([1, 2]);
  });

  it('서버로부터 데이터를 받을 때, 게시글이 지워진 상황이라면 게시글을 받지 않는다.', async () => {
    await feedRepository.delete({ id: 2 });

    const es = new EventSource('http://localhost:7000/api/feed/trend/sse');

    const timeout = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error('Timeout occurred before receiving data')),
        1000,
      ),
    );

    const eventResult = new Promise((resolve, reject) => {
      es.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          const data = response.data;
          const idList = data.map((item) => item.id);
          es.close();
          resolve(idList);
        } catch (error) {
          es.close();
          reject(error);
        }
      };

      es.onerror = (error) => {
        es.close();
        reject(error);
      };
    });

    const idList = await Promise.race([eventResult, timeout]);
    expect(idList).toStrictEqual([1]);
  });
});
