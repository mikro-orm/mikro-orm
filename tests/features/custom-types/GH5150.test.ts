import { Entity, MikroORM, PrimaryKey, Property, Type } from '@mikro-orm/sqlite';

class EncryptedStringType extends Type<string> {

  convertToDatabaseValue(value: string): string {
    if (value !== 'decrypted') {
      throw new Error();
    }

    return 'encrypted';
  }

  convertToJSValue(value: string): string {
    if (value !== 'encrypted') {
      throw new Error();
    }

    return 'decrypted';
  }

}

@Entity()
class Test {

  @PrimaryKey()
  id!: number;

  @Property({ type: EncryptedStringType })
  value: string;

  constructor(value: string) {
    this.value = value;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Test],
    dbName: ':memory:',
  });

  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('#5150', async () => {
  orm.em.create(Test, { value: 'decrypted' });
  await orm.em.flush();
});
