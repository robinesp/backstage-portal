import {
  mockServices,
  registerMswTestHooks,
} from '@backstage/backend-test-utils';
import { TestPipeline } from '@backstage/plugin-search-backend-node';
import { ConfigReader } from '@backstage/config';
import { Readable } from 'stream';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import {
  GithubFile,
  SearchGithubCollatorFactory,
  GithubQuestionsCollatorFactoryOptions,
} from './SearchGithubCollatorFactory';

const logger = mockServices.logger.mock();

const mockDocuments: { items: GithubFile[]; incomplete_results: boolean } = {
  items: [
    {
      name: 'README.md',
      path: '/README.md',
      url: 'https://github.com/backstage/demo/blob/master/README.md',
      html_url: 'https://github.com/backstage/demo/blob/master/README.md',
    },
  ],
  incomplete_results: false,
};

const mockFileContent =
  'This repository is the source code for the demo Backstage instance deployed to demo.backstage.io.';

describe('GithubFilesCollatorFactory', () => {
  const config = new ConfigReader({
    apiToken: 'token',
    maxPages: 10,
    schedule: {
      frequency: { minutes: 30 },
      timeout: { minutes: 3 },
    },
    sources: [
      {
        owner: 'backstage',
        repo: 'demo',
      },
    ],
  });

  const defaultOptions: GithubQuestionsCollatorFactoryOptions = {
    logger,
  };

  it('has expected type', () => {
    const factory = SearchGithubCollatorFactory.fromConfig(
      config,
      defaultOptions,
    );
    expect(factory.type).toBe('github');
  });

  describe('getCollator', () => {
    const worker = setupServer();
    registerMswTestHooks(worker);

    it('returns a readable stream', async () => {
      const factory = SearchGithubCollatorFactory.fromConfig(
        config,
        defaultOptions,
      );
      const collator = await factory.getCollator();
      expect(collator).toBeInstanceOf(Readable);
    });

    it('fetches from the configured endpoints', async () => {
      worker.use(
        rest.get('https://api.github.com/search/code', (_, res, ctx) =>
          res(ctx.status(200), ctx.json(mockDocuments)),
        ),
        rest.get(mockDocuments.items[0].url, (_, res, ctx) =>
          res(ctx.status(200), ctx.json(mockFileContent)),
        ),
      );
      const factory = SearchGithubCollatorFactory.fromConfig(
        config,
        defaultOptions,
      );
      const collator = await factory.getCollator();
      const pipeline = TestPipeline.fromCollator(collator);
      const { documents } = await pipeline.execute();

      expect(documents).toHaveLength(mockDocuments.items.length);
    });

    it('fetches from the overridden endpoint', async () => {
      worker.use(
        rest.get('http://api.github.override/search/code', (_, res, ctx) =>
          res(ctx.status(200), ctx.json(mockDocuments)),
        ),
        rest.get(mockDocuments.items[0].url, (_, res, ctx) =>
          res(ctx.status(200), ctx.json(mockFileContent)),
        ),
      );
      const factory = SearchGithubCollatorFactory.fromConfig(config, {
        logger,
        baseUrl: 'http://api.github.override',
      });
      const collator = await factory.getCollator();

      const pipeline = TestPipeline.fromCollator(collator);
      const { documents } = await pipeline.execute();

      expect(documents).toHaveLength(mockDocuments.items.length);
    });

    it('does not retrieve any documents when not authenticated', async () => {
      const noAuthConfig = new ConfigReader({
        sources: [
          {
            owner: 'backstage',
            repo: 'demo',
          },
        ],
      });

      worker.use(
        rest.get('https://api.github.com/search/code', (_, res, ctx) =>
          res(ctx.status(200), ctx.json(mockDocuments)),
        ),
        rest.get(mockDocuments.items[0].url, (_, res, ctx) =>
          res(ctx.status(200), ctx.json(mockFileContent)),
        ),
      );
      const factory = SearchGithubCollatorFactory.fromConfig(noAuthConfig, {
        logger,
      });
      const collator = await factory.getCollator();

      const pipeline = TestPipeline.fromCollator(collator);
      const { documents } = await pipeline.execute();

      expect(documents).toHaveLength(0);
    });
  });
});
