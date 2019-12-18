# TypeScript + Yarn Workspace + Lerna Monorepo Boilerplate

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

### Module aliases and path mappings

<!-- markdownlint-disable no-duplicate-heading -->

#### Dev

<!-- markdownlint-enable no-duplicate-heading -->

For `ts-node-dev` to understand **path mapping**, [`tsconfig-paths`](https://github.com/dividab/tsconfig-paths) is used.

<!-- markdownlint-disable no-duplicate-heading -->

#### Typescript

<!-- markdownlint-enable no-duplicate-heading -->

`tsconfig.json` has this path mappings configuration.

```json
{
  "baseUrl": "packages",
  "paths": {
    "@jjangga0214/*": ["*/src"],
    "~foo/*": ["foo/src/*"],
    "~bar/*": ["bar/src/*"]
  }
}
```

`@jjangga0214/foo` and `@jjangga0214/bar` are only used for cross package references. For example, `bar` imports `@jjangga0214/foo` in its `src/index.ts`.

However, `~foo` and `~bar` are only used for package's interal use. For example, `foo/src/index.ts` imports `~foo/hello`, which is same as `./hello`. This can be useful for a package with deep and wide directory tree, as an absolute path can be used. For example, `foo/src/your/very/deep/module/index.ts` can import `~foo/another/deeper/module/index` instead of `../../../../another/deeper/module/index`.

But `bar` should not import `~foo`, `~foo/hello` nor `@jjangga0214/foo/hello`, causing errors. The former two(`~foo` and `~foo/hello`) have to be avoided. To import `@jjangga0214/foo/hello` in `bar`, you should add explicit configuration like this.

```json
{
  "baseUrl": "packages",
  "paths": {
    "@jjangga0214/*": ["*/src"],
+   "@jjangga0214/foo/*": ["foo/src/*"] // => this one!
    // ... other paths
  }
}
```

#### Module Aliases

Though `~foo` or `~bar` will be resolved when `yarn dev` thanks to `tsconfig-paths` and just to be compiled well, they will throw an Error(`Module Not Found`) at runtime. That's where [`link-module-alias`](https://github.com/Rush/link-module-alias) comes in. By making symlink, `~foo` and `~bar` are resolved. The configuration resides in each package.json (by `_moduleAliases` field).

<!-- markdownlint-disable no-duplicate-heading -->

#### Jest

<!-- markdownlint-enable no-duplicate-heading -->

Jest respects **path mapping** by reading `tsconfig.json` and configuring `moduleNameMapper`.

### Root commands

Introducing some of commands specified in `package.json`.

```bash
# remove compiled js folders, typescript build info, jest cache, *.log, and test coverage
yarn clean

# open web browser to show test coverage report.
# run this AFTER running `yarn coverage`,
# to make it sure there are reports before showing them.
yarn coverage:show
```
