# TypeScript + Yarn Workspace + Lerna Monorepo Boilerplate

Feel free to make issues for any questions or suggestions.

## Lerna + Yarn Workspace

Lerna respects and and delegates monorepo management to yarn workspace, by `'useWorkspaces': true` in [lerna.json](lerna.json). But Lerna is still useful, as it provides utility commands for monorepo workflow (e.g. selective subpackge script execution, versioning, or package publishing).

## Typescript

[Project references](https://www.typescriptlang.org/docs/handbook/project-references.html), and [path mapping](https://www.typescriptlang.org/docs/handbook/module-resolution.html#path-mapping) is used.

## Jest

[ts-jest](https://github.com/kulshekhar/ts-jest) is used.

## Dev

[ts-node-dev](https://github.com/whitecolor/ts-node-dev) is used for `yarn dev`.

## Notes

This project has two packages, `foo`(`@jjangga0214/foo`) and `bar`(`@jjangga0214/bar`). `bar` depends on `foo`.

### tsconfig

1. VSCode only respects `tsconfig.json` as of writing (until [vscode/#12463](https://github.com/microsoft/vscode/issues/12463) is resolved.). Therefore, build-specific configurations (e.g. `include`, `exclude`, `rootDir`, etc) are in `tsconfig.build.json`. If you replace `tsconfig.build.json` by `tsconfig.json`, project workflow will still work (e.g. `compilation`, `yarn dev`, `test`), but VSCode will not help you by its feature, like `type checking`, or `go to definition`, etc.

2. `yarn build` in each package executes `tsc -b tsconfig.build.json`, not `tsc -p tsconfig.build.json`. This is to use typescript's **project reference** feature. For example, `yarn build` under `bar` builds itself and its dependancy, `foo` (More specifically, `foo` is compiled before `bar` is compiled). And this fits well with `--incremental` option specified in `tsconfig.json`, as build cache can be reused if `foo` (or even `bar`) was already compiled before.

3. Look at `packages/bar/tsconfig.build.json`. It explicitly refers `../foo/tsconfig.build.json`. Thus, `tsc -b tsconfig.build.json` under `bar` will use `packages/foo/tsconfig.build.json` to build `foo`.

4. Each packages has their own `tsconfig.json`. That's because `ts-node-dev --project ../../tsconfig.json -r tsconfig-paths/register src/index.ts` will not find paths mapping, although `../../tsconfig.json` is given to `ts-node-dev` (env var `TS_NODE_PROJECT` will not work, either).

### Module aliases and path mappings

<!-- markdownlint-disable no-duplicate-heading -->

#### Dev

<!-- markdownlint-enable no-duplicate-heading -->

For `ts-node-dev` to understand **path mapping**, [`tsconfig-paths`](https://github.com/dividab/tsconfig-paths) is used.

<!-- markdownlint-disable no-duplicate-heading -->

#### Typescript

<!-- markdownlint-enable no-duplicate-heading -->

`tsconfig.json` has this path mappings configuration.

<!-- eslint-skip -->

```js
{
  "baseUrl": "packages",
  "paths": {
    "@jjangga0214/*": ["*/src"], // e.g. `@jjangga0214/foo` -> `foo/src`
    "~foo/*": ["foo/src/*"], // e.g. `~foo/hello` -> `foo/src/hello.ts`
    "~bar/*": ["bar/src/*"],
    "~*": ["*/src"] // e.g. `~foo` -> `foo/src`
  }
}
```

`@jjangga0214/foo` and `@jjangga0214/bar` are only used for cross package references. For example, `bar` imports `@jjangga0214/foo` in its `src/index.ts`.

However, `~foo` and `~bar` are only used for package's interal use. For example, `foo/src/index.ts` imports `~foo/hello`, which is same as `./hello`. This can be useful for a package with deep and wide directory tree, as an absolute path can be used. For example, `foo/src/your/very/deep/module/index.ts` can import `~foo/another/deeper/module/index` instead of `../../../../another/deeper/module/index`.

But be careful of `paths` orders for precedence. If the order changes, like the below, `~foo/hello` will be resolved to `foo/hello/src`, not `foo/src/hello`.

<!-- eslint-skip -->

```js
{
  "baseUrl": "packages",
  "paths": {
    "~*": ["*/src"],
    "~foo/*": ["foo/src/*"], // => this will not work!
    "~bar/*": ["bar/src/*"] // => this will not work!
  }
}
```

Note that `bar` must not import `~foo`, `~foo/hello`, causing errors (I'm pretty sure there's no reason to do that). But importing `@jjangga0214/foo/hello` in `bar` makes sense in some cases. For that, you should explicitly add additaional configuration like this.

<!-- eslint-skip -->

```js
{
  "baseUrl": "packages",
  "paths": {
    "@jjangga0214/*": ["*/src"],
+   "@jjangga0214/foo/*": ["foo/src/*"], // => this one!
    // ... other paths
  }
}
```

#### Module aliases (Subpath imports) for node.js at runtime

[Subpath imports](https://nodejs.org/api/packages.html#packages_subpath_imports) is added in v14.6.0 and v12.19.0.

Though `#foo` or `#bar` will be resolved when `yarn dev` thanks to `tsconfig-paths` and just to be compiled well, they will throw an Error(`Module Not Found`) at runtime. That's where [`subpath imports`](https://nodejs.org/api/packages.html#packages_subpath_imports) comes in.

`subpath imports` is added in nodejs v14.6.0 and v12.19.0.
Thus, there is `engines` condition in package.json

```jsonc
// package.json
{
  "engines": {
    "node": ">=14.6.0"
  }
}
```

<!-- markdownlint-disable no-duplicate-heading -->

#### Jest

<!-- markdownlint-enable no-duplicate-heading -->

Jest respects **path mapping** by automatically reading `tsconfig.json` and configuring `moduleNameMapper`. This is done by `ts-jest/utils`. See how `moduleNameMapper` is handeled in `jest.config.js` and refer to [docs](https://kulshekhar.github.io/ts-jest/user/config/#paths-mapping) for more details.

### Lint and Formatter

`eslint` and `prettier` is used along each other. `eslint-config-airbnb-base` (not `eslint-config-airbnb`, which includes `jsx` rules) is used as well. [`eslint-plugin-jest`](https://github.com/jest-community/eslint-plugin-jest/issues) and [`eslint-plugin-markdown`](https://github.com/eslint/eslint-plugin-markdown) (not for markdown itself, but for code block snippet appeared in markdown) are also configured.

By configuring `overrides` in `.eslintrc.js`, both of typescript and javascript files are able to be linted by `eslint`. (e.g. So typescript rules are not applied to `.js` files.)

[`markdownlint`](https://github.com/DavidAnson/markdownlint) is configured by [`markdownlint-cli`](https://github.com/igorshubovych/markdownlint-cli#readme).

[`commitlint`](https://github.com/conventional-changelog/commitlint) is used as commit message linter. You can `yarn lint:md .`, for example. Refer to [conventional commits](https://www.conventionalcommits.org/en/) for more details.

### Git Hooks

`Husky` executes `lint-staged` and `commitlint` by git hooks. `lint-staged` makes sure staged files are to be formatted before committed. Refer to `package.json` for details.

## Root commands

Introducing some of commands specified in `package.json`. Refer to `package.json` for the full list.

```bash
# remove compiled js folders, typescript build info, jest cache, *.log, and test coverage
yarn clean

# measure a single test coverage of entire packages
yarn coverage

# open web browser to show test coverage report.
# run this AFTER running `yarn coverage`,
# to make it sure there are reports before showing them.
yarn coverage:show

# lint code (ts, js, and js snippets on markdown)
# e.g. yarn lint .
yarn lint <path>

# lint markdown
yarn lint:md <path>
```
