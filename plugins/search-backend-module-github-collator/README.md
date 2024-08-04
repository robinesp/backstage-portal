# @internal/backstage-plugin-search-backend-module-github-collator

The github-collator backend module for the search plugin.

It extends the default search to scan Github repositories for markdown files.

### Configuration

For more information about the module configuration see [here](/README.md)

```yaml
backend:
  search:
    github:
      apiToken: <personal-access-token>
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
