import React from 'react';
import { renderInTestApp } from '@backstage/test-utils';
import { GithubSearchResultListItem } from './GithubSearchResultListItem';

const validResult = {
  location: 'https://github.com/backstage/demo/blob/master/README.md',
  title: 'README.md',
  text: 'This repository is the source code for the demo Backstage instance deployed to demo.backstage.io.',
  kind: 'github',
  namespace: '',
  name: 'README.md',
  lifecycle: 'production',
  path: '/README.md',
  repository: 'backstage/demo',
};

describe('GithubSearchResultListItem', () => {
  it('should render github doc passed in', async () => {
    const { findByText } = await renderInTestApp(
      <GithubSearchResultListItem result={validResult} />,
    );

    expect(await findByText(validResult.title)).toBeInTheDocument();

    expect(await findByText(validResult.text)).toBeInTheDocument();
  });
});
