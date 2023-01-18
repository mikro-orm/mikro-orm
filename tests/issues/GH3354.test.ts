import { BaseEntity, Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class Group extends BaseEntity<Group, 'id'> {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => Group, { nullable: true })
  parent?: Group;

  @OneToMany(() => Group, group => group.parent, { eager: true })
  subGroups = new Collection<Group>(this);

}

let orm: MikroORM<SqliteDriver>;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Group],
    dbName: ':memory:',
    driver: SqliteDriver,
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test(`GH issue 3354`, async () => {
  const group = orm.em.create(Group, {
    id: 1,
    name: 'Parent Group',
    subGroups: [
      {
        id: 2,
        name: 'SubGroup Level 1',
        subGroups: [
          {
            id: 3,
            name: 'SubGroup Level 2',
            subGroups: [
              {
                id: 4,
                name: 'SubGroup Level 3',
                subGroups: [
                  {
                    id: 5,
                    name: 'SubGroup Level 4',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });

  await orm.em.persist(group).flush();
  orm.em.clear();

  const g = await orm.em.findOneOrFail(Group, group);
  const output = g!.toPOJO();
  expect(JSON.stringify(output, null, 2)).toBe('{\n' +
    '  "id": 1,\n' +
    '  "name": "Parent Group",\n' +
    '  "parent": null,\n' +
    '  "subGroups": [\n' +
    '    {\n' +
    '      "id": 2,\n' +
    '      "name": "SubGroup Level 1",\n' +
    '      "parent": {\n' +
    '        "id": 1,\n' +
    '        "name": "Parent Group"\n' +
    '      },\n' +
    '      "subGroups": [\n' +
    '        {\n' +
    '          "id": 3,\n' +
    '          "name": "SubGroup Level 2",\n' +
    '          "parent": {\n' +
    '            "id": 2,\n' +
    '            "name": "SubGroup Level 1"\n' +
    '          },\n' +
    '          "subGroups": [\n' +
    '            {\n' +
    '              "id": 4,\n' +
    '              "name": "SubGroup Level 3",\n' +
    '              "parent": {\n' +
    '                "id": 3,\n' +
    '                "name": "SubGroup Level 2"\n' +
    '              },\n' +
    '              "subGroups": [\n' +
    '                {\n' +
    '                  "id": 5,\n' +
    '                  "name": "SubGroup Level 4",\n' +
    '                  "parent": {\n' +
    '                    "id": 4,\n' +
    '                    "name": "SubGroup Level 3"\n' +
    '                  },\n' +
    '                  "subGroups": []\n' +
    '                }\n' +
    '              ]\n' +
    '            }\n' +
    '          ]\n' +
    '        }\n' +
    '      ]\n' +
    '    }\n' +
    '  ]\n' +
    '}');
});
