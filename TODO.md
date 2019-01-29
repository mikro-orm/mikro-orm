# TODO list

- cascade persist in collections
- cascade remove references on other entities when deleting entity (e.g. from M:N collection)
- postgres driver
- schema generator for SQL drivers
- support different naming of entity files (e.g. `book-tag.ts` or `book-tag.model.ts`)
- support own base entity in entities directory
- debugging section in docs (add logger, set debug mode, query logger)
- validate inversedBy, mappedBy, fk properties of collections
- OneToMany collection with field bug
    - error in EntityHelper.assign() in when merging entity to EM
    - occurs when 1:m property is defined on collection with same property stored in database under same key
- test request context is properly garbage collected or we need some clean manual up
