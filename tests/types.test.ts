import { Constructor, EntityRepository, EntitySchema, OptionalProps, IType, ref, wrap } from '@mikro-orm/core';
import type { BaseEntity, Ref, Reference, Collection, EntityManager, EntityName, RequiredEntityData } from '@mikro-orm/core';
import type { Has, IsExact } from 'conditional-type-checks';
import { assert } from 'conditional-type-checks';
import type { ObjectId } from 'bson';
import type {
  EntityData,
  EntityDTO,
  FilterQuery,
  FilterValue,
  Loaded,
  OperatorMap,
  Primary,
  PrimaryKeyProp,
  ExpandQuery,
} from '../packages/core/src/typings';
import type { Author2, Book2, BookTag2, Car2, FooBar2, FooParam2, Publisher2, User2 } from './entities-sql';
import type { Author, Book } from './entities';

type IsAssignable<T, Expected> = Expected extends T ? true : false;

describe('check typings', () => {

  test('Primary', async () => {
    assert<IsExact<Primary<Book2>, string>>(true);
    assert<IsExact<Primary<Book2>, number>>(false);
    assert<IsExact<Primary<Author2>, number>>(true);
    assert<IsExact<Primary<{ id?: number }>, number>>(true);
    assert<IsExact<Primary<Author2>, string>>(false);

    // PrimaryKeyProp symbol has priority
    type Test = { _id: ObjectId; id: string; uuid: number; foo: Date; [PrimaryKeyProp]?: 'foo' };
    assert<IsExact<Primary<Test>, Date>>(true);
    assert<IsExact<Primary<Test>, ObjectId>>(false);
    assert<IsExact<Primary<Test>, string>>(false);
    assert<IsExact<Primary<Test>, number>>(false);

    // object id allows string
    assert<IsExact<Primary<Author>, ObjectId | string>>(true);
    assert<IsExact<Primary<Author>, number>>(false);

    // bigint support
    assert<IsExact<Primary<BookTag2>, bigint>>(true);
    assert<IsExact<Primary<BookTag2>, number>>(false);
  });

  test('EntityData', async () => {
    let b: EntityData<Book2>;
    b = {};
    b = {} as Author2;
    b = { author: { name: 'a' } };
    b = { author: { name: 'a', books: [] } };
    b = { author: { name: 'a', books: [{ title: 'b', tags: { name: 't' } }] } };
    b = { publisher: null };
    b = { publisher: { name: 'p' } };
    b = { publisher: {} as Publisher2 };
    b = { publisher: {} as Ref<Publisher2> };

    // @ts-expect-error
    b = { name: 'a' };
    // @ts-expect-error
    b = { author: { title: 'a' } };
    // @ts-expect-error
    b = { author: { name: 'a', books: [{ name: 'b' }] } };
    // @ts-expect-error
    b = { author: { name: 'a', books: [{ title: 'b', tags: { title: 't' } }] } };

    let c: EntityData<Car2>;
    c = {};
    c = {} as Car2;
    c = { name: 'n', price: 123, year: 2021 };
    c = { name: 'n', price: 123, year: 2021, users: { firstName: 'f', lastName: 'l' } };
    c = { name: 'n', price: 123, year: 2021, users: [{ firstName: 'f', lastName: 'l' }] };
    c = { name: 'n', price: 123, year: 2021, users: [{} as User2] };
    c = { name: 'n', price: 123, year: 2021, users: [['f', 'l']] };
    type T = Primary<User2>;

    // @ts-expect-error
    c = { name: 'n', price: 123, year: '2021' };
    // @ts-expect-error
    c = { name: 'n', price: 123, year: 2021, users: { firstName: 321, lastName: 'l' } };
    // @ts-expect-error
    c = { name: 'n', price: 123, year: 2021, users: [{ firstName: 'f', lastName: 123 }] };
    // @ts-expect-error
    c = { name: 'n', price: 123, year: 2021, users: [{} as Car2] };
    // @ts-expect-error
    c = { name: 'n', price: 123, year: 2021, users: [['f', 1]] };
  });

  test('EntityDTO', async () => {
    const b = { author: { books: [{}], identities: [''] } } as unknown as EntityDTO<Loaded<Book2, 'publisher' | 'author.books'>>;
    const b1 = b.author.name;
    const b2 = b.test?.name;
    const b3 = b.test?.book?.author.books2;
    const b4 = b.author.books[0].tags;
    const b5 = b.publisher?.name;
    const b6 = b.publisher?.tests;
    const b7: bigint | undefined = b.author.favouriteBook?.tags[0];
    const b8: number = b.author.identities!.length;
    const b9: string[] = b.author.identities!.slice();
    const b10: string[] = b.author.identities!.filter(i => i);

    // @ts-expect-error
    b.author.afterDelete?.();
    // @ts-expect-error
    b.author.title;
    // @ts-expect-error
    b.author.favouriteBook?.tags[0].title;
    // @ts-expect-error
    b.test?.getConfiguration?.();

    const a = { books: [{ tags: [{}] }] } as unknown as EntityDTO<Loaded<Author2, 'books.tags' | 'books.publisher'>>;
    const a11 = a.books;
    const a12 = a.books[0];
    const a1 = a.books[0].tags;
    const a2 = a.books[0].publisher?.type;
    const a3 = a.books;
    const a4 = a.books.map(b => b.title);
    const a5 = a.books[0].tags.map(t => t.name);
    const a6 = a.books[0].tags[0].name;

    // @ts-expect-error
    a.books.map(b => b.name);
    // @ts-expect-error
    a.books[0].publisher?.title;
    // @ts-expect-error
    a.books[0].tags.map(t => t.title);
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
    // assert<Has<Query<Collection<Book2>>, string>>(true);
    // assert<Has<Query<Collection<Author2>>, number>>(true);
    // assert<Has<Query<Collection<Author2>>, string>>(false);
    // assert<Has<Query<Collection<Author2>>, Author2>>(true);
    // assert<Has<Query<Collection<Author2>>, string[]>>(false);
    // assert<Has<Query<Collection<Author2>>, Book2[]>>(false);
    // assert<Has<Query<Author['books']>, ObjectId>>(true);
    // assert<Has<Query<Collection<Book2>>, string>>(true);
    // assert<Has<Query<Collection<Book>>, ObjectId>>(true);

    // allows entity/pk and arrays of entity/pk
    assert<Has<FilterValue<Author2>, Author2>>(true);
    assert<Has<FilterValue<Author2>, number>>(true);

    // date requires date
    assert<Has<FilterValue<Author['born']>, Date>>(false);
    assert<Has<FilterValue<Author['born']>, number>>(false);
    assert<Has<FilterValue<Author['born']>, string>>(true);
  });

  test('Query', async () => {
    // assert<Has<FilterQuery<Author['born']>, Date>>(true);
    assert<Has<ExpandQuery<Author['born']>, number>>(false);
    // assert<Has<Query<Author['born']>, string>>(true);
    assert<Has<ExpandQuery<Author>, { born?: Date }>>(false);
    assert<Has<ExpandQuery<Author>, { born?: number }>>(false);
    assert<Has<ExpandQuery<Author>, { born?: string }>>(true);
    assert<IsAssignable<ExpandQuery<Author2>, { favouriteBook: string }>>(true);
    assert<IsAssignable<ExpandQuery<Author2>, { favouriteBook: null }>>(true);
    assert<IsAssignable<ExpandQuery<Author2>, { favouriteBook: number }>>(false);
    assert<IsAssignable<ExpandQuery<Author2>, { favouriteBook: { author: number } }>>(true);
    assert<IsAssignable<ExpandQuery<Author2>, { favouriteBook: { author: null } }>>(true);
    assert<IsAssignable<ExpandQuery<Author2>, { favouriteBook: { author: string } }>>(false);
    // assert<Has<Query<Author2>, Author2>>(true);
    assert<Has<ExpandQuery<Author2>, number>>(true);
    assert<Has<ExpandQuery<Author2>, string>>(false);
    assert<Has<ExpandQuery<Author2>, { books: { author: { born?: string } }; favouriteBook: null }>>(false);
    assert<Has<ExpandQuery<Author2>, { books: { author: { born?: number } }; favouriteBook: null }>>(false);
    // assert<Has<Query<Book2>, { author: { born?: Date } }>>(true);
    assert<Has<ExpandQuery<Book2>, { author: { born?: string } }>>(false);
    assert<Has<ExpandQuery<Book2>, { author: { born?: number } }>>(false);
    assert<IsAssignable<ExpandQuery<Author2>, { favouriteBook: { author: { born: Date } } }>>(false);
    assert<IsAssignable<ExpandQuery<Author2>, { favouriteBook: { author: { born: string } } }>>(true);
    assert<IsAssignable<ExpandQuery<Author2>, { favouriteBook: { author: { books: string[] } } }>>(true);
    assert<IsAssignable<ExpandQuery<Book2>, { author: { books: string[] } }>>(true);
    assert<IsAssignable<ExpandQuery<Author2>, { books: { author: { born: string } } }>>(true);
    assert<IsAssignable<ExpandQuery<Author2>, { books: { author: { born: Date } } }>>(false);
    assert<IsAssignable<ExpandQuery<Author2>, { books: { author: { born: null } } }>>(true);
    assert<IsAssignable<ExpandQuery<Author2>, { favouriteBook: null }>>(true);
    assert<IsAssignable<ExpandQuery<Author2>, { favouriteBook: string }>>(true);
    assert<Has<ExpandQuery<Author2>, { favouriteBook: number }>>(false);
    assert<Has<ExpandQuery<Book2>, { author: { born?: Date }; favouriteBook: string }>>(false); // favouriteBook does not exist on Book2
    assert<IsAssignable<ExpandQuery<Book2>, { author: { books: { publisher: number } } }>>(true);
    assert<IsAssignable<ExpandQuery<Book2>, { author: { books: { publisher: null } } }>>(true);
    assert<Has<ExpandQuery<Author2>, { favouriteBook?: ExpandQuery<Book2> }>>(true);
    assert<IsAssignable<ExpandQuery<Author2>, { books: FilterValue<Book2> }>>(true);
    assert<IsAssignable<ExpandQuery<Author2>, { books: string }>>(true);
    assert<IsAssignable<ExpandQuery<Author2>, { books: string[] }>>(true);
    assert<IsAssignable<ExpandQuery<Author2>, { books: Book2 }>>(true);
    assert<IsAssignable<ExpandQuery<Author2>, { books: Book2[] }>>(true);
    assert<IsAssignable<ExpandQuery<Author2>, { books: null }>>(true);
    assert<IsAssignable<ExpandQuery<Author2>, { books: { author: Author2 }; favouriteBook: Book2 }>>(true);
    assert<IsAssignable<ExpandQuery<Author2>, { books: { author: { born: string } }; favouriteBook: null }>>(true);
    assert<IsAssignable<ExpandQuery<Author2>, { books: { author: { born: string } }; favouriteBook: Book2 }>>(true);
    assert<IsAssignable<ExpandQuery<Author2>, { books: { author: { born: string } }; favouriteBook: null }>>(true);
    assert<IsAssignable<ExpandQuery<Author2>, { books: { author: { born: string } }; favouriteBook: { title: null } }>>(true);

    let t1: ExpandQuery<Book2>;
    t1 = { author: { books: { publisher: 1 } } }; // ok
    // @ts-expect-error
    t1 = { author: { books: { publisher: '1' } } }; // should fail
    let t2: ExpandQuery<Author2>;
    t2 = { age: { $gte: 1 } };
    t2 = { born: '1' };
    t2 = { books: { author: { born: '2020-11-11' } }, favouriteBook: null }; // accepts string date
    // @ts-expect-error
    t2 = { books: { author: { born: 1 } }, favouriteBook: null };
    t2 = { books: { author: { born: '1' } }, favouriteBook: null }; // accepts string date
  });

  test('FilterQueryOrPrimary', async () => {
    // assert<Has<FilterQueryOrPrimary<Author2>, number>>(true);
    assert<Has<FilterQuery<Author2>, string>>(false);

    assert<IsAssignable<FilterQuery<Book2>, { author: 123 }>>(true);
    assert<IsAssignable<FilterQuery<Author2>, { favouriteBook: null }>>(true);
    assert<IsAssignable<FilterQuery<Author2>, { books: { author: { name: 'asd' } } }>>(true);
    assert<IsAssignable<FilterQuery<Author2>, { books: { author: Author2 } }>>(true);
    assert<IsAssignable<FilterQuery<Author2>, { books: { author: 123 } }>>(true);
    // assert<IsAssignable<FilterQueryOrPrimary<Author2>, { books: { author: '123' } }>>(false); // hard to test failures

    assert<IsAssignable<FilterQuery<Author2>, { books: { title: '123' }; favouriteBook: null }>>(true);
    // assert<IsAssignable<FilterQueryOrPrimary<Author2>, { books: { title: 123 }; favouriteBook: null }>>(false); // hard to test failures
    // assert<IsAssignable<FilterQueryOrPrimary<Author2>, { books: { title: Date }; favouriteBook: null }>>(false); // hard to test failures

    assert<IsAssignable<FilterQuery<Author2>, { born: string }>>(true);
    // assert<IsAssignable<FilterQueryOrPrimary<Author2>, { born: number }>>(false); // hard to test failures
    // assert<IsAssignable<FilterQueryOrPrimary<Author2>, { born: string }>>(false); // hard to test failures

    assert<IsAssignable<FilterQuery<Author2>, { age: { $in: [1] } }>>(true);
    // assert<IsAssignable<FilterQueryOrPrimary<Author2>, { age: { $in: ['1'] } }>>(false); // hard to test failures
    // assert<IsAssignable<FilterQueryOrPrimary<Author2>, { age: { $gta: ['1'] } }>>(false); // hard to test failures

    assert<IsAssignable<FilterQuery<Author2>, { age: { $gte: number } }>>(true);
    assert<IsAssignable<FilterQuery<Author2>, { age: { $gte: number }; born: { $lt: string }; $and: [{ name: { $ne: 'John' } }, { name: { $in: ['Ben', 'Paul'] } }] }>>(true);
    assert<Has<FilterQuery<Author2>, { favouriteBook?: Book2 }>>(true);
    assert<IsAssignable<FilterQuery<Author2>, { $and: [{ favouriteBook: Book2 }, { name: string }] }>>(true);
    assert<IsAssignable<FilterQuery<Author2>, { $and: [{ favouriteBook: { title: string } }, { name: string }] }>>(true);
    assert<IsAssignable<FilterQuery<Author2>, { $and: [{ favouriteBook: string }, { name: string }] }>>(true);
    // assert<Has<FilterQuery<Author2>, Author2>>(true);
    assert<Has<FilterQuery<Author2>, number>>(true);
    assert<Has<FilterQuery<Author2>, { favouriteBook?: ExpandQuery<Book2> }>>(true);
    // assert<Has<FilterQuery<Book2>, { author: { favouriteBook?: Query<Book2> } }>>(true);
    // assert<Has<FilterQuery<Book2>, { author: { favouriteBook?: { title?: string } } }>>(true);
    assert<IsAssignable<FilterQuery<Book2>, { author: { favouriteBook: { tags: FilterValue<BookTag2> } } }>>(true);
    assert<IsAssignable<FilterQuery<Book2>, { author: { favouriteBook: { tags: BookTag2[] } } }>>(true);
    assert<IsAssignable<FilterQuery<Book2>, { author: { favouriteBook: { tags: string[] } } }>>(true);
    assert<IsAssignable<FilterQuery<Book2>, { tags: string[] }>>(true);
    assert<IsAssignable<FilterQuery<Book2>, { tags: string }>>(true);
    assert<IsAssignable<FilterQuery<Author2>, { books: { tags: number[] } }>>(true);
    assert<IsAssignable<FilterQuery<Author2>, { books: { tags: bigint[] } }>>(true);
    assert<IsAssignable<FilterQuery<Author2>, { books: { tags: string[] } }>>(true);
    assert<IsAssignable<FilterQuery<Author2>, { books: { tags: boolean[] } }>>(false);
  });

  test('assignment to naked relation, generic reference and identified reference', async () => {
    interface Publisher {
      id: number;
      name: string;
    }
    interface Book {
      id: number;
      name: string;
      publisher?: Publisher;
      publisherRef?: Reference<Publisher>;
      publisherIdRef?: Ref<Publisher>;
    }

    // simulate usage of ORM base entity so `wrap` will return its parameter
    const book = { __baseEntity: true, toReference: () => ({} as any) } as unknown as Book;
    const publisher = { __baseEntity: true, toReference: () => ({} as any) } as unknown as Publisher;

    book.publisher = publisher;
    // @ts-expect-error
    book.publisher = wrap(publisher).toReference();

    const id = book.publisherIdRef?.id;

    // @ts-expect-error
    book.publisherRef = publisher;
    book.publisherRef = wrap(publisher).toReference();

    // @ts-expect-error
    book.publisherIdRef = publisher;
    book.publisherIdRef = wrap(publisher).toReference();

    // composite keys
    const compositePks: Primary<FooParam2> = [1, 2];
    const compositeRef = {} as Ref<FooParam2>;
    const bar = compositeRef.bar;
    const baz = compositeRef.baz;
  });

  test('ObjectQuery with readonly properties (#3836)', async () => {
    interface Publisher {
      readonly id: string;
      readonly name: string;
    }
    interface User {
      readonly id: number;
      readonly name: string;
      readonly age?: number;
      readonly born?: Date;
      readonly rel?: Publisher;
      readonly relRef?: Reference<Publisher>;
      readonly relIdRef?: Ref<Publisher>;
      readonly rels?: Collection<Publisher>;
    }

    let ok01: FilterQuery<User>;
    ok01 = {};
    ok01 = { name: 'foo' };
    ok01 = { born: { $gte: new Date() } };
    ok01 = { age: { $gte: 1 } };
    ok01 = { age: 1 };
    ok01 = { rel: 'abc' };
    ok01 = { rel: ['abc'] };
    ok01 = { relRef: 'abc' };
    ok01 = { relRef: ['abc'] };
    ok01 = { relIdRef: 'abc' };
    ok01 = { relIdRef: ['abc'] };
    ok01 = { rels: 'abc' };
    ok01 = { rels: ['abc'] };
  });

  test('FilterQuery with ', async () => {
    enum ABC {
      A,
      B,
      C,
    }

    enum DEF {
      D = 'd',
      E = 'e',
      F = 'f',
    }

    interface Publisher {
      id: string;
      enum1: 'a' | 'b' | 'c';
      enum2: ABC;
      enum3: DEF;
    }

    let query: FilterQuery<Publisher>;
    query = { enum1: 'a' };
    query = { enum1: 'b' };
    // @ts-expect-error
    query = { enum1: 'd' };
    query = { enum2: ABC.A };
    // @ts-expect-error
    query = { enum2: 'a' };
    query = { enum2: ABC.A };
    // @ts-expect-error
    query = { enum2: DEF.D };
    // @ts-expect-error
    query = { enum3: 'd' };
    // @ts-expect-error
    query = { enum3: ABC.A };
    query = { enum3: DEF.D };
  });

  test('AutoPath with optional nullable properties', async () => {
    interface MessageRecipient {
      id: string;
      message?: Message | null;
    }

    interface Message {
      id: string;
      phoneService?: PhoneService | null;
      messageRecipients: Collection<MessageRecipient>;
    }

    interface PhoneService {
      id: string;
      phoneServiceVendor?: PhoneServiceVendor | null;
      messages: Collection<Message>;
    }

    interface PhoneServiceVendor {
      id: string;
      phoneService?: PhoneService;
    }

    const em = { findOne: jest.fn() as any } as EntityManager;

    await em.findOne('MessageRecipient' as EntityName<MessageRecipient>, '1', {
      populate: ['message', 'message.phoneService', 'message.phoneService.phoneServiceVendor'],
    });
  });

  test('RequiredEntityData requires required properties, and allows null only if explicitly used in the property type', async () => {
    interface User {
      id: number;
      email: string;
      foo?: string;
      bar: string | null;
    }

    let email: RequiredEntityData<User>['email'];
    email = '';
    // @ts-expect-error should not allow `null` on required props
    email = null;

    let foo: RequiredEntityData<User>['foo'];
    foo = '';
    // @ts-expect-error should not allow `null` on required props
    foo = null;

    let bar: RequiredEntityData<User>['bar'];
    bar = '';
    bar = null;
  });

  test('FilterQuery ok assignments', async () => {
    let ok01: FilterQuery<Author2>;
    ok01 = {};
    ok01 = { born: '2020-01-01' };
    ok01 = { born: { $gte: '2020-01-01' } };
    ok01 = { age: { $gte: 1 } };
    ok01 = { age: 1 };
    ok01 = { favouriteBook: '1' };
    ok01 = { favouriteBook: ['1', '2'] };
    ok01 = { favouriteBook: null };
    ok01 = { books: { author: { born: '2020-01-01' } }, favouriteBook: null };
    ok01 = { books: { author: { born: '2020-01-01' } } };
    ok01 = { books: { author: { born: '2020-01-01' } }, favouriteBook: {} as Book2 };
    ok01 = { books: { author: { born: '2020-01-01' } }, favouriteBook: {} as Book2 };
    ok01 = { books: { tags: { name: 'asd' } } };
    ok01 = { books: { tags: '1' } };
    ok01 = { books: { tags: 1 } };
    ok01 = { books: { tags: 1n } };
    ok01 = { books: { tags: { books: { title: 'asd' } } } };
    ok01 = { name: 'asd' };
    ok01 = { $or: [{ name: 'asd' }, { age: 18 }] };
    ok01 = [1, 2, 3];
    ok01 = [{} as Author2, {} as Author2, {} as Author2];

    let ok02: FilterQuery<Book2>;
    ok02 = { publisher: { $ne: undefined } };
    ok02 = { publisher: { name: 'test' } };
    ok02 = { author: { born: { $or: ['123'] } } };
    ok02 = ['1', '2', '3'];
    ok02 = [{} as Book2, {} as Book2, {} as Book2];

    let ok03: FilterQuery<FooParam2>;
    ok03 = { bar: 1, baz: 2 };
    ok03 = { bar: { name: '1' }, baz: { name: '2' } };

    let ok04: FilterQuery<Book2>;
    ok04 = { publisher: 1 };
    ok04 = { publisher: { name: 'name' } };
    ok04 = { publisher: { name: /name/ } };
    ok04 = { publisher: { name: { $like: 'name' } } };
    ok04 = { $and: [{ author: { age: { $gte: 123 } } }] };

    let ok05: FilterQuery<FooBar2>;
    ok05 = { name: '1', array: 1 };
    ok05 = { name: '1', array: [1, 2, 3] };
    ok05 = { name: '1', array: { $in: [1, 2, 3] } };

    const ok06: FilterQuery<Author2> = { name: '...' };
    ok06.age = 10;

    const ok07: FilterQuery<Author2> = {};
    ok07.age = 10;
    ok07.$or = [{ name: '231' }];
  });

  test('FilterQuery bad assignments', async () => {
    let fail01: FilterQuery<Author2>;
    // @ts-expect-error
    fail01 = { born: 123 };
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

  test('Loaded<T> type is assignable to T', async () => {
    let b1 = {} as Book2;
    b1 = {} as Loaded<Book2>;
    let b2 = {} as Book2;
    b2 = {} as Loaded<Book2, 'publisher'>;

    function test<T>() {
      let b3 = {} as T;
      b3 = {} as Loaded<T, 'publisher'>;
    }
  });

  function createEntity<T>(): T {
    const ret = {} as any;
    ret.__helper = ret;
    ret.toObject = () => ({});

    return ret;
  }

  test('Loaded type with EntityDTO (no base entities)', async () => {
    const b1 = createEntity<Loaded<Book2>>();
    const o1 = wrap(b1).toObject();
    // @ts-expect-error o1.publisher is now just number, as it's not populated
    const id1 = o1.publisher?.id;
    const b2 = createEntity<Loaded<Book2, 'publisher'>>();
    const o2 = wrap(b2).toObject();
    const id2 = o2.publisher?.id;
    // @ts-expect-error Book2 should not have methods from base entity
    const o22 = b2.toObject();
  });

  test('Loaded type with EntityDTO (with ORM base entities)', async () => {
    const b1 = createEntity<Loaded<Book>>();
    const o11 = wrap(b1).toObject();
    const o12 = b1.toObject(['id']);
    // @ts-expect-error
    const id10 = o12.id;
    // @ts-expect-error o11.publisher is now just number, as it's not populated
    const id11 = o11.publisher?.id;
    // @ts-expect-error o12.publisher is now just number, as it's not populated
    const id12 = o12.publisher?.id;
    const b2 = createEntity<Loaded<Book, 'publisher'>>();
    const o21 = wrap(b2).toObject();
    const o22 = b2.toObject();
    const id21 = o21.publisher?.id;
    const id22 = o22.publisher?.id;
    assert<IsExact<typeof id21, string | undefined>>(true);
    assert<IsExact<typeof id22, string | undefined>>(true);
  });

  test('Loaded type and assignability with extending the ORM BaseEntity (#3865)', async () => {
    interface MemberNotification extends BaseEntity {
      id: string;
      notification?: Ref<Notification>;
    }

    interface Notification extends BaseEntity {
      id: string;
    }

    const test: MemberNotification = {} as Loaded<MemberNotification, 'notification'>;
  });

  test('inference of entity type', async () => {
    interface MemberNotification {
      id: string;
      notification?: Ref<Notification>;
    }

    interface Notification {
      id: string;
    }

    const em = { findOne: jest.fn() as any } as EntityManager;
    const res: Loaded<MemberNotification> | null = await em.findOne('MemberNotification' as EntityName<MemberNotification>, {} as MemberNotification | string);
  });

  test('Ref.load() returns Loaded type (#3755)', async () => {
    interface Parent {
      id: number;
      children: Collection<Child>;
    }

    interface Child {
      id: number;
      parent: Ref<Parent>;
    }

    const parent = { loadOrFail: jest.fn() as any } as Ref<Parent>;

    // @ts-expect-error Loaded<Parent, never> is not assignable
    const populated01: Loaded<Parent, 'children'> = {} as Loaded<Ref<Parent>>;
    // @ts-expect-error Loaded<Parent, never> is not assignable
    const populated02: Loaded<Parent, 'children'> = {} as Loaded<Parent>;
    function foo(e: Loaded<Parent, 'children'>) {
      //
    }
    const e = await parent.loadOrFail();
    // @ts-expect-error Loaded<Parent, never> is not assignable
    foo(e);
    const populated1: Loaded<Parent, 'children'> = await parent.loadOrFail();
    const populated22 = await parent.loadOrFail({ populate: [] });
    // @ts-expect-error Loaded<Parent, never> is not assignable
    const populated2: Loaded<Parent, 'children'> = populated22;

    // only this should pass
    const populated3: Loaded<Parent, 'children'> = await parent.loadOrFail({ populate: ['children'] });
    const populated4: Loaded<Parent, 'children'> = await parent.loadOrFail({ populate: ['children', 'id'] });
    const populated5: Loaded<Parent, 'children'> = await parent.loadOrFail({ populate: ['children.parent'] });
  });

  test('assignability of Loaded<T> to Ref<T> via ref() helper', async () => {
    interface Node extends BaseEntity {
      id: string;
    }

    interface Author extends Node {
      name: string;
    }

    interface Publisher extends Node {
      foundingAuthor: Ref<Author>;
      publishedBooks: Collection<Book>;
    }

    interface Book extends Node {
      publishedBy: Ref<Publisher>;
    }

    const circularReferenceBook = {} as Loaded<Book, 'publishedBy.foundingAuthor'>;
    const circularReference: Ref<Book> = ref(circularReferenceBook);
  });

  test('exclusion', async () => {
    interface Notification {
      id: string;
      readonly foo: number;
      getBar(): string;
      get bar(): string;
      [OptionalProps]?: 'bar';
    }

    let q: FilterQuery<Notification>;
    q = { foo: 123 };
    q = { bar: '' }; // getter is still a property, only functions and symbols are excluded
    // @ts-expect-error
    q = { getBar: () => '' };
    // @ts-expect-error
    q = { [OptionalProps]: 'bar' };
  });

  test('tuple type after entity serializized', async () => {
    assert<IsExact<EntityDTO<Book>['point'], [number, number] | undefined>>(true);
    assert<IsExact<EntityDTO<Author>['age'], number | undefined>>(true);
  });

  test('GH #3277', async () => {
    interface Owner {
      id: number;
      vehicles: Collection<Vehicle>;
      vehicle: Ref<Vehicle>;
    }

    interface Manufacturer {
      id: number;
    }

    interface Type {
      id: number;
      owner: Ref<Owner>;
    }

    interface Vehicle {
      id: number;
      owner: Ref<Owner>;
      manufacturer: Ref<Manufacturer>;
      type: Ref<Type>;
    }

    function preloaded1(owner: Loaded<Owner, 'vehicles'>) {
      // const a: number = owner.vehicles.$[0].type.$.owner.id;
    }

    function preloaded2(owner: Loaded<Owner, 'vehicles.type'>) {
      // const a: number = owner.vehicles.$[0].type.$.owner.id;
    }

    const owner1 = {} as Loaded<Owner, 'vehicles.manufacturer' | 'vehicles.type'>;
    const owner2 = {} as Loaded<Owner, 'vehicles.type.owner.vehicles'>;
    const owner3 = {} as Loaded<Owner, 'vehicle'>;
    const owner4 = {} as Loaded<Owner>;

    preloaded1(owner1);
    preloaded1(owner2);
    // @ts-expect-error
    preloaded1(owner3);
    // @ts-expect-error
    preloaded1(owner4);
    preloaded2(owner1);
    preloaded2(owner2);
    // @ts-expect-error
    preloaded2(owner3);
    // @ts-expect-error
    preloaded2(owner4);

    // const foo = await owner1.vehicles.$.loadItems({ populate: ['owner'] });
    // const v1 = foo[0].owner.$.vehicles;
  });

  test('GH #3277 (2)', async () => {
    interface Person {
      id: number;
      foobar: Collection<FooBar>;
    }

    interface Calendar {
      id: number;
      events: Collection<CalendarEvent>;
      owner: Ref<Person>;
    }

    interface FooBar {
      id: number;
    }

    interface CalendarEvent {
      id: number;
      order: Ref<Order>;
      calendar: Ref<Calendar>;
    }

    interface Order {
      id: number;
      customer: Ref<Customer>;
      foobar: Collection<FooBar>;
    }

    interface Customer {
      foobar: Collection<FooBar>;
    }


    function preloaded(event: Loaded<CalendarEvent, 'calendar.owner'>) {
      // no-op
    }

    const event1 = {} as Loaded<CalendarEvent, 'calendar.owner' | 'order.customer.foobar'>;
    const event2 = {} as Loaded<CalendarEvent, 'calendar.owner.foobar' | 'order.customer'>;
    const event3 = {} as Loaded<CalendarEvent, 'calendar.owner' | 'order.customer'>;
    const event4 = {} as Loaded<CalendarEvent, 'calendar.owner' | 'order'>;
    const event5 = {} as Loaded<CalendarEvent, 'calendar.owner' | 'order.foobar'>;

    preloaded(event1);
    preloaded(event2);
    preloaded(event3);
    preloaded(event4);
    preloaded(event5);
  });

  test('GH #3277 (3)', async () => {
    interface ChildModel {
      id: string;
      grandChild: Ref<GrandChildModel>;
    }

    interface GrandChildModel {
      id: string;
      children: Collection<ChildModel>;
    }

    interface ParentModel {
      id: string;
      child: Ref<ChildModel>;
    }

    const childModel = {} as Loaded<ChildModel, 'grandChild'>;
    const parentModel = {} as ParentModel;
    parentModel.child = ref(childModel);

    const secondParentModel = {} as Loaded<ParentModel, 'child.grandChild'>;
    secondParentModel.child = ref(childModel);
  });

  test('GH #4962', async () => {
    interface AbstractEntity extends BaseEntity {
      id: number;
      status?: string;
    }

    class AbstractRepository<
      Entity extends AbstractEntity
    > extends EntityRepository<Entity> {

      async countWaiting() {
        return this.find({
          status: 'waiting',
        } as FilterQuery<Entity>);
      }

    }
  });

  test('GH #5006', async () => {
    interface User {
      id: number;
      name: string;
    }

    interface UserRepository extends EntityRepository<User> {
      test(): number;
    }

    const schema = new EntitySchema<User>({
      name: 'User',
      repository: () => ({} as Constructor<UserRepository>),
      properties: {
        id: { type: 'number', primary: true },
        name: { type: 'string' },
      },
    });
  });

  test('GH #5186', async () => {
    interface User {
      id: number;
      name: string | null;
    }

    type UserDTO = EntityDTO<User>;
    const dto1: UserDTO = { id: 1, name: null };
    // @ts-expect-error
    const dto2: UserDTO = { id: 1, name: undefined };
  });

  test('custom types with IType', async () => {
    const myClassSymbol = Symbol('MyClass');

    interface MyClass {
      [myClassSymbol]: true;
    }

    class MyEntity {

      myClass!: IType<MyClass, string>;

    }

    function create<T>(type: EntityName<T>, data: EntityData<T> | RequiredEntityData<T>) {
      //
    }

    create(MyEntity, { myClass: {} as MyClass });
    // @ts-expect-error
    create(MyEntity, { myClass: '...' });
    // @ts-expect-error
    create(MyEntity, { myClass: 123 });
    // @ts-expect-error
    create(MyEntity, { myClass: true });

    const o = {} as EntityDTO<MyEntity>;
    const myClass = o.myClass;
    assert<IsExact<typeof myClass, string>>(true);
  });

});
