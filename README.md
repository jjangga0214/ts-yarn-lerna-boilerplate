# TypeScript + Yarn Workspace + Lerna Monorepo Boilerplate

Feel free to make issues for any questions or suggestions.

## Scenario

This project has two packages, `foo`(`@jjangga0214/foo`) and `bar`(`@jjangga0214/bar`). `bar` depends on `foo`.

## Lerna + Yarn Workspace

Lerna respects and and delegates monorepo management to yarn workspace, by `'useWorkspaces': true` in [lerna.json](lerna.json). But Lerna is still useful, as it provides utility commands for monorepo workflow (e.g. selective subpackge script execution, versioning, or package publishing).

## Module Aliases

There're' some cases module alias is useful.

1. A package with a deep and wide directory tree: For example, let's say `foo/src/your/very/deep/module/index.ts` imports `../../../../another/deep/module/index`. In this case, absolute path from the root(e.g. `#foo`=`foo/src`) like `#foo/another/deep/module/index` can be more concise and maintainable.

1. Depending on another module not located in node_modules: This can happen in monorepo. For instance, `@jjangga0214/bar` depends on `@jjangga0214/foo`, but the dependancy does not exist in node_modules, but in `packages/foo` directory. In this case, creating an alias(`@jjangga0214/foo` -> `packages/foo/src`) is needed.

(There is another case (e.g. "exporting" alias), but I'd like to omit them as not needed in this context.)

### Node.js: [**Subpath Imports**](https://nodejs.org/api/packages.html#packages_subpath_imports)

There are several _3rd party_ solutions that resolves modules aliases.

1. Runtime mapper: [`module-alias`](https://www.npmjs.com/package/module-alias), [`link-module-alias`](https://www.npmjs.com/package/link-module-alias), etc
1. Transpiler/bundler: Babel plugins, Rollup, Webpack, etc
1. Post-compile-processor: [`tsc-alias`](https://github.com/justkey007/tsc-alias)

That's why @swc/core and @swc/helpers are also installed.

However, from node v14.6.0 and v12.19.0, node introduced a new **native** support for it, named [**Subpath Imports**](https://nodejs.org/api/packages.html#packages_subpath_imports).
It enables specifying alias path in package.json and requires prefixing an alias by `#`.

This repo uses Subpath Import.

**`foo`'s package.json**

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

```jsonc
{
  "ts-node": {
    "require": ["tsconfig-paths/register"]
    // Other options are ommitted for brevity
  }
}
```

### Extraneous Configuration

In developerment environment, fast execution by rapid compilation is useful.
`ts-node` is configured to use [`swc`](https://swc.rs/) internally.
(Refer to the [official docs](https://typestrong.org/ts-node/docs/transpilers#bundled-swc-integration) -> That's why `@swc/core` and `@swc/helpers` are installed.)

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

1. **Path Mapping** should only be located in "project root `tsconfig.json`", even if certain some aliases are only for package's internal use. This is becaue [`tsconfig-paths` does not fully respect **Project References**](https://github.com/dividab/tsconfig-paths/issues/153). (If you does not use `tsconfig-paths`, this is not an issue.)

## Jest

[`ts-jest`](https://github.com/kulshekhar/ts-jest) is used. It enables you to write test code in typescript (not in javascript), and execute it without explict compilation. The compilation would be done automatically on background. However, if this behavior does not fit into you case (e.g. due to performance(?), fine-grained control(?)), but still want typescript test code, you can just compile it manually and execute it with `node`, as you used to do with javascript.

By `ts-jest/utils`, Jest respects **Path Mapping** automatically by reading `tsconfig.json` and configuring `moduleNameMapper`. See how `moduleNameMapper` is handeled in `jest.config.js` and refer to [docs](https://kulshekhar.github.io/ts-jest/user/config/#paths-mapping) for more details.

### Linter and Formatter

`eslint` and `prettier` is used along each other.

[`eslint-config-airbnb-base`](https://www.npmjs.com/package/eslint-config-airbnb-base) is configured. If additional `jsx` rules are needed, you can replace it by [`eslint-config-airbnb`](https://www.npmjs.com/package/eslint-config-airbnb-base).

[`eslint-plugin-markdown`](https://github.com/eslint/eslint-plugin-markdown) is not for markdown itself, but for javascript code block snippet appeared in markdown.

[`eslint-plugin-jest`](https://github.com/jest-community/eslint-plugin-jest/issues) is needed to lint jest code.

By configuring `overrides` in `.eslintrc.js`, both of typescript and javascript files are able to be linted by `eslint`. (e.g. So typescript rules are not applied to `.js` files.)

[`markdownlint`](https://github.com/DavidAnson/markdownlint) is configured by [`markdownlint-cli`](https://github.com/igorshubovych/markdownlint-cli#readme).

[`commitlint`](https://github.com/conventional-changelog/commitlint) is used as commit message linter. You can `yarn lint:md .`, for example. Refer to [conventional commits](https://www.conventionalcommits.org/en/) for more details.

### Git Hooks

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
