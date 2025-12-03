import { AbstractSchemaGenerator, Configuration } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

class MySchemaGenerator extends AbstractSchemaGenerator<any> { }

describe('AbstractSchemaGenerator', () => {

  test('default validations for not implemented methods', async () => {
    const config = new Configuration({ driver: SqliteDriver }, false);
    const driver = new SqliteDriver(config);
    const generator = new MySchemaGenerator(driver);
    await expect(generator.create()).rejects.toThrow('This method is not supported by SqliteDriver driver');
    await expect(generator.ensureDatabase()).rejects.toThrow('This method is not supported by SqliteDriver driver');
    await expect(generator.getCreateSchemaSQL()).rejects.toThrow('This method is not supported by SqliteDriver driver');
    await expect(generator.drop()).rejects.toThrow('This method is not supported by SqliteDriver driver');
    await expect(generator.getDropSchemaSQL()).rejects.toThrow('This method is not supported by SqliteDriver driver');
    await expect(generator.update()).rejects.toThrow('This method is not supported by SqliteDriver driver');
    await expect(generator.getUpdateSchemaSQL()).rejects.toThrow('This method is not supported by SqliteDriver driver');
    await expect(generator.getUpdateSchemaMigrationSQL()).rejects.toThrow('This method is not supported by SqliteDriver driver');
    await expect(generator.createDatabase('')).rejects.toThrow('This method is not supported by SqliteDriver driver');
    await expect(generator.dropDatabase('')).rejects.toThrow('This method is not supported by SqliteDriver driver');
    await expect(generator.execute('')).rejects.toThrow('This method is not supported by SqliteDriver driver');
    await expect(generator.ensureIndexes()).rejects.toThrow('This method is not supported by SqliteDriver driver');
  });

});
