import {
  DocumentCollatorFactory,
  IndexableDocument,
} from '@backstage/plugin-search-common';
import { Config } from '@backstage/config';
import { Readable } from 'stream';
import { LoggerService } from '@backstage/backend-plugin-api';

type GithubFile = {
  name: string;
  path: string;
  url: string;
};

type GithubRepo = {
  owner: string;
  repo: string;
};

interface GithubDocument extends IndexableDocument {
  path: string;
  repository: string;
}

/**
 * Options for {@link GithubFilesCollatorFactory}
 *
 * @public
 */
export type GithubQuestionsCollatorFactoryOptions = {
  sources?: GithubRepo[];
  baseUrl?: string;
  apiToken?: string;
  maxPages?: number;
  logger: LoggerService;
};

/**
 * Search collator responsible for collecting Github markdown files to index.
 *
 * @public
 */
export class GithubFilesCollatorFactory implements DocumentCollatorFactory {
  private readonly sources: GithubRepo[] | undefined;
  private readonly baseUrl: string | undefined;
  private readonly apiToken: string | undefined;
  private readonly maxPages: number | undefined;
  private readonly logger: LoggerService;
  public readonly type: string = 'github';

  private constructor(options: GithubQuestionsCollatorFactoryOptions) {
    this.sources = options.sources;
    this.baseUrl = options.baseUrl;
    this.apiToken = options.apiToken;
    this.maxPages = options.maxPages;
    this.logger = options.logger.child({ documentType: this.type });
  }

  static fromConfig(
    config: Config,
    options: GithubQuestionsCollatorFactoryOptions,
  ) {
    const sources =
      config.getOptionalConfigArray('sources')?.map(source => ({
        owner: source.getString('owner'),
        repo: source.getString('repo'),
      })) || [];
    const apiToken = config.getOptionalString('apiToken');
    const maxPages = config.getOptionalNumber('maxPages') || 100;
    const baseUrl =
      config.getOptionalString('baseUrl') || 'https://api.github.com';

    return new GithubFilesCollatorFactory({
      ...options,
      baseUrl,
      apiToken,
      maxPages,
      sources,
    });
  }

  async getCollator() {
    return Readable.from(this.execute());
  }

  /**
   * For each Github source listed in the configuration scan the repository for .md files
   *
   */
  async *execute(): AsyncGenerator<GithubDocument> {
    // If a Github token is provided, use it to authenticate all API requests
    const headers: HeadersInit = {};
    if (this.apiToken) headers.Authorization = `token ${this.apiToken}`;

    for (const source of this.sources!) {
      // Paginate request until end or max pages is reached
      let hasMorePages = true;
      let page = 1;

      while (hasMorePages) {
        if (page === this.maxPages) {
          this.logger.warn(
            `The limit of ${this.maxPages} requests to the Github API has been reached`,
          );
          break;
        }
        // Retrieve all .md files in the repository
        const res = await fetch(
          `${this.baseUrl}/search/code?q=extension:md+repo:${source.owner}/${source.repo}&page=${page}`,
          { headers },
        );

        if (res.status === 403) {
          this.logger.warn(
            'Github API rate limit exceeded - use authenticated request to get a higher rate limit',
          );
          return;
        }

        const result = await res.json();
        const files: GithubFile[] = result.items;

        // For each .md file, retrieve content and add it to the index
        for (const file of files) {
          const fileRes = await fetch(file.url, {
            headers: {
              ...headers,
              Accept: 'application/vnd.github.raw+json',
            },
          });
          const fileContent = await fileRes.text();

          yield {
            title: file.name,
            location: file.url,
            text: fileContent,
            path: file.path,
            repository: `${source.owner}/${source.repo}`,
          };
        }

        hasMorePages = result.incomplete_results;
        page++;
      }
    }
  }
}
