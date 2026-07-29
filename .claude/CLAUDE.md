# CLAUDE.md

## General Rules

Keep changes minimal and scoped. Do not fix unrelated issues, touch unrelated files, or 'clean up' code outside the scope of the current task unless explicitly asked.

## Essential Commands

**IMPORTANT: These commands take significant time. Set appropriate timeouts and never cancel them.**

| Command            | Purpose                                          | Timeout |
|--------------------|--------------------------------------------------|---------|
| `yarn build`       | Build all packages                               | 180s    |
| `yarn format`      | Code formatting (oxfmt)                          | 30s     |
| `yarn lint`        | Lint + type-aware rules + tsgo type diagnostics  | 120s    |
| `yarn test`        | Full test suite (all databases)                  | 1800s   |
| `yarn bench`       | Simple CRUD benchmark                            | 180s    |
| `yarn bench:types` | Type system benchmark                            | 120s    |

### Setup

```bash
corepack enable
yarn install
docker compose up -d --wait
```

### Single Package Build

Don't use `tsc` directly or via `npx tsc`, always use `yarn build`, either from project root or from package directory.

```bash
cd packages/[name] && yarn build
```

### Running Specific Tests

Tests run on TypeScript directly (no build needed). You only need to build before committing, not before running tests.

```bash
yarn test sqlite
yarn test EntityManager.sqlite.test.ts
```

### Validation Before Commit

Always run these before committing (run this from project root):

1. `yarn build` - if package source changed
2. `yarn format` - always (also runs automatically via lint-staged pre-commit hook)
3. `yarn lint` - always (covers oxlint rules, type-aware rules, and tsgo type diagnostics via `--type-check`)
4. `yarn test` - always run the **full** test suite before declaring work done; do not rely solely on targeted test runs

## Architecture

### Entity Definition Options

1. **defineEntity**: Helper with full type inference from property builders
2. **Decorators** (recommended): `@Entity()`, `@Property()`, `@ManyToOne()`, etc.
3. **EntitySchema**: Class-less schema definition for vanilla JS

### Type System

Heavy use of TypeScript generics. Key types in `packages/core/src/typings.ts`.

## Git Conventions

- Always use `chore:` prefix for non-functional commits (config changes, CI fixes, changelog edits). Only use `fix:` for actual bug fixes in source code. Only use `feat:` for new features.
- Use `--no-verify` flag with git push when husky/lint-staged hooks fail due to PATH issues in this environment.

## Pre-Commit Checks

Always run `yarn lint` before committing any TypeScript changes — it includes tsgo type diagnostics via `oxlint --type-check`. Never assume type safety — verify it.

## Code Editing Rules

When reviewing or editing code, do NOT remove code (assertions, type casts, etc.) unless you have verified it's safe by running the build/type checker. Never claim code is 'redundant' without evidence.

## Testing

- When fixing bugs, write the test FIRST that reproduces the issue, then implement the fix. Do not implement fixes before having a failing test.
- In test files, never leave debug artifacts (console.log, debug mode flags, commented-out code). Clean up before committing.
- **Never invent GitHub issue or PR numbers.** Only reference an issue/PR number if the user explicitly provided it, or if it came from a tool output (`gh issue view`, `gh pr create`, etc.). When fixing a bug reported inline (no issue number given), name the test using the `GHx<n>` convention (next free number under `tests/issues/GHx*.test.ts`) and describe the bug in comments instead of citing a fabricated `#NNNN`. Same rule applies to commit messages, PR descriptions, and code comments.

## PRs

When opening PRs, write concise descriptions focused on what changed and why. Avoid boilerplate templates or overly verbose descriptions. Skip the "Test plan" section completely, don't state the obvious (e.g., tests pass or other stuff visible from the CI checks).

## Code Style

- No `public` keyword (except constructors)
- Use native private fields (`#field`) for variables, but regular `private` for methods
- Conventional commits: `feat(core):`, `fix(mysql):`, `refactor:`, etc.
