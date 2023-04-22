import { MikroORM } from '@mikro-orm/mysql';
import { Collection, LoadStrategy, Entity, ManyToMany, PrimaryKey, Property, Type } from '@mikro-orm/core';
import { parse, stringify, v1 } from 'uuid';

let orm: MikroORM;

class UuidBinaryType extends Type<string, Buffer> {

  convertToDatabaseValue(uuid: string) {
    return Buffer.from(parse(uuid));
  }

  convertToJSValue(bin: Buffer) {
    return stringify(bin);
  }

  getColumnType() {
    return 'binary(16)';
  }

}

@Entity()
export class Customer {

  @PrimaryKey({ type: UuidBinaryType })
  uuid: string = v1();

  @Property()
  name!: string;

  @ManyToMany(() => Role)
  roles = new Collection<Role>(this);

}

@Entity()
export class Role {

  @PrimaryKey({ type: UuidBinaryType })
  uuid: string = v1();

  @Property()
  name!: string;

  @ManyToMany(() => Customer, 'roles')
  customers = new Collection<Customer>(this);

}

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'gh-4219',
    entities: [Customer, Role],
    port: 3308,
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test(`GH issue 4219`, async () => {
  const roles = [
    orm.em.create(Role, { name: 'customer' }),
    orm.em.create(Role, { name: 'reseller' }),
  ];
  const customers = Array(1000)
    .fill(0)
    .map((el, index) =>
      orm.em.create(Customer, {
        name: `customer-${index}`,
        roles: [roles[index % roles.length]],
      }),
    );

  await orm.em.flush();

  const newEm = orm.em.fork();
  const customersByJoined = await newEm
    .getRepository(Customer)
    .findAll({ strategy: LoadStrategy.JOINED, populate: ['roles.name'] });

  const customersBySelectIn = await newEm
    .getRepository(Customer)
    .findAll({ populate: ['roles.name'] });

  expect(customersByJoined.length).toBe(customersBySelectIn.length);
});
