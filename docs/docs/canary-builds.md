---
title: Canary & dev builds
---

Every push to the main development branches is automatically published to npm as a canary build. This lets you try unreleased bug fixes and upcoming features without waiting for an official release.

## npm dist-tags

MikroORM publishes under several [dist-tags](https://docs.npmjs.com/cli/v10/commands/npm-dist-tag):

| Tag            | Source branch | Contents                                                                             |
|----------------|---------------|--------------------------------------------------------------------------------------|
| `latest`       | —             | Latest stable release. What `npm install @mikro-orm/core` resolves to by default.    |
| `latest-v{N}`  | —             | Latest stable release of a previous major line (e.g. `latest-v6` for the 6.x line).  |
| `next`         | `master`      | Canary build of the current stable line. Every push to `master` publishes a new one. |
| `next-v{N}`    | `next`        | Canary build of the upcoming minor in the `v{N}` major line (e.g. `next-v7` = v7.1-dev while v7.0 is stable). |
| `rc`           | —             | Release candidates, published manually before a major.                               |

> Tags move. `npm install @mikro-orm/core@next` today and tomorrow may install different versions. See [pinning](#pin-exact-versions) below.

## Install a canary build

Install a specific tag:

```bash
npm install @mikro-orm/core@next-v7 @mikro-orm/mysql@next-v7
# or
yarn add @mikro-orm/core@next-v7 @mikro-orm/mysql@next-v7
```

Find the exact version behind a tag:

```bash
npm view @mikro-orm/core dist-tags
```

## Use the same tag across all packages

:::warning

All `@mikro-orm/*` packages in your project **must be installed from the same dist-tag and resolve to the same version**. Mixing e.g. `@mikro-orm/core@next-v7` with `@mikro-orm/mysql@latest` will lead to duplicate copies of the core runtime, broken `instanceof` checks, metadata mismatches, and hard-to-debug runtime errors.

:::

That includes indirect ORM dependencies you have installed directly (e.g. `@mikro-orm/migrations`, `@mikro-orm/seeder`, `@mikro-orm/reflection`, `@mikro-orm/entity-generator`).

## Pin exact versions

Dev tags are moving targets — `next` and `next-v{N}` float to the latest canary on every push. To avoid surprise updates (and to make your `lockfile`/`package.json` reproducible for teammates and CI), **pin the exact version** once you have installed a working canary:

```json
{
  "dependencies": {
    "@mikro-orm/core": "7.1.0-dev.20",
    "@mikro-orm/mysql": "7.1.0-dev.20"
  }
}
```

Never ship a production build against a floating `@next`/`@next-v7` specifier. Always pin.

When you want to move to a newer canary, bump the version explicitly so the change is visible in your git history.

## Reporting issues

If you hit a bug on a canary, please include the exact version (`7.x.y-dev.N`) in your issue report — not the tag name. That lets us pinpoint the commit it was built from.
