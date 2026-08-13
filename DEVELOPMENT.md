# Development workflow

Boobstrap uses the same two-stage branch flow in its framework and website repositories:

- `dev` is the shared integration branch.
- `master` is the production and release branch.
- Short-lived feature and agent branches start from `dev` and merge back through pull requests.

## Normal framework work

1. Fetch the latest refs and branch from `origin/dev`.
2. Implement the change on `agent/<description>` or another short-lived feature branch.
3. Build and run the relevant focused tests while iterating.
4. Run `npm test` before requesting merge when the public package or release path changes.
5. Open the pull request against `dev`.
6. After merge, run `npm run framework:sync` in the website repository and submit the resulting `.framework-dev-ref` update to its `dev` branch for hosted integration review.

Do not bump the package version or publish to npm for routine development changes.

## Website integration

The `mikeroq/boobstrap` dev service installs the exact `dev` commit recorded in its `.framework-dev-ref` with npm's Git dependency support.

```bash
npm run framework:dev
```

npm clones that commit, installs this repository's development dependencies, runs the root `prepare` script, and installs the resulting package. Keep `prepare` portable and ensure a clean Git checkout can build the exported `dist` files.

The production website does not use the floating branch. It continues to install the exact npm version in its lockfile.

## Release promotion

Before promotion, review the public compatibility boundary and deprecation procedure in [docs/VERSIONING.md](docs/VERSIONING.md), update [CHANGELOG.md](CHANGELOG.md), and add migration guidance in [docs/MIGRATING.md](docs/MIGRATING.md) when consumer action is required.

1. Freeze framework merges into `dev` and verify CI plus the hosted dev site.
2. Merge framework `dev` into `master` through a pull request.
3. Set the release version, run the full gate, create the matching `v<version>` tag, and invoke the existing publish workflow once.
4. Update the website's `dev` branch to the published version and refresh its lockfile.
5. Verify the website against that immutable package before promoting the website to `master`.
6. Merge `master` back into `dev` in both repositories after release.
