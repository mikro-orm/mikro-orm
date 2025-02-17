import { Entity, PrimaryKey, ManyToOne, MikroORM, OneToOne, Rel, Unique } from '@mikro-orm/postgresql';
import { EntityGenerator } from '@mikro-orm/entity-generator';

@Entity({ tableName: 'quote_settings' })
class QuoteSettings {

  @PrimaryKey({ type: 'integer' })
  id!: number;

  @OneToOne({ entity: () => Org, fieldName: 'org_id', updateRule: 'cascade', deleteRule: 'cascade' })
  org!: Rel<Org>;

  @OneToOne({
    entity: () => UserGroup,
    fieldNames: ['user_group_id', 'org_id'],
    referencedColumnNames: ['id', 'org_id'],
    updateRule: 'cascade',
    deleteRule: 'cascade',
    nullable: true,
    unique: 'quote_settings_user_group_id_key',
  })
  user_group?: Rel<UserGroup>;

}

@Entity({ tableName: 'quote_settings' })
class InvalidQuoteSettings {

  @PrimaryKey({ type: 'integer' })
  id!: number;

  @OneToOne({ entity: () => Org, fieldName: 'org_id', updateRule: 'cascade', deleteRule: 'cascade' })
  org!: Rel<Org>;

  @OneToOne({
    entity: () => UserGroup,
    fieldNames: ['user_group_id', 'org_id'],
    updateRule: 'cascade',
    deleteRule: 'cascade',
    nullable: true,
    unique: 'quote_settings_user_group_id_key',
  })
  user_group?: Rel<UserGroup>;

}

@Entity({ tableName: 'user_group' })
@Unique({ name: 'user_group_id_org_id_key', properties: ['id', 'org'] })
class UserGroup {

  @PrimaryKey({ type: 'integer' })
  id!: number;

  @ManyToOne({ entity: () => Org, fieldName: 'org_id' })
  org!: Rel<Org>;

}

@Entity({ tableName: 'org' })
class Org {

  @PrimaryKey({ type: 'integer' })
  id!: number;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Org, UserGroup, QuoteSettings],
    dbName: '6323',
    extensions: [EntityGenerator],
  });
});

afterAll(() => orm.close(true));

test('GH #6323', async () => {
  await orm.schema.refreshDatabase();
});

test('entity generator', async () => {
  const ret = await orm.entityGenerator.generate();
  expect(ret).toMatchSnapshot();
});

test('validation', async () => {
  await expect(MikroORM.init({
    entities: [Org, UserGroup, InvalidQuoteSettings],
    dbName: '6323',
    connect: false,
  })).rejects.toThrow(`InvalidQuoteSettings.user_group requires explicit 'referencedColumnNames' option, since the 'joinColumns' are not matching the length.`);
});
