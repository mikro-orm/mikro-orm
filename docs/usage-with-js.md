# Usage with JavaScript

To use `mikro-orm` with Vanilla JavaScript, define your entities like this:

```javascript
const { Collection } = require('mikro-orm');
const { Book } = require('./Book');
const { BaseEntity } = require('./BaseEntity');

/**
 * @property {number} id
 * @property {Date} createdAt
 * @property {Date} updatedAt
 * @property {string} name
 * @property {string} email
 * @property {number} age
 * @property {boolean} termsAccepted
 * @property {string[]} identities
 * @property {Date} born
 * @property {Collection<Book>} books
 * @property {Book} favouriteBook
 * @property {number} version
 * @property {string} versionAsString
 */
class Author extends BaseEntity {

  /**
   * @param {string} name
   * @param {string} email
   */
  constructor(name, email) {
    super();
    this.name = name;
    this.email = email;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.termsAccepted = false;
  }

}

const schema = {
  name: 'Author',
  extends: 'BaseEntity',
  properties: {
    createdAt: 'Date',
    updatedAt: {
      type: 'Date',
      onUpdate: () => new Date(),
    },
    name: 'string',
    email: 'string',
    age: 'number',
    termsAccepted: 'boolean',
    identities: 'string[]',
    born: 'Date',
    books: {
      reference: '1:m',
      fk: 'author',
      type: 'Book',
    },
    favouriteBook: {
      reference: 'm:1',
      type: 'Book',
      fk: 'id',
    },
  },
};

module.exports = { Author, schema };
```

Reference parameter can be one of (where `SCALAR` is the default one):

```typescript
export enum ReferenceType {
  SCALAR = 'scalar',
  MANY_TO_ONE = 'm:1',
  ONE_TO_MANY = '1:m',
  MANY_TO_MANY = 'm:n',
}
```

When initializing ORM, provide `JavaScriptMetadataProvider` as metadata provider:

```javascript
const orm = await MikroORM.init({
  entitiesDirs: ['entities'],
  dbName: '...',
  metadataProvider: JavaScriptMetadataProvider,
});
```

For more examples of plain JavaScript entity definitions,
[take a look here](https://github.com/B4nan/mikro-orm/blob/master/tests/entities-js). 

[&larr; Back to table of contents](index.md#table-of-contents)
