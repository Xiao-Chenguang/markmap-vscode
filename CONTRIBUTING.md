# Contributing

Thanks for taking a look. This is a small project, so the process is short.

## Before you start

- This is a fork of [markmap-vscode](https://github.com/markmap/markmap-vscode). Bugs that also exist upstream may be better reported there, but fixes are welcome here too.
- For anything larger than a typo, open an issue first so we can agree on the approach.

## Setup

```bash
pnpm i
pnpm build        # lint:fix + clean + rolldown
```

Load the extension in VS Code with <kbd>F5</kbd> (the "Run Extension" launch config), or run the end-to-end suites:

```bash
pnpm build:js
pnpm test:e2e:desktop   # uses the local VS Code
pnpm test:e2e:web       # downloads VS Code for the Web on first run
```

## Conventions

- TypeScript, formatted with `oxfmt` and linted with `oxlint` — `pnpm lint:fix` before committing.
- Keep the diff small. Prefer reusing what `@markmap/*` already provides over writing new helpers.
- User-facing changes go in `CHANGELOG.md` under an "Unreleased" heading.
- New settings must use the `markmapPlus.*` prefix, never `markmap.*` — the latter belongs to the upstream extension.

## Releasing

1. Bump `version` in `package.json` and add the matching `CHANGELOG.md` entry.
2. Commit, then tag: `jj bookmark set main -r @- && jj git push --bookmark main` and push a `v<version>` tag.
3. The `Release` workflow packages the `.vsix`, creates a GitHub release, and publishes to the VS Code Marketplace using the `VSCE_TOKEN` repository secret.

The tag must match `package.json`; the workflow fails otherwise.

## Keeping up with upstream

```bash
jj git fetch --remote upstream
jj log -r 'master@upstream & ~::@'   # what upstream has that we do not
```

Cherry-pick what matters with `jj duplicate` / `jj rebase`, or reimplement it if the upstream rewrite touched the same files.
