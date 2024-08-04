import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import { searchIndexRegistryExtensionPoint } from '@backstage/plugin-search-backend-node/alpha';
import { searchGithubCollatorModule } from './SearchGithubCollatorModule';

describe('searchGithubCollatorModule', () => {
  const schedule = {
    frequency: { minutes: 10 },
    timeout: { minutes: 15 },
    initialDelay: { seconds: 3 },
  };

  it('should register the github collator to the search index registry extension point with factory and schedule', async () => {
    const extensionPointMock = {
      addCollator: jest.fn(),
    };

    await startTestBackend({
      extensionPoints: [
        [searchIndexRegistryExtensionPoint, extensionPointMock],
      ],
      features: [
        searchGithubCollatorModule,
        mockServices.rootConfig.factory({
          data: {
            backend: {
              search: {
                github: {
                  sources: [{ owner: 'backstage', repo: 'demo' }],
                  schedule,
                },
              },
            },
          },
        }),
      ],
    });

    expect(extensionPointMock.addCollator).toHaveBeenCalledTimes(1);
    expect(extensionPointMock.addCollator).toHaveBeenCalledWith({
      factory: expect.objectContaining({ type: 'github' }),
      schedule: expect.objectContaining({ run: expect.any(Function) }),
    });
  });
});
