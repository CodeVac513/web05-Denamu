import * as supertest from 'supertest';
import { INestApplication } from '@nestjs/common';
import { RssAcceptRepository } from '../../src/rss/rss.repository';
import { FeedRepository } from '../../src/feed/feed.repository';
import { RssAcceptFixture } from '../fixture/rssAccept.fixture';
import { FeedFixture } from '../fixture/feed.fixture';
import { Feed } from '../../src/feed/feed.entity';

describe('GET /api/statistic/all E2E Test', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = global.testApp;
    const rssAcceptRepository = app.get(RssAcceptRepository);
    const feedRepository = app.get(FeedRepository);
    const [blog] = await Promise.all([
      rssAcceptRepository.save(RssAcceptFixture.createRssAcceptFixture()),
    ]);
    const feeds: Feed[] = [];
    for (let i = 1; i <= 2; i++) {
      feeds.push(FeedFixture.createFeedFixture(blog, { viewCount: i - 1 }, i));
    }
    await feedRepository.save(feeds);
  });

  it('값을 입력 하지 않으면 10개의 데이터만 응답한다.', async () => {
    // when
    const response = await supertest(app.getHttpServer()).get(
      '/api/statistic/all',
    );

    // then
    expect(response.status).toBe(200);
    expect(response.body.data.map((item) => item.id)).toStrictEqual([2, 1]);
  });
  it('양수를 입력하면 제한된 개수의 통계 결과를 응답한다.', async () => {
    // when
    const response = await supertest(app.getHttpServer()).get(
      '/api/statistic/all?limit=1',
    );

    // then
    expect(response.status).toBe(200);
    expect(response.body.data.map((item) => item.id)).toStrictEqual([2]);
  });
});
