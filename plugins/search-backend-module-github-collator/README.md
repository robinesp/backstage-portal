# @internal/backstage-plugin-search-backend-module-github-collator

The github-collator backend module for the search plugin.

It extends the default search to scan Github repositories for markdown files.

### Configuration
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
      apiToken: <personal-access-token>
```
- `maxPages` (optional): when scanning the repositories for markdown files, the requests are paginated. This parameters allows to set a limit on the number of API requests done when initializing the document index.
- `schedule` (optional): defines the schedule of how often the task in charge of indexing the Github documents will run.
- `sources` (optional): the list of repositories that will be scanned for markdown files. This parameter is made optional so that the application will run with no errors if the user does not wish to use the Github search feature.
- `apiToken` (optional): personal access token to authenticate all requests to the GitHub API and avoid a stricter request rate limit.
