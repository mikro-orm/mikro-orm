import {
  Collection,
  Entity,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  Property,
  Type,
  Platform,
  EntityProperty,
  ValidationError,
} from '@mikro-orm/sqlite';
import { v4 } from 'uuid';

class IdentityType extends String {

  constructor(id = v4()) {
    super(id);
  }

  public isEqual(to: IdentityType) {
    return this.valueOf() === to.valueOf();
  }

}

class MikroormIdentityType<SubType> extends Type<IdentityType, string> {

  private readonly className;

  constructor(className: new (value: string) => SubType) {
    super();
    this.className = className;
  }

  convertToDatabaseValue(value: IdentityType | string): string {
    if (typeof value === 'object') {
      if (!(value instanceof IdentityType)) {
        throw ValidationError.invalidType(MikroormIdentityType, value, 'JS');
      }
      return value.toString();
    } else if (typeof value === 'string' && value) {
      return value;
    }

    throw ValidationError.invalidType(MikroormIdentityType, value, 'JS');
  }

  compareValues(a: IdentityType | string, b: IdentityType | string): boolean {
    return a.valueOf() === b.valueOf();
  }

  convertToJSValue(value: IdentityType | string | undefined): IdentityType {
    if (!value || value instanceof IdentityType) {
      return value as IdentityType;
    }

    return new this.className(value) as IdentityType;
  }

  getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getUuidTypeDeclarationSQL({
      length: 36,
    });
  }

}

@Entity({ tableName: 'test_user' })
class User {

  @PrimaryKey({
    type: new MikroormIdentityType<IdentityType>(IdentityType),
  })
  id: IdentityType = new IdentityType();

  @Property()
  name: string;

  @OneToMany<Book, User>({
    entity: () => Book,
    mappedBy: book => book.user,
    orderBy: {
      id: 'ASC',
    },
  })
  books = new Collection<Book, this>(this);

  constructor(id: IdentityType, name: string) {
    this.id = id;
    this.name = name;
  }

}

@Entity({ tableName: 'test_books' })
class Book {

  @PrimaryKey({
    type: new MikroormIdentityType<IdentityType>(IdentityType),
  })
  id: IdentityType = new IdentityType();

  @Property()
  name: string;

  @ManyToOne<Book, User>({
    entity: () => User,
    inversedBy: user => user.books,
  })
  user: User;

  constructor(id: IdentityType, name: string, user: User) {
    this.id = id;
    this.name = name;
    this.user = user;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User, Book],
    debug: false,
    forceEntityConstructor: true,
  });
  await orm.schema.refreshDatabase();
});

beforeEach(async () => {
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test(`should don't throw error on custom type`, async () => {
  const userId = new IdentityType();
  const bookId = new IdentityType();

  orm.em.create(User, {
    id: userId,
    name: 'Foo',
    books: [{ id: bookId, name: 'book-1' }],
  });
  await orm.em.flush();
  orm.em.clear();

  await orm.em.findOne(Book, bookId, {
    populate: ['user'],
  });
});
