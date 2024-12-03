import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  RssRejectRepository,
  RssRepository,
  RssAcceptRepository,
} from './rss.repository';
import { RssRegisterDto } from './dto/rss-register.dto';
import { EmailService } from '../common/email/email.service';
import { DataSource } from 'typeorm';
import { Rss, RssReject, RssAccept } from './rss.entity';

@Injectable()
export class RssService {
  constructor(
    private readonly rssRepository: RssRepository,
    private readonly rssAcceptRepository: RssAcceptRepository,
    private readonly rssRejectRepository: RssRejectRepository,
    private readonly emailService: EmailService,
    private readonly dataSource: DataSource,
  ) {}

  async registerRss(rssRegisterDto: RssRegisterDto) {
    const [alreadyURLRss, alreadyURLBlog] = await Promise.all([
      this.rssRepository.findOne({
        where: {
          rssUrl: rssRegisterDto.rssUrl,
        },
      }),
      this.rssAcceptRepository.findOne({
        where: {
          rssUrl: rssRegisterDto.rssUrl,
        },
      }),
    ]);

    if (alreadyURLRss || alreadyURLBlog) {
      throw new ConflictException(
        alreadyURLRss
          ? '이미 신청된 RSS URL입니다.'
          : '이미 등록된 RSS URL입니다.',
      );
    }

    await this.rssRepository.insertNewRss(rssRegisterDto);
  }

  async getAllRss() {
    return await this.rssRepository.find();
  }

  async acceptRss(id: number) {
    const rss = await this.rssRepository.findOne({
      where: { id },
    });

    if (!rss) {
      throw new NotFoundException('존재하지 않는 rss 입니다.');
    }

    const blogPlatform = this.identifyPlatformFromRssUrl(rss.rssUrl);

    await this.dataSource.transaction(async (manager) => {
      await Promise.all([
        manager.save(RssAccept.fromRss(rss, blogPlatform)),
        manager.delete(Rss, id),
      ]);
    });
    this.emailService.sendMail(rss, true);
  }

  async rejectRss(id: number, description: string) {
    const rss = await this.rssRepository.findOne({
      where: { id },
    });

    if (!rss) {
      throw new NotFoundException('존재하지 않는 rss 입니다.');
    }

    const result = await this.dataSource.transaction(async (manager) => {
      const [transactionResult] = await Promise.all([
        manager.remove(rss),
        manager.save(RssReject, {
          ...rss,
          description,
        }),
      ]);
      return transactionResult;
    });
    this.emailService.sendMail(result, false, description);
  }

  async acceptRssHistory() {
    return await this.rssAcceptRepository.find({
      order: {
        id: 'DESC',
      },
    });
  }

  async rejectRssHistory() {
    return await this.rssRejectRepository.find({
      order: {
        id: 'DESC',
      },
    });
  }

  private identifyPlatformFromRssUrl(rssUrl: string) {
    type Platform = 'medium' | 'tistory' | 'velog' | 'github' | 'etc';

    const platformRegexp: { [key in Platform]: RegExp } = {
      medium: /^https:\/\/medium\.com/,
      tistory: /^https:\/\/[a-zA-Z0-9\-]+\.tistory\.com/,
      velog: /^https:\/\/v2\.velog\.io/,
      github: /^https:\/\/[\w\-]+\.github\.io/,
      etc: /.*/,
    };

    for (const platform in platformRegexp) {
      if (platformRegexp[platform].test(rssUrl)) {
        return platform;
      }
    }
    return 'etc';
  }
}
