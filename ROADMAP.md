# Roadmap

This section lists planned features for future releases. They are not in any specific 
order, and they are subject to change. 

All features that are planned for upcoming release will be converted to GitHub issues. 
If you want to contribute on any of those, please open the issue yourself first to 
discuss specifics.  

## Planned features

- Association scopes
- Value transformers (e.g. mapping of `Date` object to formatted string)
- Support for connection pooling in MySQL and PostgresQL
- Computing schema difference based on current database state
- Schema sync (allow automatic synchronization during development)
- Allow generating entities from existing database schema
- Migrations via `umzug`
- Improved support for data types like date, time, enum, timestamp
- Support for RegExp search in SQL drivers
- Collection expressions - support querying parts of collection
- Collection pagination
- Nestjs helper repository
- Eager loading of associations (allow having some relationship always fetched)
- Embedded entities (allow in-lining child entity into parent one with prefixed keys)
- Slow query log
- Optional query params logging
