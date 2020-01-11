# Roadmap

This section lists planned features for future releases. They are not in any specific 
order, and they are subject to change. 

All features that are planned for upcoming release will be converted to GitHub issues. 
If you want to contribute on any of those, please open the issue yourself first to 
discuss specifics.  

## Planned features

- Association scopes/filters ([hibernate docs](https://docs.jboss.org/hibernate/orm/3.6/reference/en-US/html/filters.html))
- Schema sync (allow automatic synchronization during development)
- Support for RegExp search in SQL drivers
- Collection expressions - support querying parts of collection
- Collection pagination
- Composite primary keys
- Map collections
- Single table inheritance ([#33](https://github.com/mikro-orm/mikro-orm/issues/33))
- Embedded entities (allow in-lining child entity into parent one with prefixed keys, or maybe as serialized JSON)
- Slow query log
- Leverage async iterators for collections (node 10+)
- Multi tenant support ([schema per tenant](https://dzone.com/articles/spring-boot-hibernate-multitenancy-implementation))

## Planned breaking changes for v4

- Require node 10+
- Require TS 3.7 or newer
- Split into multiple packages (core, driver packages, TS support, SQL support, CLI)
