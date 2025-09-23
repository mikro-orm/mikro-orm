# MikroORM TypeScript ORM Development Instructions

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively 

### Environment Setup
- Enable corepack for proper Yarn version: `corepack enable`
- Install dependencies: `yarn install` (takes ~1 minute) 
- Start database services: `docker compose up -d` (takes ~1-2 minutes, pulls images on first run)

### Building and Testing
- Build all packages: `yarn build` -- takes 2 minutes. NEVER CANCEL. Set timeout to 180+ seconds.
- TypeScript check: `yarn tsc-check-tests` -- takes 42 seconds. NEVER CANCEL. Set timeout to 90+ seconds.
- Lint code: `yarn lint` -- takes 56 seconds. NEVER CANCEL. Set timeout to 120+ seconds.
- Run all tests: `yarn test` -- takes 15+ minutes. NEVER CANCEL. Set timeout to 1800+ seconds.
- Run fast tests (excludes schema generator): `yarn test:fast` -- takes 10+ minutes. NEVER CANCEL. Set timeout to 1200+ seconds.
- Clean test artifacts: `yarn clean-tests`

### Environment Reset (when pulling master)
```bash
docker compose down --volumes --remove-orphans --rmi local
yarn clean-tests
yarn
docker compose up -d
```

### Documentation
- Build docs: `cd docs && yarn && yarn build` -- takes 9+ minutes. NEVER CANCEL. Set timeout to 900+ seconds.
- Local docs server: `cd docs && yarn start`

## Validation

### Mandatory Validation Steps
- ALWAYS run `yarn build` before committing any package changes.
- ALWAYS run `yarn lint` before committing or the CI (.github/workflows/tests.yml) will fail.
- ALWAYS run `yarn tsc-check-tests` to validate TypeScript in test files.
- Test CLI functionality: `node ./packages/cli/dist/cli --help`

### Testing Limitations and Workarounds
- **MongoDB tests may fail** due to network restrictions downloading mongodb-memory-server binaries from fastdl.mongodb.org.
- **Network-dependent tests** may not work in restricted environments.
- Use `yarn test --testPathPattern="sqlite"` to run SQLite-only tests when MongoDB is unavailable.
- Docker services are required for full database testing (PostgreSQL, MySQL, MariaDB, MSSQL, MongoDB).

### Manual Testing Scenarios
- Test CLI commands: `node ./packages/cli/dist/cli debug`, `node ./packages/cli/dist/cli --version`
- Test database connection with Docker services running
- Test entity generation and migration commands in test environments

## Project Structure and Navigation

### Monorepo Layout
- **17 packages** in `packages/` directory:
  - `core` - Main ORM functionality
  - `cli` - Command line interface 
  - `knex` - Knex.js query builder integration
  - `migrations` - Migration system
  - `entity-generator` - Code generation
  - `seeder` - Database seeding
  - `reflection` - Metadata reflection
  - Database drivers: `postgresql`, `mysql`, `mariadb`, `sqlite`, `better-sqlite`, `libsql`, `mssql`, `mongodb`

### Key Directories
- `packages/` - All publishable packages
- `tests/` - Comprehensive test suite with multiple entity sets
- `docs/` - Docusaurus documentation website
- `scripts/` - Build and utility scripts
- `.github/workflows/` - CI/CD pipelines

### Important Files
- `lerna.json` - Monorepo versioning (current: 6.5.5)
- `jest.config.js` - Test configuration
- `tsconfig.json` - TypeScript configuration for development
- `tsconfig.build.json` - TypeScript configuration for building
- `eslint.config.mjs` - Linting rules
- `docker-compose.yml` - Database services for testing

### Entity Examples and Test Data
- `tests/entities/` - Main test entities
- `tests/entities-sql/` - SQL-specific entities  
- `tests/entities-schema/` - EntitySchema examples
- `tests/entities-js/` - JavaScript entities
- `tests/entities-mssql/` - MSSQL-specific entities
- `tests/defineEntity.test.ts` - `defineEntity` examples

## Common Tasks and Timings

### Build Process (Total: ~2 minutes)
The build is orchestrated by Lerna and runs packages in topological order:
1. Core packages (mikro-orm, @mikro-orm/core) build first
2. Driver packages build in parallel
3. CLI and tools build last

### Package Development
- Each package has: `src/` (TypeScript), `dist/` (compiled), individual package.json
- Build single package: `cd packages/[name] && yarn build`
- Package scripts: `yarn clean`, `yarn compile`, `yarn copy`

### Testing Categories
- Unit tests for individual packages
- Integration tests with real databases
- CLI command tests
- Schema generator tests (slow - excluded from yarn test:fast)
- Cross-database compatibility tests

### CLI Usage Examples
```bash
# Debug configuration
node ./packages/cli/dist/cli debug

# Generate entities
node ./packages/cli/dist/cli generate-entities

# Run migrations  
node ./packages/cli/dist/cli migration:up

# Schema operations
node ./packages/cli/dist/cli schema:update --run
```

## CI/CD Information

### GitHub Actions Workflow (.github/workflows/tests.yml)
- **Build job**: TypeScript check, build all packages
- **Lint job**: ESLint validation
- **Test job**: Matrix testing on Node.js 18, 20, 22, 24 with all databases
- **Docs job**: Documentation build and spell check
- **Publish job**: Development releases to npm

### Supported Environments
- Node.js versions: 18.12.0+
- Yarn version: 4.10.0 (managed by corepack)
- TypeScript: 5.9.2
- Jest for testing with custom runtime

## Known Issues and Troubleshooting

### Common Problems
- **MongoDB memory server fails**: Network restrictions prevent binary download
- **Docker services not starting**: Check Docker daemon and port conflicts
- **Build failures after git pull**: Run environment reset commands
- **TypeScript errors in tests**: Run `yarn tsc-check-tests` to validate
- **Linting failures**: Run `yarn lint` before committing

### Performance Notes
- Use `--max-workers` flag for Jest to control parallelism
- Documentation builds are resource-intensive (9+ minutes)
- Full test suite can take 15+ minutes with all databases

### Development Workflow
1. Fork and clone repository
2. Run complete environment setup
3. Make focused changes to specific packages
4. Run validation steps before committing
5. Submit PR with all checks passing

Remember: This is a production TypeScript ORM used by thousands of projects. Always validate thoroughly and follow the existing patterns and conventions in the codebase.