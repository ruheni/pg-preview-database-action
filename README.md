# PostgreSQL Preview Database Action

<a href="https://github.com/actions/typescript-action/actions"><img alt="typescript-action status" src="https://github.com/actions/typescript-action/workflows/build-test/badge.svg"></a>

GitHub action responsible for creating and deleting Preview PostgreSQL databases for your Pull Requests.

The GitHub action is run on the following pull request events:
- `opened`/ `reopened` — to provision a preview database
- `closed` — to de-provision a preview database


## Prerequisites

A database server with user with privileges for creating & deleting other database. Ensure you set up the database server as secret/variable on your repository — [GitHub docs](https://docs.github.com/en/actions/learn-github-actions/variables).

## Set up the action

```yaml
name: "Provision"
on:
  pull_request:
    types: [opened, reopened, closed] # set the type of events for when the action should be triggered

jobs:
  provision-preview-database: 
    runs-on: ubuntu-latest
    steps:
      
      - uses: actions/checkout@v3
      - uses: ruheni/pg-preview-database-action@v1
        with:
          PREVIEW_DB_SERVER: ${{ secrets.PREVIEW_DB_SERVER }}
```

``


## Running locally

Install the dependencies  
```bash
$ npm install

```

Build the typescript and package it for distribution

```bash
npm run build && npm run package
```

Run the tests :heavy_check_mark:  
```bash
npm test

 PASS  ./index.test.js
  ✓ throws invalid number (3ms)
  ✓ wait 500 ms (504ms)
  ✓ test runs (95ms)

...
```



### Publishing

Actions are run from GitHub repos so we will checkin the packed dist folder. 

Then run [ncc](https://github.com/zeit/ncc) and push the results:
```bash
npm run package
git add dist
git commit -a -m "prod dependencies"
```

Note: We recommend using the `--license` option for ncc, which will create a license file for all of the production node modules used in your project.

Your action is now published! :rocket: 

See the [versioning documentation](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)

### Validate

You can now validate the action by referencing `./` in a workflow in your repo (see [test.yml](.github/workflows/test.yml))

```yaml
uses: ./
with:
  PREVIEW_DB_URL: *****
```

See the [actions tab](https://github.com/actions/typescript-action/actions) for runs of this action! :rocket:

### Usage:

After testing you can [create a v1 tag](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md) to reference the stable and latest V1 action
