# TODO list

- cascade persist in collections
- cascade remove references on other entities when deleting entity (e.g. from M:N collection)
- postgres driver
- schema generator for SQL drivers
- support different naming of entity files (e.g. `book-tag.ts` or `book-tag.model.ts`)
- support own base entity in entities directory
- debugging section in docs (add logger, set debug mode, query logger)
- validate inversedBy, mappedBy, fk properties of collections
- validate missing PK
- test request context is properly garbage collected or we need some clean manual up
