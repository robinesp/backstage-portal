import {
  coreServices,
  createBackendModule,
  readSchedulerServiceTaskScheduleDefinitionFromConfig,
} from '@backstage/backend-plugin-api';
import { searchIndexRegistryExtensionPoint } from '@backstage/plugin-search-backend-node/alpha';
import { SearchGithubCollatorFactory } from '../collators';

/**
 * @public
 * Search backend module for the Github index.
 */
export const searchGithubCollatorModule = createBackendModule({
  pluginId: 'search',
  moduleId: 'github-collator',
  register(env) {
    env.registerInit({
      deps: {
        config: coreServices.rootConfig,
        logger: coreServices.logger,
        discovery: coreServices.discovery,
        scheduler: coreServices.scheduler,
        indexRegistry: searchIndexRegistryExtensionPoint,
      },
      async init({ config, logger, scheduler, indexRegistry }) {
        logger.info('Github collator initialized');
        const githubConfig = config.getConfig('backend.search.github');

        const defaultSchedule = {
          frequency: { minutes: 10 },
          timeout: { minutes: 15 },
          initialDelay: { seconds: 3 },
        };

        const schedule = githubConfig.has('schedule')
          ? readSchedulerServiceTaskScheduleDefinitionFromConfig(
              githubConfig.getConfig('schedule'),
            )
          : defaultSchedule;

        indexRegistry.addCollator({
          schedule: scheduler.createScheduledTaskRunner(schedule),
          factory: SearchGithubCollatorFactory.fromConfig(githubConfig, {
            logger,
          }),
        });
      },
    });
  },
});
