import { createPlugin } from '@backstage/core-plugin-api';
import {
  createSearchResultListItemExtension,
  SearchResultListItemExtensionProps,
} from '@backstage/plugin-search-react';
import { GithubSearchResultListItemProps } from './components';

export const githubSearchResultItemPlugin = createPlugin({
  id: 'github-search-result-item',
});

/**
 * React extension used to render results on Search page or modal
 *
 * @public
 */
export const GithubSearchResultListItem: (
  props: SearchResultListItemExtensionProps<GithubSearchResultListItemProps>,
) => JSX.Element | null = githubSearchResultItemPlugin.provide(
  createSearchResultListItemExtension({
    name: 'GithubSearchResultListItem',
    component: () =>
      import('./components/GithubSearchResultListItem').then(
        m => m.GithubSearchResultListItem,
      ),
    predicate: result => result.type === 'github',
  }),
);
