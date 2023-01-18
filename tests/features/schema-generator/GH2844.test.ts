import { Entity, Index, ManyToOne, OneToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/mariadb';

@Entity()
export class UserAction {

  @PrimaryKey()
  idUserAction!: string;

  @Property()
  name!: string;

}

@Entity()
@Index({ properties: ['id', 'userAction'] })
export class Step {

  @PrimaryKey()
  id!: number;

  @ManyToOne({ primary: true, onDelete: 'cascade' })
  userAction!: UserAction;

}

@Entity()
export class Component {

  @PrimaryKey()
  idComponent!: string;

  @ManyToOne({ onDelete: 'cascade' })
  step!: Step;

  @OneToOne({
    nullable: true,
    fieldName: 'resultComponentId',
    unique: false,
    entity: () => Component,
  })
  resultComponent?: Component;

}

describe('complex FKs in mariadb (GH 2844)', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Component, Step, UserAction],
      dbName: `mikro_orm_test_gh_2844`,
      port: 3309,
    });
    await orm.schema.ensureDatabase();
    await orm.schema.dropSchema();
  });

  afterAll(() => orm.close(true));

  test('schema generator adds the m:1 columns and FK properly', async () => {
    const sql = await orm.schema.getCreateSchemaSQL();
    expect(sql).toMatchSnapshot();
    await orm.schema.execute(sql);
  });

});
