import { MikroORM, type Options } from '@mikro-orm/postgresql';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { PrimaryKeyProp, type Rel } from '@mikro-orm/core';

@Entity()
class User {
  @PrimaryKey({ type: 'varchar', length: 26, collation: 'C' })
  id!: string;

  @Property({ type: 'varchar', length: 26, collation: 'POSIX', unique: true })
  slug!: string;
}

@Entity()
class Session {
  @PrimaryKey({ type: 'varchar', length: 26, collation: 'C' })
  id!: string;

  @ManyToOne(() => User)
  user!: Rel<User>;

  @ManyToOne(() => User, { collation: 'POSIX' })
  reviewer!: Rel<User>;

  @ManyToOne(() => User, { targetKey: 'slug' })
  owner!: Rel<User>;
}

@Entity()
class CompositeUser {
  @PrimaryKey({ type: 'varchar', length: 26, collation: 'C' })
  tenant!: string;

  @PrimaryKey({ type: 'varchar', length: 26, collation: 'POSIX' })
  code!: string;

  [PrimaryKeyProp]?: ['tenant', 'code'];
}

@Entity()
class CompositeSession {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => CompositeUser)
  user!: Rel<CompositeUser>;
}

async function bootstrap(entities: any[]) {
  return MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities,
    dbName: 'mikro_orm_test_fk_collation',
    connect: false,
  } as Options);
}

describe('FK collation inheritance [postgres]', () => {
  test('FK column inherits collation from referenced key unless set explicitly', async () => {
    const orm = await bootstrap([User, Session]);
    const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql).toContain('"user_id" varchar(26) collate "C" not null');
    expect(sql).toContain('"reviewer_id" varchar(26) collate "POSIX" not null');
    expect(sql).toContain('"owner_id" varchar(26) collate "POSIX" not null');
    await orm.close(true);
  });

  test('composite FK does not inherit collation', async () => {
    const orm = await bootstrap([CompositeUser, CompositeSession]);
    const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql).toContain('"user_tenant" varchar(26) not null');
    expect(sql).toContain('"user_code" varchar(26) not null');
    await orm.close(true);
  });
});
