import { Collection, MikroORM, PrimaryKeyProp } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { v4 } from 'uuid';

@Entity()
class Bar {
  @PrimaryKey({
    unique: true,
  })
  id: string = v4();

  @ManyToMany({
    entity: () => Foo,
    mappedBy: o => o.bars,
  })
  foos = new Collection<Foo>(this);
}

@Entity()
class Foo {
  @PrimaryKey({
    unique: true,
  })
  id: string = v4();

  @ManyToMany({
    entity: () => Bar,
    pivotEntity: () => FooBar,
    type: Bar,
  })
  bars = new Collection<Bar>(this);
}

@Entity()
class FooBar {
  @ManyToOne({
    entity: () => Foo,
    primary: true,
  })
  foo!: Foo;

  @ManyToOne({
    entity: () => Bar,
    primary: true,
  })
  user!: Bar;

  @OneToMany(() => Baz, baz => baz.foobar, { nullable: true, default: null })
  bazes = new Collection<Baz>(this);

  [PrimaryKeyProp]?: ['foo', 'bar'];
}

@Entity()
class Baz {
  @PrimaryKey({
    unique: true,
  })
  id: string = v4();

  @ManyToOne(() => FooBar)
  foobar!: FooBar;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [FooBar],
    dbName: ':memory:',
  });
});

afterAll(async () => {
  await orm.close(true);
});

test('1:m property inside pivot entity', async () => {
  await expect(orm.schema.getUpdateSchemaSQL()).resolves.toMatchSnapshot();
});
