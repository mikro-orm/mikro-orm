import { Collection, EagerProps, EventArgs, Hidden, MikroORM, Opt, quote, Rel, sql, wrap } from '@mikro-orm/sqlite';
import {
  AfterCreate,
  AfterDelete,
  AfterUpdate,
  BeforeCreate,
  BeforeDelete,
  BeforeUpdate,
  Check,
  Embeddable,
  Embedded,
  Entity,
  Index,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  OnInit,
  OnLoad,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/es';

@Entity()
class A {

  @PrimaryKey({ type: 'number' })
  id!: number;

  @OneToOne(() => B)
  b!: Rel<B>;

  @Property({ type: String })
  prop!: string;

}

@Entity()
class C {

  [EagerProps]?: 'bCollection';

  @PrimaryKey({ type: Number })
  id!: number;

  @OneToOne(() => A)
  a!: A;

  @OneToMany(() => B, b => b.c, { eager: true })
  bCollection = new Collection<B>(this);

  @ManyToMany(() => B)
  manyBs = new Collection<B>(this);

}

@Entity()
class B {

  @PrimaryKey({ type: Number })
  id!: number;

  @OneToOne(() => A, a => a.b, { eager: true })
  a!: A;

  @ManyToOne(() => C, { nullable: true })
  c?: C;

  @Property({ type: String })
  @Check({ expression: c => quote`${c.prop} <> 'data'` })
  prop!: string;

}

@Embeddable()
class Identity {

  @Property({ type: 'string', hidden: true })
  foo: string & Hidden;

  @Property({ type: 'integer', hidden: true, check: c => `${c.bar} > 0` })
  bar: Hidden<number>;

  constructor(foo: string, bar: number) {
    this.foo = foo;
    this.bar = bar;
  }

  @Property({ type: 'string', persist: false })
  get fooBar() {
    return this.foo + ' ' + this.bar;
  }

}

@Entity()
@Index({ properties: ['name', 'age'] })
@Index({ name: 'custom_idx_name_123', properties: ['name'] })
@Unique({ properties: ['name', 'email'] })
class Author {

  static beforeDestroyCalled = 0;
  static afterDestroyCalled = 0;

  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ default: sql.now() })
  createdAt: Opt<Date> = new Date();

  @Property({ onUpdate: () => new Date(), default: sql.now() })
  updatedAt: Opt<Date> = new Date();

  @Property({ type: 'string' })
  name: string;

  @Property({ type: 'string', unique: 'custom_email_unique_name', groups: ['personal', 'admin'] })
  @Index({ name: 'custom_email_index_name' })
  email: string;

  @Property({ type: 'integer', nullable: true, default: null, groups: ['personal', 'admin'] })
  age?: number;

  @Index()
  @Property({ type: 'boolean', groups: ['admin'] })
  termsAccepted: Opt<boolean> = false;

  @Property({ type: 'boolean', nullable: true, groups: ['personal'] })
  optional?: boolean;

  @Property({ type: 'string[]', nullable: true, groups: ['admin'] })
  identities?: string[];

  @Property({ type: 'date', index: true, nullable: true, groups: ['personal', 'admin'] })
  born?: string;

  @ManyToMany({ entity: () => Author, pivotTable: 'author_to_friend', groups: ['personal'] })
  friends = new Collection<Author>(this);

  @ManyToMany(() => Author, undefined, { groups: ['personal'] })
  following = new Collection<Author>(this);

  @ManyToMany(() => Author, a => a.following, { groups: ['personal'] })
  followers = new Collection<Author>(this);

  @ManyToOne(() => Author, { nullable: true, groups: ['personal'] })
  favouriteAuthor?: Author | null;

  @Embedded(() => Identity, { nullable: true, object: true, groups: ['personal', 'admin'] })
  identity?: Identity;

  @Property({ type: 'integer', persist: false })
  version!: number & Opt;

  @Property({ type: 'string', persist: false })
  versionAsString!: string & Opt;

  @Property({ type: 'string', persist: false, groups: ['admin'] })
  code!: string & Opt;

  @Property({ type: 'integer', persist: false })
  booksTotal!: number & Opt;

  hookParams: any[] & Opt = [];
  onLoadCalled?: number;

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }

  @OnInit()
  onInit() {
    this.code = `${this.email} - ${this.name}`;
    this.hookParams = [];
  }

  @OnLoad()
  onLoad() {
    this.onLoadCalled = this.onLoadCalled ? this.onLoadCalled + 1 : 1;
  }

  @BeforeCreate()
  beforeCreate(args: EventArgs<this>) {
    this.version = 1;
    this.hookParams.push(args);
  }

  @AfterCreate()
  afterCreate(args: EventArgs<this>) {
    this.versionAsString = 'v' + this.version;
    this.hookParams.push(args);
  }

  @BeforeUpdate()
  beforeUpdate(args: EventArgs<this>) {
    this.version += 1;
    this.hookParams.push(args);
  }

  @AfterUpdate()
  afterUpdate(args: EventArgs<this>) {
    this.versionAsString = 'v' + this.version;
    this.hookParams.push(args);
  }

  @BeforeDelete()
  beforeDelete() {
    Author.beforeDestroyCalled += 1;
  }

  @AfterDelete()
  afterDelete() {
    Author.afterDestroyCalled += 1;
  }

  @Property({ name: 'code', groups: ['admin'] })
  getCode(): string & Opt {
    return `${this.email} - ${this.name}`;
  }

  @Property({ type: 'string', persist: false, groups: ['admin'] })
  get code2(): string & Opt {
    return `${this.email} - ${this.name}`;
  }

}

