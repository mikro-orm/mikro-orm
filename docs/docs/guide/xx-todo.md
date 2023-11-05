## ToC

- [x] introduction
- [x] setup project, npm, typescript, ES modules
- [x] orm config, discovery, ts-morph, cli setup
- [x] first entity - describe defining user entity, start with basic props
- [x] working with entities - basic CRUD, EM, repositories
- [x] setup fastify app, fastify hooks
- [x] setup vitest and test the first dummy endpoint
- [x] testing, seeder, integration testing
- [x] schema generator
- [x] migrations - initial migration as we already have schema - ensure it's up-to-date
- [x] relations - add more entities, add relations between them
- [x] serialization - lazy properties for article.text
- [x] note about unit tests and required MikroORM.init method
- [ ] auth - login/register, middleware, create article
- [ ] custom repository - wrapping the code from previous section
- [ ] virtual entities - article listing, using QB, also mention findAndCount
- [ ] soft delete - show on comments
- [ ] embeddables on user profile (social links)
- [ ] mention QB getResult, execute and awaiting the QB directly

## Things to showcase

- [x] start with defining some entities, create first request handler, show the global context validation error
- [x] first create simple handler, test it and show it fails because schema is not created
- [x] ESM setup, show reflect-metadata problem (TODO?), use ts-morph, mention EntitySchema
- [x] vitest setup (its pretty much working out of box, no config needed, but a short section should be there)
- [x] when setting up CLI, show the need for configuration of CLI config paths and ts-node, mention its CLI only thing
- [x] also mention that the test does not exit the process without calling `orm.close()`
- [x] show how to use schema generator, notice we can call it during app start to have the auto sync, but people need to be careful with that...
- [x] show seeding so we can have test data
- [x] lazy loading for `Article.text` and `User.password`
- [x] next section should talk about migrations, and show the initial migrations switch as we already have schema created
- [x] carefully mention the imports from driver package
- [x] mention `t` map of types when defining `t.text`, and how the `type` works, and that we have `columnType` too
- [x] mention persisting via EM, and that its equivalent via repos, and that they are not entity bound, It's all the same EM
- [x] general CRUD with entities
- [ ] batch CRUD
- [ ] em.upsert()
- [ ] test `Rel<T>` type with ESM and reflect-metadata, use code tabs for both? the ts-morph setup would be optional with a "skip" link at the top
- [x] serialization
- [x] explain constructor usage invariant
- [ ] orphan removal
- [ ] add note about existing database and entity generator
- [ ] virtual `User.token` property
- [ ] get endpoint, 404 via config, note about local override
- [ ] cascading and propagation
- [ ] default values
- [ ] repositories with custom methods, maybe note about base entity repo
- [ ] using QB
- [ ] em.create() and that it's required for using interface only entities
- [ ] using virtual entities
- [ ] soft delete via `onFlush` event
- [ ] find a way to have the reflection package as dev dependency without much hustle, or at least add a bonus section about this and deployment/docker
- [ ] example how to go about scripts (forking or allowing global context) and CRON jobs (request context decorator or explicit helper usage)

TODO:
- mention temp folder for ts-morph and metadata caching + gitignore
- maybe move the repository section higher?
