import { MikroORM, Entity, ManyToOne, OneToOne, PrimaryKey, Property } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class Rate {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @OneToOne('Application', 'rate1')
  application1?: any;

  @OneToOne('Application', 'rate3')
  application3?: any;

  constructor(name: string) {
    this.name = name;
  }

}

@Entity()
export class Application {

  @PrimaryKey()
  id!: number;

  @OneToOne({ fieldName: 'application_rate1_id' })
  rate1!: Rate;

  @ManyToOne({ fieldName: 'application_rate2_id' })
  rate2!: Rate;

  @OneToOne({ joinColumn: 'application_rate3_id' })
  rate3!: Rate;

  @ManyToOne({ joinColumn: 'application_rate4_id' })
  rate4!: Rate;

}

describe('GH issue 557', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Application, Rate],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test('GH issue 557', async () => {
    const a = new Application();
    a.rate1 = new Rate('r1');
    a.rate2 = new Rate('r2');
    a.rate3 = new Rate('r3');
    a.rate4 = new Rate('r4');
    await orm.em.persistAndFlush(a);
    orm.em.clear();

    const res = await orm.em.findOneOrFail(Application, a, { populate: ['rate1', 'rate2', 'rate3', 'rate4'] });
    expect(res.rate1.name).toBe('r1');
    expect(res.rate2.name).toBe('r2');
    expect(res.rate3.name).toBe('r3');
    expect(res.rate4.name).toBe('r4');
  });

});
