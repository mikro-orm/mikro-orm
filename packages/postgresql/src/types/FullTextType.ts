import { raw, Type, type TransformContext, type RawQueryFragment } from '@mikro-orm/core';
import type { PostgreSqlPlatform } from '../PostgreSqlPlatform.js';

// Postgres has four levels of full text weights
// https://www.postgresql.org/docs/current/textsearch-controls.html
type FullTextWeight = 'A' | 'B' | 'C' | 'D';

// Null types are allowed, mainly for readability so the user does not have to do null checks
// themselves and keep using `onUpdate: (book: Book) => { A: book.title, B: book.description }`
// with nullable properties.
export type WeightedFullTextValue = { [K in FullTextWeight]?: string | null };

export class FullTextType extends Type<string | WeightedFullTextValue, string | null | RawQueryFragment> {

  constructor(public regconfig = 'simple') {
    super();
  }

  override compareAsType(): string {
    return 'any';
  }

  override getColumnType(): string {
    return 'tsvector';
  }

  // Use convertToDatabaseValue to prepare insert queries as this method has
  // access to the raw JS value. Return Knex#raw to prevent QueryBuilderHelper#mapData
  // from sanitizing the returned chaing of SQL functions.
  override convertToDatabaseValue(value: string | WeightedFullTextValue, platform: PostgreSqlPlatform, context?: TransformContext | boolean): string | null | RawQueryFragment {
    // Don't convert to values from select queries to the to_tsvector notation
    // these should be compared as string using a special oparator or function
    // this behaviour is defined in Platform#getFullTextWhereClause.
    // This is always a string.
    if (typeof context === 'object' && context.fromQuery) {
      return value as string;
    }

    // Null values should not be processed
    if (!value) {
      return null;
    }

    // the object from that looks like { A: 'test data', B: 'test data2' ... }
    // must be converted to
    // setweight(to_tsvector(regconfig, value), A) || setweight(to_tsvector(regconfig, value), B)... etc
    // use Knex#raw to do binding of the values sanitization of the boundvalues
    // as we return a raw string which should not be sanitzed anymore
    if (typeof value === 'object') {
      const bindings: string[] = [];
      const sqlParts: string[] = [];

      for (const [weight, data] of Object.entries(value)) {
        // Check whether the weight is valid according to Postgres,
        // Postgres allows the weight to be upper and lowercase.
        if (!['A', 'B', 'C', 'D'].includes(weight.toUpperCase())) {
          throw new Error('Weight should be one of A, B, C, D.');
        }

        // Ignore all values that are not a string
        if (typeof data === 'string') {
          sqlParts.push('setweight(to_tsvector(?, ?), ?)');
          bindings.push(this.regconfig, data, weight);
        }
      }

      // Return null if the object has no valid strings
      if (sqlParts.length === 0) {
        return null;
      }

      // Join all the `setweight` parts using the PostgreSQL tsvector `||` concatenation operator
      return raw(sqlParts.join(' || '), bindings);
    }

    // if it's not an object, it is expected to be string which does not have to be wrapped in setweight.
    return raw('to_tsvector(?, ?)', [this.regconfig, value]);
  }

}
