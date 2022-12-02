import { AbstractSchemaGenerator, Configuration } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

class MySchemaGenerator extends AbstractSchemaGenerator<any> { }

describe('AbstractSchemaGenerator', () => {

  test('default validations for not implemented methods', async () => {
    const config = new Configuration({ driver: SqliteDriver }, false);
    const driver = new SqliteDriver(config);
    const generator = new MySchemaGenerator(driver);
    await expect(generator.generate()).rejects.toThrowError('This method is not supported by SqliteDriver driver');
    await expect(generator.createSchema()).rejects.toThrowError('This method is not supported by SqliteDriver driver');
    await expect(generator.ensureDatabase()).rejects.toThrowError('This method is not supported by SqliteDriver driver');
    await expect(generator.getCreateSchemaSQL()).rejects.toThrowError('This method is not supported by SqliteDriver driver');
    await expect(generator.dropSchema()).rejects.toThrowError('This method is not supported by SqliteDriver driver');
    await expect(generator.getDropSchemaSQL()).rejects.toThrowError('This method is not supported by SqliteDriver driver');
    await expect(generator.updateSchema()).rejects.toThrowError('This method is not supported by SqliteDriver driver');
    await expect(generator.getUpdateSchemaSQL()).rejects.toThrowError('This method is not supported by SqliteDriver driver');
    await expect(generator.getUpdateSchemaMigrationSQL()).rejects.toThrowError('This method is not supported by SqliteDriver driver');
    await expect(generator.createDatabase('')).rejects.toThrowError('This method is not supported by SqliteDriver driver');
    await expect(generator.dropDatabase('')).rejects.toThrowError('This method is not supported by SqliteDriver driver');
    await expect(generator.execute('')).rejects.toThrowError('This method is not supported by SqliteDriver driver');
    await expect(generator.ensureIndexes()).rejects.toThrowError('This method is not supported by SqliteDriver driver');
  });

});
