# Roadmap

This section lists planned features for future releases. They are not in any specific 
order, and they are subject to change. 

All features that are planned for upcoming release will be converted to GitHub issues. 
If you want to contribute on any of those, please open the issue yourself first to 
discuss specifics.  

## Planned features

- Schema sync (allow automatic synchronization during development)
- Collection expressions - support querying parts of collection
- Collection pagination
- Map collections
- Slow query log
- Leverage async iterators for collections (node 10+)
- Multi tenant support ([schema per tenant](https://dzone.com/articles/spring-boot-hibernate-multitenancy-implementation))

## Planned changes for v4

- [ ] Association scopes/filters ([hibernate docs](https://docs.jboss.org/hibernate/orm/3.6/reference/en-US/html/filters.html))
- [ ] Single table inheritance ([#33](https://github.com/mikro-orm/mikro-orm/issues/33))
- [ ] Embedded entities (allow in-lining child entity into parent one with prefixed keys, or maybe as serialized JSON)
- [ ] Support external hooks when using EntitySchema (hooks outside of entity)
- [ ] Allow adding items to not initialized collections
- [ ] Support multiple M:N with same properties without manually specifying `pivotTable`
- [ ] Cache metadata only with ts-morph provider
- [ ] Diffing entity level indexes in schema generator
- [ ] Support subqueries in QB
- [ ] Support computed properties
- [ ] Add `groupBy` and `distinct` to `FindOptions` and `FindOneOptions`
- [ ] Paginator helper or something similar ([doctrine docs](https://www.doctrine-project.org/projects/doctrine-orm/en/latest/tutorials/pagination.html))

## Planned breaking changes for v4

- [x] Require node 10+
- [x] Require TS 3.7 or newer
- [x] Split into multiple packages (core, driver packages, TS support, SQL support, CLI)
- [ ] Drop default value for db `type` (currently defaults to `mongodb`)
- [ ] Remove `autoFlush` option
- [ ] Remove `IdEntity/UuidEntity/MongoEntity` interfaces
- [ ] Rename `wrappedReference` to `reference` (keep `wrappedReference` supported)
- [ ] Use `bigint` type natively in `BigIntType`

## Docs

- Use code tabs https://docusaurus.io/docs/en/doc-markdown#language-specific-code-tabs