describe('GH issue 222', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B, C, Author],
      dbName: ':memory:',
    });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  test('cascade persist with pre-filled PK and with cycles', async () => {
    const a = new A();
    a.id = 1;
    a.prop = 'data1';
    const b = new B();
    b.id = 1;
    a.b = b;
    b.prop = 'my name is b';
    const c = new C();
    c.id = 1;
    c.a = a;
    c.bCollection.add(b);
    await orm.em.persist(c).flush();
    orm.em.clear();

    const cc = await orm.em.findOneOrFail(C, c.id);
    expect(cc.id).toBeDefined();
    expect(cc.a.id).toBeDefined();
    expect(cc.bCollection[0].id).toBeDefined();
    expect(cc.bCollection[0].a.id).toBe(cc.a.id);
  });

  test('toObject() with cycles', async () => {
    const a = new A();
    a.prop = 'data2';
    const b = new B();
    a.b = b;
    b.prop = 'my name is b';
    const c = new C();
    c.a = a;
    c.bCollection.add(b);
    await orm.em.persist(c).flush();
    orm.em.clear();

    const cc = await orm.em.findOneOrFail(C, c.id, { populate: ['a'] });
    expect(cc.bCollection.count()).toBe(1);
    expect(cc.a.prop).toEqual(cc.bCollection[0].a.prop);
    const ccJson = wrap(cc).toJSON();
    expect(ccJson.a.prop).toEqual(ccJson.bCollection[0].a.prop);
  });

  test('hooks', async () => {
    Author.beforeDestroyCalled = 0;
    Author.afterDestroyCalled = 0;
    const repo = orm.em.getRepository(Author);
    const author = repo.create({ name: 'Jon Snow', email: 'snow@wall.st' });
    expect(author.id).toBeUndefined();
    expect(author.version).toBeUndefined();
    expect(author.versionAsString).toBeUndefined();
    expect(author.code).toBe('snow@wall.st - Jon Snow');

    await orm.em.persist(author).flush();
    expect(author.id).toBeDefined();
    expect(author.version).toBe(1);
    expect(author.versionAsString).toBe('v1');

    author.name = 'John Snow';
    await orm.em.persist(author).flush();
    expect(author.version).toBe(2);
    expect(author.versionAsString).toBe('v2');

    expect(Author.beforeDestroyCalled).toBe(0);
    expect(Author.afterDestroyCalled).toBe(0);
    await orm.em.remove(author).flush();
    expect(Author.beforeDestroyCalled).toBe(1);
    expect(Author.afterDestroyCalled).toBe(1);

    const author2 = new Author('Johny Cash', 'johny@cash.com');
    await orm.em.persist(author2).flush();
    await orm.em.remove(author2).flush();
    expect(Author.beforeDestroyCalled).toBe(2);
    expect(Author.afterDestroyCalled).toBe(2);
  });

});
