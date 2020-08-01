import { assert, Has, IsExact } from 'conditional-type-checks';
import { ObjectId } from 'mongodb';
import { FilterQuery, FilterValue, OperatorMap, Primary, PrimaryKeyType, Query } from '../packages/core/src/typings';
import { Author2, Book2, BookTag2, FooParam2 } from './entities-sql';
import { Author, Book } from './entities';
import { Collection } from '@mikro-orm/core';

type IsAssignable<T, Expected> = Expected extends T ? true : false;

describe('check typings', () => {

  test('Primary', async () => {
    assert<IsExact<Primary<Book2>, string>>(true);
    assert<IsExact<Primary<Book2>, number>>(false);
    assert<IsExact<Primary<Author2>, number>>(true);
    assert<IsExact<Primary<Author2>, string>>(false);

    // PrimaryKeyType symbol has priority
    type Test = { _id: ObjectId; id: string; uuid: number; [PrimaryKeyType]: Date };
    assert<IsExact<Primary<Test>, Date>>(true);
    assert<IsExact<Primary<Test>, ObjectId>>(false);
    assert<IsExact<Primary<Test>, string>>(false);
    assert<IsExact<Primary<Test>, number>>(false);

    // object id allows string
    assert<IsExact<Primary<Author>, ObjectId | string>>(true);
    assert<IsExact<Primary<Author>, number>>(false);

    // bigint support
    assert<IsExact<Primary<BookTag2>, string>>(true);
    assert<IsExact<Primary<BookTag2>, number>>(false);
  });

  test('FilterValue', async () => {
    assert<Has<FilterValue<string>, RegExp | string | null | never[] | OperatorMap<string>>>(true); // strings allow regexps
    assert<Has<FilterValue<number>, number | null | never[] | OperatorMap<number>>>(true);
    assert<Has<FilterValue<string>, number>>(false);
    assert<Has<FilterValue<Date>, Date | null | never[] | OperatorMap<Date>>>(true);
    assert<Has<FilterValue<RegExp>, RegExp | null | never[] | OperatorMap<RegExp>>>(true);
    assert<Has<FilterValue<string>, number>>(false);

    // require specific type
    assert<Has<FilterValue<number>, string>>(false);
    assert<Has<FilterValue<Date>, string>>(true); // allows string dates
    assert<Has<FilterValue<Date>, number>>(false);

    // allows collection item
    assert<Has<Query<Collection<Book2>>, string>>(true);
    assert<Has<Query<Collection<Author2>>, number>>(true);
    assert<Has<Query<Collection<Author2>>, string>>(false);
    assert<Has<Query<Collection<Author2>>, Author2>>(true);
    assert<Has<Query<Collection<Author2>>, string[]>>(false);
    assert<Has<Query<Collection<Author2>>, Book2[]>>(false);
    assert<Has<Query<Author['books']>, ObjectId>>(true);
    assert<Has<Query<Collection<Book2>>, string>>(true);
    assert<Has<Query<Collection<Book>>, ObjectId>>(true);

    // allows entity/pk and arrays of entity/pk
    assert<Has<FilterValue<Author2>, Author2>>(true);
    assert<Has<FilterValue<Author2>, number>>(true);

    // date requires date
    assert<Has<FilterValue<Author['born']>, Date>>(true);
    assert<Has<FilterValue<Author['born']>, number>>(false);
    assert<Has<FilterValue<Author['born']>, string>>(true);
  });

  test('Query', async () => {
    assert<Has<Query<Author['born']>, Date>>(true);
    assert<Has<Query<Author['born']>, number>>(false);
    assert<Has<Query<Author['born']>, string>>(true);
    assert<Has<Query<Author>, { born?: Date }>>(true);
    assert<Has<Query<Author>, { born?: number }>>(false);
    assert<Has<Query<Author>, { born?: string }>>(false);
    assert<IsAssignable<Query<Author2>, { favouriteBook: string }>>(true);
    assert<IsAssignable<Query<Author2>, { favouriteBook: null }>>(true);
    assert<IsAssignable<Query<Author2>, { favouriteBook: number }>>(false);
    assert<IsAssignable<Query<Author2>, { favouriteBook: { author: number } }>>(true);
    assert<IsAssignable<Query<Author2>, { favouriteBook: { author: null } }>>(true);
    assert<IsAssignable<Query<Author2>, { favouriteBook: { author: string } }>>(false);
    assert<Has<Query<Author2>, Author2>>(true);
    assert<Has<Query<Author2>, number>>(true);
    assert<Has<Query<Author2>, string>>(false);
    assert<Has<Query<Author2>, { books: { author: { born?: string } }; favouriteBook: null }>>(false);
    assert<Has<Query<Author2>, { books: { author: { born?: number } }; favouriteBook: null }>>(false);
    assert<Has<Query<Book2>, { author: { born?: Date } }>>(true);
    assert<Has<Query<Book2>, { author: { born?: string } }>>(false);
    assert<Has<Query<Book2>, { author: { born?: number } }>>(false);
    assert<IsAssignable<Query<Author2>, { favouriteBook: { author: { born: Date } } }>>(true);
    assert<IsAssignable<Query<Author2>, { favouriteBook: { author: { books: string[] } } }>>(true);
    assert<IsAssignable<Query<Book2>, { author: { books: string[] } }>>(true);
    assert<IsAssignable<Query<Author2>, { books: { author: { born: Date } } }>>(true);
    assert<IsAssignable<Query<Author2>, { books: { author: { born: null } } }>>(true);
    assert<IsAssignable<Query<Author2>, { favouriteBook: null }>>(true);
    assert<IsAssignable<Query<Author2>, { favouriteBook: string }>>(true);
    assert<Has<Query<Author2>, { favouriteBook: number }>>(false);
    assert<Has<Query<Book2>, { author: { born?: Date }; favouriteBook: string }>>(false); // favouriteBook does not exist on Book2
    assert<IsAssignable<Query<Book2>, { author: { books: { publisher: number } } }>>(true);
    assert<IsAssignable<Query<Book2>, { author: { books: { publisher: null } } }>>(true);
    assert<Has<Query<Author2>, { favouriteBook?: Query<Book2> }>>(true);
    assert<IsAssignable<Query<Author2>, { books: FilterValue<Book2> }>>(true);
    assert<IsAssignable<Query<Author2>, { books: string }>>(true);
    assert<IsAssignable<Query<Author2>, { books: string[] }>>(true);
    assert<IsAssignable<Query<Author2>, { books: Book2 }>>(true);
    assert<IsAssignable<Query<Author2>, { books: Book2[] }>>(true);
    assert<IsAssignable<Query<Author2>, { books: null }>>(true);
    assert<IsAssignable<Query<Author2>, { books: { author: Author2 }; favouriteBook: Book2 }>>(true);
    assert<IsAssignable<Query<Author2>, { books: { author: { born: Date } }; favouriteBook: null }>>(true);
    assert<IsAssignable<Query<Author2>, { books: { author: { born: Date } }; favouriteBook: Book2 }>>(true);
    assert<IsAssignable<Query<Author2>, { books: { author: { born: Date } }; favouriteBook: null }>>(true);
    assert<IsAssignable<Query<Author2>, { books: { author: { born: Date } }; favouriteBook: { title: null } }>>(true);

    let t1: Query<Book2>;
    t1 = { author: { books: { publisher: 1 } } }; // ok
    // @ts-expect-error
    t1 = { author: { books: { publisher: '1' } } }; // should fail
    let t2: Query<Author2>;
    t2 = { age: { $gte: 1 } };
    t2 = { born: '1' };
    t2 = { books: { author: { born: new Date() } }, favouriteBook: null }; // accepts Date
    // @ts-expect-error
    t2 = { books: { author: { born: 1 } }, favouriteBook: null };
    t2 = { books: { author: { born: '1' } }, favouriteBook: null }; // accepts string date
  });

  test('FilterQuery', async () => {
    assert<Has<FilterQuery<Author2>, number>>(true);
    assert<Has<FilterQuery<Author2>, string>>(false);

    assert<IsAssignable<FilterQuery<Book2>, { author: 123 }>>(true);
    assert<IsAssignable<FilterQuery<Author2>, { favouriteBook: null }>>(true);
    assert<IsAssignable<FilterQuery<Author2>, { books: { author: { name: 'asd' } } }>>(true);
    assert<IsAssignable<FilterQuery<Author2>, { books: { author: Author2 } }>>(true);
    assert<IsAssignable<FilterQuery<Author2>, { books: { author: 123 } }>>(true);
    // assert<IsAssignable<FilterQuery<Author2>, { books: { author: '123' } }>>(false); // hard to test failures

    assert<IsAssignable<FilterQuery<Author2>, { books: { title: '123' }; favouriteBook: null }>>(true);
    // assert<IsAssignable<FilterQuery<Author2>, { books: { title: 123 }; favouriteBook: null }>>(false); // hard to test failures
    // assert<IsAssignable<FilterQuery<Author2>, { books: { title: Date }; favouriteBook: null }>>(false); // hard to test failures

    assert<IsAssignable<FilterQuery<Author2>, { born: Date }>>(true);
    // assert<IsAssignable<FilterQuery<Author2>, { born: number }>>(false); // hard to test failures
    // assert<IsAssignable<FilterQuery<Author2>, { born: string }>>(false); // hard to test failures

    assert<IsAssignable<FilterQuery<Author2>, { age: { $in: [1] } }>>(true);
    // assert<IsAssignable<FilterQuery<Author2>, { age: { $in: ['1'] } }>>(false); // hard to test failures
    // assert<IsAssignable<FilterQuery<Author2>, { age: { $gta: ['1'] } }>>(false); // hard to test failures

    assert<IsAssignable<FilterQuery<Author2>, { age: { $gte: number } }>>(true);
    assert<IsAssignable<FilterQuery<Author2>, { age: { $gte: number }; born: { $lt: Date }; $and: [{ name: { $ne: 'John' } }, { name: { $in: ['Ben', 'Paul'] } }] }>>(true);
    assert<Has<FilterQuery<Author2>, { favouriteBook?: Book2 }>>(true);
    assert<IsAssignable<FilterQuery<Author2>, { $and: [{ favouriteBook: Book2 }, { name: string }] }>>(true);
    assert<IsAssignable<FilterQuery<Author2>, { $and: [{ favouriteBook: { title: string } }, { name: string }] }>>(true);
    assert<IsAssignable<FilterQuery<Author2>, { $and: [{ favouriteBook: string }, { name: string }] }>>(true);
    assert<Has<FilterQuery<Author2>, Author2>>(true);
    assert<Has<FilterQuery<Author2>, number>>(true);
    assert<Has<FilterQuery<Author2>, { favouriteBook?: Query<Book2> }>>(true);
    assert<Has<FilterQuery<Book2>, { author: { favouriteBook?: Query<Book2> } }>>(true);
    assert<Has<FilterQuery<Book2>, { author: { favouriteBook?: { title?: string } } }>>(true);
    assert<IsAssignable<FilterQuery<Book2>, { author: { favouriteBook: { tags: FilterValue<BookTag2> } } }>>(true);
    assert<IsAssignable<FilterQuery<Book2>, { author: { favouriteBook: { tags: BookTag2[] } } }>>(true);
    assert<IsAssignable<FilterQuery<Book2>, { author: { favouriteBook: { tags: string[] } } }>>(true);
    assert<IsAssignable<FilterQuery<Book2>, { tags: string[] }>>(true);
    assert<IsAssignable<FilterQuery<Book2>, { tags: string }>>(true);
    assert<IsAssignable<FilterQuery<Author2>, { books: { tags: bigint[] } }>>(false);
  });

  test('FilterQuery ok assignments', async () => {
    let ok01: FilterQuery<Author2>;
    ok01 = {};
    ok01 = { born: new Date() };
    ok01 = { born: { $gte: new Date() } };
    ok01 = { age: { $gte: 1 } };
    ok01 = { favouriteBook: '1' };
    ok01 = { favouriteBook: ['1', '2'] };
    ok01 = { favouriteBook: null };
    ok01 = { books: { author: { born: new Date() } }, favouriteBook: null };
    ok01 = { books: { author: { born: new Date() } } };
    ok01 = { books: { author: { born: new Date() } }, favouriteBook: {} as Book2 };
    ok01 = { books: { author: { born: '2020-01-01' } }, favouriteBook: {} as Book2 };
    ok01 = { books: { tags: { name: 'asd' } } };
    ok01 = { books: { tags: '1' } };
    ok01 = { books: { tags: { books: { title: 'asd' } } } };
    ok01 = { name: 'asd' };
    ok01 = { $or: [{ name: 'asd' }, { age: 18 }] };

    let ok02: FilterQuery<Book2>;
    ok02 = { publisher: { $ne: undefined } };
    ok02 = { publisher: { name: 'test' } };
    ok02 = { author: { born: { $or: ['123'] } } };

    let ok03: FilterQuery<FooParam2>;
    ok03 = { bar: 1, baz: 2 };
    ok03 = { bar: { name: '1' }, baz: { name: '2' } };

    let ok04: FilterQuery<Book2>;
    ok04 = { publisher: 1 };
    ok04 = { publisher: { name: 'name' } };
    ok04 = { publisher: { name: /name/ } };
    ok04 = { publisher: { name: { $like: 'name' } } };
    ok04 = { $and: [{ author: { age: { $gte: 123 } } }] };
  });

  test('FilterQuery bad assignments', async () => {
    let fail01: FilterQuery<Author2>;
    // @ts-expect-error
    fail01 = { books: { author: { born: 123 } }, favouriteBook: null };
    // @ts-expect-error
    fail01 = { born: true };
    // @ts-expect-error
    fail01 = { age: { $gta: 1 } };
    // @ts-expect-error
    fail01 = { ago: { $gte: 1 } };
    // @ts-expect-error
    fail01 = { ago: { $gta: 1 } };
    // @ts-expect-error
    fail01 = { favouriteBook: 1 };
    // @ts-expect-error
    fail01 = { favouriteBook: 1 };
    // @ts-expect-error
    fail01 = { favouriteBook: [1, '2'] };
    // @ts-expect-error
    fail01 = { favouriteBook: [1, 2] };
    // @ts-expect-error
    fail01 = { books: { tags: { name: 1 } } };
    // @ts-expect-error
    fail01 = { books: { tags: true } };
    // @ts-expect-error
    fail01 = { books: { tags: { books: { title: 123 } } } };

    let fail02: FilterQuery<Book2>;
    // @ts-expect-error
    fail02 = { author: { born: 123 } };
    // @ts-expect-error
    fail02 = { author: { born: [123] } };
    // @ts-expect-error
    fail02 = { author: { born: { $in: [123] } } };
  });

});
