import {
  DocumentCollatorFactory,
  IndexableDocument,
} from '@backstage/plugin-search-common';
import { Config } from '@backstage/config';
import { Readable } from 'stream';
import { LoggerService } from '@backstage/backend-plugin-api';

export type GithubFile = {
  name: string;
  path: string;
  url: string;
  html_url: string;
};

type GithubRepo = {
  owner: string;
  repo: string;
};

export interface GithubDocument extends IndexableDocument {
  path: string;
  repository: string;
}

/**
 * Options for {@link SearchGithubCollatorFactory}
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
export class SearchGithubCollatorFactory implements DocumentCollatorFactory {
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
    if (!config.has('apiToken')) {
      options.logger.error('Missing required Github API token');
    }

    const sources =
      config.getOptionalConfigArray('sources')?.map(source => ({
        owner: source.getString('owner'),
        repo: source.getString('repo'),
      })) || [];
    const baseUrl =
      config.getOptionalString('baseUrl') || 'https://api.github.com';
    const apiToken = config.getOptionalString('apiToken');
    const maxPages = config.getOptionalNumber('maxPages') || 100;

    return new SearchGithubCollatorFactory({
      baseUrl,
      apiToken,
      maxPages,
      sources,
      ...options,
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
    if (!this.apiToken) {
      this.logger.warn(
        'Github API token is missing - no documents will be indexed',
      );
      return;
    }
    const headers: HeadersInit = { Authorization: `token ${this.apiToken}` };

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
          this.logger.warn('Github API rate limit exceeded');
          return;
        }

        if (res.status === 401) {
          this.logger.warn('Github API - unauthorized request');
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
            location: file.html_url,
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
