# TypeScript + Yarn Workspace + Lerna + Jest Monorepo Boilerplate

[![license](https://img.shields.io/badge/license-MIT-ff4081.svg?style=flat-square&labelColor=black)](./LICENSE)
[![test](https://img.shields.io/badge/test-jest-7c4dff.svg?style=flat-square&labelColor=black)](./jest.config.js)
[![code style:airbnb](https://img.shields.io/badge/code_style-airbnb-448aff.svg?style=flat-square&labelColor=black)](https://github.com/airbnb/javascript)
[![code style:prettier](https://img.shields.io/badge/code_style-prettier-18ffff.svg?style=flat-square&labelColor=black)](https://prettier.io/)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-ffab00.svg?style=flat-square&labelColor=black)](https://conventionalcommits.org)
[![Commitizen friendly](https://img.shields.io/badge/Commitizen-cz_conventional_changelog-dd2c00.svg?style=flat-square&labelColor=black)](http://commitizen.github.io/cz-cli/)
![pr welcome](https://img.shields.io/badge/PRs-welcome-09FF33.svg?style=flat-square&labelColor=black)

An example monorepo boilerplate for nodejs.

This works well, and I've been carefully maintained it.

Just clone this! Then read and compare with README.

You'd grasp how this repo works.

Feel free to make issues for any questions or suggestions.

## Scenario

This project has two packages, `foo`(`@jjangga0214/foo`) and `bar`(`@jjangga0214/bar`). `bar` depends on `foo`.

## Lerna + Yarn Workspace

Lerna respects and and delegates monorepo management to yarn workspace, by `'useWorkspaces': true` in [lerna.json](lerna.json). But Lerna is still useful, as it provides utility commands for monorepo workflow (e.g. selective subpackge script execution, versioning, or package publishing).

## Module Aliases

There're' some cases module alias becomes useful.

1. A package with a deep and wide directory tree: For example, let's say `foo/src/your/very/deep/module/index.ts` imports `../../../../another/deep/module/index`. In this case, absolute path from the root(e.g. alias `#foo` -> `foo/src`) like `#foo/another/deep/module/index` can be more concise and maintainable.

1. Dependency not located in node_modules: This can happen in monorepo. For instance, `@jjangga0214/bar` depends on `@jjangga0214/foo`, but the dependancy does not exist in node_modules, but in `packages/foo` directory. In this case, creating an alias(`@jjangga0214/foo` -> `packages/foo/src`(ts: Path Mapping)) is needed.

(There is another case (e.g. "exporting" alias), but I'd like to omit them as not needed in this context.)

### Node.js: [**Subpath Imports**](https://nodejs.org/api/packages.html#packages_subpath_imports)

There are several _3rd party_ solutions that resolves modules aliases.

1. Runtime mapper: [`module-alias`](https://www.npmjs.com/package/module-alias), etc.
1. Symlink: [`link-module-alias`](https://www.npmjs.com/package/link-module-alias), etc.
1. Transpiler/bundler: Babel plugins, Rollup, Webpack, etc.
1. Post-compile-processor: [`tsc-alias`](https://github.com/justkey007/tsc-alias), etc.

However, from node v14.6.0 and v12.19.0, node introduced a new **native** support for it, named [**Subpath Imports**](https://nodejs.org/api/packages.html#packages_subpath_imports).
It enables specifying alias path in package.json.
It requires prefixing an alias by `#`.

This repo uses **Subpath Import**.

**`foo`'s package.json**:

```jsonc
{
  "name": "@jjangga0214/foo",
  "imports": {
    "#foo/*": {
      "default": "./dist/*.js"
    }
  }
}
```

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

### Typescript: [**Path Mapping**](https://www.typescriptlang.org/docs/handbook/module-resolution.html#path-mapping)

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

`@jjangga0214/foo` and `@jjangga0214/bar` are only used for cross-package references. For example, `bar` imports `@jjangga0214/foo` in its `src/index.ts`.

However, `#foo` and `#bar` are only used for package's interal use. For example, `foo/src/index.ts` imports `#foo/hello`, which is same as `./hello`.

Note that `bar` must NOT import `#foo` or `#foo/hello`, causing errors. I'm pretty sure there's no reason to do that as prefixing `#` is only for package's internal use, not for exporting in this scenario.

But importing `@jjangga0214/foo/hello` in `bar` makes sense in some cases. For that, you should explicitly add additaional configuration like this.

```jsonc
{
  "baseUrl": "packages",
  "paths": {
    "@jjangga0214/*": ["*/src"],
+   "@jjangga0214/foo/*": ["foo/src/*"], // => this one!
    // Other paths are ommitted for brevity
  }
}
```

Be careful of `paths` orders for precedence. If the order changes, like the below, `#foo/hello` will be resolved to `foo/hello/src`, not `foo/src/hello`.

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

## Dev

[`ts-node-dev`](https://github.com/whitecolor/ts-node-dev) is used for `yarn dev`.
You can replace it to [`ts-node`](https://github.com/TypeStrong/ts-node) if you don't need features of [`node-dev`](https://github.com/fgnass/node-dev).

For `ts-node-dev`(or `ts-node`) to understand **Path Mapping**, [`tsconfig-paths`](https://github.com/dividab/tsconfig-paths) is used.

**tsconfig.json**:

```jsonc
{
  "ts-node": {
    "require": ["tsconfig-paths/register"]
    // Other options are ommitted for brevity
  }
}
```

Until [wclr/ts-node-dev#286](https://github.com/wclr/ts-node-dev/issues/286) is resolved, `"ts-node"` field in **tsconfig.json** will be ignored by `ts-node-dev`. Thus it should be given by command options (e.g `-r` below.). This is not needed if you only use `ts-node`, not `ts-node-dev`.

**Each packages' package.json**:

```jsonc
{
  "scripts": {
    "dev": "ts-node-dev -r tsconfig-paths/register src/index.ts"
  }
  // Other options are ommitted for brevity.
}
```

### Extraneous Configuration

In developerment environment, fast execution by rapid compilation is useful.
`ts-node` is configured to use [`swc`](https://swc.rs/) internally.
(Refer to the [official docs](https://typestrong.org/ts-node/docs/transpilers#bundled-swc-integration) -> That's why `@swc/core` and `@swc/helpers` are installed.)

**tsconfig.json**:

```jsonc
{
  "ts-node": {
    "transpileOnly": true,
    "transpiler": "ts-node/transpilers/swc-experimental"
    // Other options are ommitted for brevity
  }
}
```

## Typescript: tsconfig

1. VSCode only respects `tsconfig.json` (which can be multiple files) as of writing (until [vscode/#12463](https://github.com/microsoft/vscode/issues/12463) is resolved.). Other IDEs may have similar policy/restriction. In monorepo, as build-specific configurations (e.g. `include`, `exclude`, `rootDir`, etc) are package-specific, they should be seperated from the `tsconfig.json`. Otherwise, VSCode would not help you by its feature, like `type checking`, or `go to definition`, etc. For instance, it'd be inconvenient to work on `foo`'s API in `bar`'s code. To resolve this, build-specific configuration options are located in `tsconfig.build.json`. (But keep in note that compilation would always work flawlessly even if you only have `tsconfig.json` and let build-related options in there. The only problem in that case would be IDE support.)

1. `yarn build` in each package executes `tsc -b tsconfig.build.json`, not `tsc -p tsconfig.build.json`. This is to use typescript's [**Project References**](https://www.typescriptlang.org/docs/handbook/project-references.html) feature. For example, `yarn build` under `bar` builds itself and its dependancy, `foo` (More specifically, `foo` is compiled before `bar` is compiled). Look at `packages/bar/tsconfig.build.json`. It explicitly refers `../foo/tsconfig.build.json`. Thus, `tsc -b tsconfig.build.json` under `bar` will use `packages/foo/tsconfig.build.json` to build `foo`. And this fits well with [`--incremental`](https://www.typescriptlang.org/tsconfig/#incremental) option specified in `tsconfig.json`, as build cache can be reused if `foo` (or even `bar`) was already compiled before.

1. Each packages has their own `tsconfig.json`. That's because `ts-node-dev --project ../../tsconfig.json -r tsconfig-paths/register src/index.ts` would not find Paths Mapping, although `../../tsconfig.json` is given to `ts-node-dev` (env var `TS_NODE_PROJECT` wouldn't work, neither).

1. **Path Mapping** should only be located in "project root `tsconfig.json`", even if certain some aliases are only for package's internal use. This is because `tsconfig-paths` does not fully respect **Project References** ([dividab/tsconfig-paths#153](https://github.com/dividab/tsconfig-paths/issues/153)). (If you do not use `tsconfig-paths`, this is not an issue.)

## Jest

If you write test code in javascript, you can do what you used to do without additional configuration.
However, if you write test code in typescript, there are several ways to execute test in general.

You can consider `tsc`, `@babel/preset-typescript`, [`ts-jest`](https://github.com/kulshekhar/ts-jest), [`@swc/jest`](https://www.npmjs.com/package/@swc/jest), and so on. And there're pros/cons.

- `tsc` and `@babel/preset-typescript` requires explict 2 steps (compilation + execution), while `ts-jest` and `@swc/jest` does not (compilation is done under the hood).

- `@babel/preset-typescript` and `@swc/jest` do not type-check (do only transpilation), while `tsc` and `ts-jest` do. (Note that `@swc/jest` plans to implement type-check. Issue and status: [swc-project/swc#571](https://github.com/swc-project/swc/issues/571))

- `@swc/jest` is very fast, and `tsc` "can be" fast.
  - For example, `ts-jest` took 5.756 s while `@swc/jest` took 0.962 s for entire tests in this repo.
  - You can use incremental(`--incremental`) compilation if using `tsc`. You also can turn off type-check for rapid compilation(`--noEmit`). Since [microsoft/TypeScript#39122](https://github.com/microsoft/TypeScript/pull/39122), using `--incremental` and `--noEmit` simultaneously became possible.

In this article, I'd like to introduce `ts-jest` and `@swc/jest`.
In this repo, `@swc/jest` is preconfigured (as it is very fast of course).
However, you can change it as you want.

### [`ts-jest`](https://github.com/kulshekhar/ts-jest)

By `ts-jest/utils`, Jest respects **Path Mapping** automatically by reading `tsconfig.json` and `moduleNameMapper`(in `jest.config.js`), which are, in this repo, already configured like below. See how `moduleNameMapper` is handeled in `jest.config.js` and refer to [docs](https://kulshekhar.github.io/ts-jest/user/config/#paths-mapping) for more details.

**jest.config.js**:

```js
const { pathsToModuleNameMapper } = require('ts-jest/utils')
// Note that json import does not work if it contains comments, which tsc just ignores for tsconfig.
const { compilerOptions } = require('./tsconfig')

module.exports = {
  moduleNameMapper: {
    ...pathsToModuleNameMapper(
      compilerOptions.paths /* , { prefix: '<rootDir>/' }, */,
    ),
  },
  // Other options are ommited for brevity.
}
```

To use `ts-jest`, follow the steps below.

**jest.config.js**:

```jsonc
{
  // UNCOMMENT THE LINE BELOW TO ENABLE ts-jest
  // preset: 'ts-jest',
  // DELETE THE LINE BELOW TO DISABLE @swc/jest in favor of ts-jest
  "transform": { "^.+\\.(t|j)sx?$": ["@swc/jest"] }
}
```

And

```shell
yarn remove -W @swc/jest
```

### [`@swc/jest`](https://www.npmjs.com/package/@swc/jest)

[`swc`](https://swc.rs/) is very fast ts/js transpiler written in Rust, and `@swc/jest` uses it under the hood.

Jest respects **Path Mapping** by reading `tsconfig.json` and `moduleNameMapper`(in `jest.config.js`), which are, in this repo, already configured.

Do not remove(`yarn remove -W ts-jest`) ts-jest just because you use `@swc/jest`.
Thoough `@swc/jest` replaces `ts-jest` completely, `ts-jest/utils` is used in jest.config.js.

**jest.config.js**:

```js
const { pathsToModuleNameMapper } = require('ts-jest/utils')
// Note that json import does not work if it contains comments, which tsc just ignores for tsconfig.
const { compilerOptions } = require('./tsconfig')

module.exports = {
  moduleNameMapper: {
    ...pathsToModuleNameMapper(
      compilerOptions.paths /* , { prefix: '<rootDir>/' }, */,
    ),
  },
  // Other options are ommited for brevity.
}
```

If you want to configure `moduleNameMapper` manually, then you don't need `ts-jest`.

#### Additional Dependencies

Currently swc does not provide some features of babel plugins ([REF](https://swc.rs/docs/comparison-babel)).
Thus additional dependencies might be needed. (You will be able to know what to install by reading error message if it appears.)

A list of already installed packages in this repo is:

- [`regenerator-runtime`](https://www.npmjs.com/package/regenerator-runtime): Needed when passing async callback to jest's `it` or `test` function.

## Linter and Formatter

`eslint` and `prettier` is used along each other.

[`eslint-config-airbnb-base`](https://www.npmjs.com/package/eslint-config-airbnb-base) is configured. If additional `jsx` rules are needed, you can replace it by [`eslint-config-airbnb`](https://www.npmjs.com/package/eslint-config-airbnb-base).

[`eslint-plugin-markdown`](https://github.com/eslint/eslint-plugin-markdown) is not for markdown itself, but for javascript code block snippet appeared in markdown.

[`eslint-plugin-jest`](https://github.com/jest-community/eslint-plugin-jest/issues) is needed to lint jest code.

By configuring `overrides` in `.eslintrc.js`, both of typescript and javascript files are able to be linted by `eslint`. (e.g. So typescript rules are not applied to `.js` files.)

[`markdownlint`](https://github.com/DavidAnson/markdownlint) is configured by [`markdownlint-cli`](https://github.com/igorshubovych/markdownlint-cli#readme).

[`commitlint`](https://github.com/conventional-changelog/commitlint) is used as commit message linter. You can `yarn lint:md .`, for example. Refer to [conventional commits](https://www.conventionalcommits.org/en/) for more details.

## Git Hooks

[`Husky`](https://typicode.github.io/husky/) executes [`lint-staged`](https://github.com/okonet/lint-staged) and [`commitlint`](https://github.com/conventional-changelog/commitlint) by git hooks. `lint-staged` makes sure staged files are to be formatted before committed. Refer to [`.husky/*`](./.husky) for details.

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
