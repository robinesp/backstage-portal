# [Backstage](https://backstage.io)

Backstage App with custom search for GitHub markdown files.
This application provides a way of searching information in a list of Github repositories defined through the app configuration settings.

This logic is implemented in two custom plugins:
- #### `search-backend-module-github-collator`
    A backend module that extends the default Search plugin. It implements a collator that retrieves a list of `.md` files from the selected repositories and indexes their content. These documents are then made available throught the default search interface.
- #### `github-search-result-item`
    A frontend plugin that provides a React component to visualize a Github file as the result of a search. It depends on the Search plugin and it extends the available list-item types, so that all results of type `github` will automatically be shown with the appropriate styling and properties.

### Requisites
- ```node >= 20```
- ```npm >= 10```

### Configuration
The Github search module can be configured by extending `app-config.yaml` as follows:
```yaml
backend:
  search:
    github:
      maxPages: 10
      schedule:
        frequency: { minutes: 30 }
        timeout: { minutes: 3 }
      sources:
        - owner: backstage
          repo: community-plugins
        - owner: backstage
          repo: demo
```
- `maxPages` (optional): when scanning the repositories for markdown files, the requests are paginated. This parameters allows to set a limit on the number of API requests done when initializing the document index.
- `schedule` (optional): defines the schedule of how often the task in charge of indexing the Github documents will run.
- `sources` (optional): the list of repositories that will be scanned for markdown files. This parameter is made optional so that the application will run with no errors if the user does not wish to use the Github search feature.

#### GitHub authentication
Github API imposes quite a strict limit on the number of requests per minute. If you wish to test the application extensively it is recommended to use a Github personal access token, by adding it to the configuration, as authenticated requests have a higher rate limit.

To add secrets to your configuration you can extend the general configuration with a local file `app-config.local.yaml` as follows:
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


### Linting