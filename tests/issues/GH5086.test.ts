import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/sqlite';

@Entity()
class EntityA {

  @PrimaryKey()
  id!: number;

  @Property()
  organization!: string;

  @OneToMany({ entity: () => EntityB, mappedBy: 'entityA' })
  entities_b = new Collection<EntityB>(this);

}

@Entity()
class FieldB {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

@Entity()
class EntityB {

  @PrimaryKey()
  id!: number;

  @Property()
  organization!: string;

  @Property()
  amount!: string;

  @Property()
  fieldE!: boolean;

  @Property()
  fieldF!: boolean;

  @Property({ nullable: true })
  fieldD?: number;

  @Property({ nullable: true })
  fieldC?: number;

  @ManyToOne({ entity: () => FieldB, nullable: true })
  fieldB?: FieldB;

  @Property()
  fieldA!: boolean;

  @ManyToOne({ entity: () => EntityA, nullable: true })
  entityA?: EntityA;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [EntityA, EntityB],
  });
  await orm.schema.refreshDatabase();

  const entityA = orm.em.create(EntityA, { organization: 'orgId' });
  orm.em.create(EntityB, {
    organization: 'orgId',
    entityA,
    amount: '100',
    fieldD: 1,
    fieldC: 1,
    fieldB: { name: 'anything' },
    fieldA: false,
    fieldE: false,
    fieldF: false,
  });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('nesting $and and $or operators with complex conditions 1', async () => {
  const results = await orm.em.qb(EntityA)
    .select('*')
    .where({
      entities_b: {
        $and: [
          {
            $or: [
              {
                fieldB: {
                  id: {
                    $nin: [
                      'randomId1',
                    ],
                  },
                },
              },
            ],
          },
        ],
      },
    });
  expect(results).toHaveLength(1);
});

test('nesting $and and $or operators with complex conditions 2', async () => {
  const results = await orm.em.qb(EntityA)
    .select('*')
    .where({
      organization: 'orgId',
      entities_b: {
        organization: 'orgId',
        $and: [
          {
            $or: [
              {
                amount: {
                  $ne: 0,
                },
              },
              {
                amount: {
                  $ne: 0,
                },
              },
            ],
          },
          {
            fieldF: false,
            fieldE: false,
          },
          {
            $and: [
              {
                $or: [
                  {
                    fieldD: {
                      $nin: [
                        2,
                        3,
                      ],
                    },
                  },
                  {
                    fieldD: null,
                  },
                ],
              },
              {
                $or: [
                  {
                    fieldC: {
                      $nin: [
                        2,
                        3,
                      ],
                    },
                  },
                  {
                    fieldC: null,
                  },
                ],
              },
            ],
          },
          {
            $or: [
              {
                fieldB: {
                  id: {
                    $nin: [
                      'randomId1',
                    ],
                  },
                },
              },
              {
                fieldB: null,
              },
            ],
          },
          {
            $or: [
              {
                fieldA: false,
              },
            ],
          },
        ],
      },
    });
  expect(results).toHaveLength(1);
});
