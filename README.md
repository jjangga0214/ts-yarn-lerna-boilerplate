# TypeScript + Yarn Workspace + Lerna Monorepo Boilerplate

Feel free to make issues for any questions or suggestions.

## Lerna + Yarn Workspace

Lerna respects and and delegates monorepo management to yarn workspace, by `'useWorkspaces': true` in [lerna.json](lerna.json). But Lerna is still useful, as it provides utility commands for monorepo workflow (e.g. selective subpackge script execution, versioning, or package publishing).

## Typescript

[**Project References**](https://www.typescriptlang.org/docs/handbook/project-references.html), and [**Path Mapping**](https://www.typescriptlang.org/docs/handbook/module-resolution.html#path-mapping) is used.

## Jest

[`ts-jest`](https://github.com/kulshekhar/ts-jest) is used.

## Dev

[`ts-node-dev`](https://github.com/whitecolor/ts-node-dev) is used for `yarn dev`.
You can replace it to [`ts-node`](https://github.com/TypeStrong/ts-node) is if you don't need features of [`node-dev`](https://github.com/fgnass/node-dev).

In developerment environment, fast execution by rapid compiling is required.
So, `ts-node` is configured to use [`swc`](https://swc.rs/) internally.
(Refer to the [official docs](https://typestrong.org/ts-node/docs/transpilers#bundled-swc-integration))

```jsonc
{
  "ts-node": {
    "transpileOnly": true,
    "transpiler": "ts-node/transpilers/swc-experimental"
    // ... other options
  }
}
```

That's why `@swc/core` and `@swc/helpers` are also installed.

## Notes

This project has two packages, `foo`(`@jjangga0214/foo`) and `bar`(`@jjangga0214/bar`). `bar` depends on `foo`.

### tsconfig

1. VSCode only respects `tsconfig.json` as of writing (until [vscode/#12463](https://github.com/microsoft/vscode/issues/12463) is resolved.). Other IDEs may have similar policy/restriction. Therefore, build-specific configurations (e.g. `include`, `exclude`, `rootDir`, etc) are in `tsconfig.build.json`. If you replace `tsconfig.build.json` by `tsconfig.json`, project workflow will still work (e.g. `compilation`, `yarn dev`, `test`), but VSCode will not help you by its feature, like `type checking`, or `go to definition`, etc.

1. `yarn build` in each package executes `tsc -b tsconfig.build.json`, not `tsc -p tsconfig.build.json`. This is to use typescript's **Project Reference** feature. For example, `yarn build` under `bar` builds itself and its dependancy, `foo` (More specifically, `foo` is compiled before `bar` is compiled). Look at `packages/bar/tsconfig.build.json`. It explicitly refers `../foo/tsconfig.build.json`. Thus, `tsc -b tsconfig.build.json` under `bar` will use `packages/foo/tsconfig.build.json` to build `foo`. And this fits well with `--incremental` option specified in `tsconfig.json`, as build cache can be reused if `foo` (or even `bar`) was already compiled before.

1. Each packages has their own `tsconfig.json`. That's because `ts-node-dev --project ../../tsconfig.json -r tsconfig-paths/register src/index.ts` will not find paths mapping, although `../../tsconfig.json` is given to `ts-node-dev` (env var `TS_NODE_PROJECT` will not work, either).

### Module aliases and **Path Mappings**

#### **Subpath Imports** for node.js

There are several _3rd party_ solutions that resolves modules aliases.

1. Runtime mapper: [`module-alias`](https://www.npmjs.com/package/module-alias), [`link-module-alias`](https://www.npmjs.com/package/link-module-alias), etc
1. Transpiler/bundler: Babel plugins, Rollup, Webpack, etc
1. Post-compile-processor: [`tsc-alias`](https://github.com/justkey007/tsc-alias)

However, from node v14.6.0 and v12.19.0, node introduced a new **native** support for it, named [**Subpath Imports**](https://nodejs.org/api/packages.html#packages_subpath_imports).
It enables specifying alias path in package.json and requires prefixing an alias by `#`.

This repo uses Subpath Import.

There is `engines` restriction in package.json, as `subpath imports` is added from nodejs v14.6.0 and v12.19.0.

```jsonc
// package.json
{
  "engines": {
    "node": ">=14.6.0"
  }
}
```

If you nodejs version does not fit in, you can consider _3rd party_ options.

<!-- markdownlint-disable no-duplicate-heading -->

#### Typescript

<!-- markdownlint-enable no-duplicate-heading -->

Though we can avoid a runtime error(`Module Not Found`) for module alias resolution, compiling typescript is stil a differenct matter.
Fot tsc, `tsconfig.json` has this path mappings configuration.

```jsonc
{
  "baseUrl": "packages",
  "paths": {
    "@jjangga0214/*": ["*/src"], // e.g. `@jjangga0214/foo` -> `foo/src`
    "#foo/*": ["foo/src/*"], // e.g. `#foo/hello` -> `foo/src/hello.ts`
    "#bar/*": ["bar/src/*"],
    "#*": ["*/src"] // e.g. `#foo` -> `foo/src`
  }
}
```

`@jjangga0214/foo` and `@jjangga0214/bar` are only used for cross package references. For example, `bar` imports `@jjangga0214/foo` in its `src/index.ts`.

However, `#foo` and `#bar` are only used for package's interal use. For example, `foo/src/index.ts` imports `#foo/hello`, which is same as `./hello`. This can be useful for a package with deep and wide directory tree, as an absolute path can be used. For example, `foo/src/your/very/deep/module/index.ts` can import `#foo/another/deeper/module/index` instead of `../../../../another/deeper/module/index`.

But be careful of `paths` orders for precedence. If the order changes, like the below, `#foo/hello` will be resolved to `foo/hello/src`, not `foo/src/hello`.

```jsonc
{
  "baseUrl": "packages",
  "paths": {
    "#*": ["*/src"],
    "#foo/*": ["foo/src/*"], // => this will not work!
    "#bar/*": ["bar/src/*"] // => this will not work!
  }
}
```

Note that `bar` must NOT import `#foo`, `#foo/hello`, causing errors (I'm pretty sure there's no reason to do that). But importing `@jjangga0214/foo/hello` in `bar` makes sense in some cases. For that, you should explicitly add additaional configuration like this.

```jsonc
{
  "baseUrl": "packages",
  "paths": {
    "@jjangga0214/*": ["*/src"],
+   "@jjangga0214/foo/*": ["foo/src/*"], // => this one!
    // ... other paths
  }
}
```

<!-- markdownlint-disable no-duplicate-heading -->

#### Dev

<!-- markdownlint-enable no-duplicate-heading -->

For `ts-node-dev`(or `ts-node`) to understand **Path Mapping**, [`tsconfig-paths`](https://github.com/dividab/tsconfig-paths) is used.

```jsonc
{
  "ts-node": {
    "require": ["tsconfig-paths/register"]
    // other options
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
