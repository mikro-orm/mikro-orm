import { MikroORM, Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/better-sqlite';

@Entity()
class Door {

  @PrimaryKey({ autoincrement: false })
  id!: number;

  @Property()
  label!: string;

  @Property({ default: true })
  isEnabled!: boolean;

  @Property()
  state!: 'open' | 'closed';

}

@Entity({ tableName: 'sequence' })
class Sequence0 {

  @PrimaryKey()
  id!: number;

  @Property()
  index!: number;

  @Property()
  action!: 'on' | 'off' | 'low' | 'high';

  @Property()
  target!:
    | 'relay1'
    | 'relay2'
    | 'relay3'
    | 'digitalOutput1'
    | 'digitalOutput2'
    | 'digitalOutput3';

  @Property()
  duration!: number;

  @ManyToOne(() => Door)
  door!: Door;

}

@Entity({ tableName: 'sequence' })
class Sequence1 {

  @PrimaryKey()
  id!: number;

  @Property()
  index!: number;

  @Property()
  action!: 'on' | 'off' | 'low' | 'high';

  @Property({ nullable: true })
  anotherProperty?: string;

  @Property()
  target!:
    | 'relay1'
    | 'relay2'
    | 'relay3'
    | 'digitalOutput1'
    | 'digitalOutput2'
    | 'digitalOutput3';

  @Property()
  duration!: number;

  @ManyToOne(() => Door)
  door!: Door;

}

describe('dropping tables with FKs in postgres', () => {

  test('schema generator removes stale FKs on target table dropping 1', async () => {
    const orm = await MikroORM.init({
      entities: [Sequence0, Door],
      dbName: `:memory:`,
      metadataCache: { enabled: false },
    });
    await orm.schema.refreshDatabase();

    orm.discoverEntity(Sequence1, 'Sequence0');
    const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toMatchSnapshot();
    await orm.schema.execute(diff1);

    await orm.close(true);
  });

});
