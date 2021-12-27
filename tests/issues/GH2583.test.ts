import { Entity, MikroORM, PrimaryKey, Enum, EntityManager } from '@mikro-orm/core';
import type { PostgreSqlDriver } from '@mikro-orm/postgresql';

export enum WithEnumArrayValue {
    First = 'first',
    Second = 'second',
    Third = 'third'
}

@Entity()
export class WithEnumArray {

    @PrimaryKey()
    id!: number;

    @Enum({ items: () => WithEnumArrayValue, array: true })
    values!: WithEnumArrayValue[];

}

async function getOrmInstance(): Promise<MikroORM<PostgreSqlDriver>> {
    const orm = await MikroORM.init({
        entities: [WithEnumArray],
        dbName: 'mikro_orm_test_2583',
        type: 'postgresql',
    });

    return orm as MikroORM<PostgreSqlDriver>;
}

describe('GH issue 2583', () => {
    let orm: MikroORM<PostgreSqlDriver>;
    let em: EntityManager;

    beforeAll(async () => {
        orm = await getOrmInstance();
        await orm.getSchemaGenerator().dropDatabase('mikro_orm_test_2583');
        await orm.getSchemaGenerator().createDatabase('mikro_orm_test_2583');
    });

    afterAll(async () => {
        await orm.close();
    });

    beforeEach(() => {
        em = orm.em.fork();
    });

    describe('enum array values', () => {

        beforeAll(async () => {
            const orm = await getOrmInstance();

            await orm.em.getConnection().execute(
                `
        drop table if exists with_enum_array cascade;
        drop type if exists with_enum_array_value;

        create type with_enum_array_value as enum ('first', 'second', 'third');
        create table with_enum_array (id serial primary key, values with_enum_array_value[] not null);
          `,
            );
            await orm.close();
        });

        afterAll(() => orm.close(true));

        test('values are properly marshalled/unmarshalled', async () => {
            const values = [WithEnumArrayValue.First, WithEnumArrayValue.Second];
            const entity = new WithEnumArray();
            entity.values = values;

            await orm.em.persistAndFlush(entity);
            orm.em.clear();

            const expected = await orm.em.findOneOrFail(WithEnumArray, entity.id);
            expect(expected.values).toEqual(values);
        });

        test('empty array', async () => {
            const entity = new WithEnumArray();
            entity.values = [];

            await orm.em.persistAndFlush(entity);
            orm.em.clear();

            const expected = await orm.em.findOneOrFail(WithEnumArray, entity.id);
            expect(expected.values).toEqual([]);
        });

    });

});
