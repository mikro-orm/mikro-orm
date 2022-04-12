import { Entity, MikroORM, PrimaryKey } from '@mikro-orm/core';
import { SchemaGenerator } from '@mikro-orm/knex';

@Entity()
export class User {

  @PrimaryKey()
  id: number;

  constructor(id: number) {
    this.id = id;
  }

}

describe('GH issue 3004', () => {

  let orm: MikroORM | undefined;

  const getDropSchemaSQLSpy = jest.spyOn(SchemaGenerator.prototype, 'getDropSchemaSQL');
  getDropSchemaSQLSpy.mockImplementation(() => Promise.resolve(''));

  afterEach(async () => {
    await orm?.close(true);
    orm = undefined;
  });

  afterAll(async () => {
    getDropSchemaSQLSpy.mockRestore();
  });

  it('should pass to getDropSchemaSQL method options {wrap: false} when disableForeignKeys is set to false', async () => {
    orm = await MikroORM.init({
      entities: [User],
      dbName: `:memory:`,
      type: 'better-sqlite',
      schemaGenerator: {
        disableForeignKeys: false,
      },
    });
    await orm.getSchemaGenerator().dropSchema();
    expect(getDropSchemaSQLSpy).toBeCalledWith({ wrap: false });
  });

  it('should pass to getDropSchemaSQL method options {wrap: true} by default', async () => {
    orm = await MikroORM.init({
      entities: [User],
      dbName: `:memory:`,
      type: 'better-sqlite',
    });
    await orm.getSchemaGenerator().dropSchema();
    expect(getDropSchemaSQLSpy).toBeCalledWith({ wrap: true });
  });
});
