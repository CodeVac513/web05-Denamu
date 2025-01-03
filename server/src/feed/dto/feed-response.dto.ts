import { Feed } from '../feed.entity';

export class FeedResponseDto {
  private constructor(
    private id: number,
    private author: string,
    private blogPlatform: string,
    private title: string,
    private path: string,
    private createdAt: Date,
    private thumbnail: string,
    private viewCount: number,
  ) {}

  private static mapFeedToFeedResponseDto(feed: Feed) {
    return new FeedResponseDto(
      feed.id,
      feed.blog.name,
      feed.blog.blogPlatform,
      feed.title,
      feed.path,
      feed.createdAt,
      feed.thumbnail,
      feed.viewCount,
    );
  }

  public static mapFeedsToFeedResponseDtoArray(FeedList: Feed[]) {
    return FeedList.map(this.mapFeedToFeedResponseDto);
  }
}
