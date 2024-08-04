# [Backstage](https://backstage.io)

Backstage App with custom search for GitHub markdown files.
This application provides a way of searching information in a list of Github repositories defined through the app configuration settings.

This logic is implemented in two custom plugins:

- #### `search-backend-module-github-collator`
  A backend module that extends the default Search plugin. It implements a collator that retrieves a list of `.md` files from the selected repositories and indexes their content. These documents are then made available throught the default search interface.
- #### `github-search-result-item`
  A frontend plugin that provides a React component to visualize a Github file as the result of a search. It depends on the Search plugin and it extends the available list-item types, so that all results of type `github` will automatically be shown with the appropriate styling and properties.

### Requisites

- `node >= 20`

### Configuration

The Github search module can be configured by extending `app-config.yaml` as follows:

```yaml
backend:
  search:
    github:
      sources:
        - owner: backstage
          repo: community-plugins
        - owner: backstage
          repo: demo
      baseUrl: 'https://api.github.com'
      maxPages: 10
      schedule:
        frequency: { minutes: 30 }
        timeout: { minutes: 3 }
```

- `sources` (required): the list of repositories that will be scanned for markdown files. This parameter is technically optional in the code, so that the application will run with no errors in any case, but the Github search feature only makes sense when sources are specified.
- `baseUrl` (optional): the base URL for REST API request to GitHub, defaults to `https://api.github.com` if not provided.
- `maxPages` (optional): when scanning the repositories for markdown files, the requests are paginated. This parameters allows to set a limit on the number of API requests done when initializing the document index.
- `schedule` (optional): defines the schedule of how often the task in charge of indexing the Github documents will run.

#### GitHub authentication

Due to this [change](https://github.blog/changelog/2023-03-10-changes-to-the-code-search-api/) in the GitHub API, all requests to search repositories now need to be authenticated. Therefore it is necessary to add a GitHub personal access token to the configuration.

To add secrets to your configuration it is recommended to extend the general configuration with a local file `app-config.local.yaml`:

```yaml
backend:
  search:
    github:
      apiToken: <personal-access-token>
```

### Running the app

```sh
yarn install
yarn dev
```

### Testing

Unit testing suits are implemented for both the backend collator plugin and the frontend component rendering. To run the tests:

```sh
yarn test
yarn test:all # also returns code coverage
```

### Linting and code styling

```sh
yarn lint:all
yarn prettier:check
```
