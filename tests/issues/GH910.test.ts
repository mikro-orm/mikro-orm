import type { Platform } from '@mikro-orm/core';
import { Cascade, Collection, Entity, Logger, ManyToOne, MikroORM, OneToMany, PrimaryKey, PrimaryKeyType, Property, Type } from '@mikro-orm/core';

export class Sku {

  private constructor(private readonly value: string) {}

  static create(value: string): Sku {
    return new Sku(value);
  }

  toString(): string {
    return this.value;
  }

}

export class SkuType extends Type<Sku, string> {

  convertToDatabaseValue(value: Sku | string, platform: Platform, fromQuery?: boolean): string {
    return value.toString();
  }

  convertToJSValue(value: Sku | string, platform: Platform): Sku {
    if (value instanceof Sku) {
      return value;
    }

    return Sku.create(value);
  }

}

@Entity()
export class Cart {

  @PrimaryKey()
  readonly id: string;

  @OneToMany({ entity: 'CartItem', mappedBy: 'cart', cascade: [Cascade.MERGE, Cascade.PERSIST] })
  readonly items = new Collection<CartItem>(this);

  constructor(id: string, items: CartItem[]) {
    this.id = id;
    this.items.add(...items);
  }

  addItem(item: CartItem): void {
    this.items.add(item);
  }

  removeItem(item: CartItem): void {
    this.items.remove(item);
  }

}

@Entity()
export class CartItem {

  @ManyToOne({ primary: true, entity: 'Cart' })
  readonly cart!: Cart;

  @PrimaryKey({ type: SkuType })
  readonly sku: Sku;

  [PrimaryKeyType]: [string, string];

  @Property()
  quantity: number;

  constructor(sku: Sku, quantity: number) {
    this.sku = sku;
    this.quantity = quantity;
  }

  updateQuantity(quantity: number) {
    this.quantity = quantity;
  }

}

describe('GH issue 910', () => {

  test(`composite keys with custom type PK that uses object value`, async () => {
    const orm = await MikroORM.init({
      entities: [Cart, CartItem],
      type: 'sqlite',
      dbName: ':memory:',
    });
    await orm.getSchemaGenerator().createSchema();

    const mock = jest.fn();
    const logger = new Logger(mock, ['query', 'query-params']);
    Object.assign(orm.config, { logger });

    const id = '123';
    const item1 = new CartItem(Sku.create('sku1'), 10);
    const item2 = new CartItem(Sku.create('sku2'), 10);
    const cart = new Cart(id, [item1, item2]);
    await orm.em.persistAndFlush(cart);

    const item3 = new CartItem(Sku.create('sku3'), 100);
    await orm.em.flush();

    item2.updateQuantity(33);
    await orm.em.flush();

    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into `cart` (`id`) values (\'123\')');
    expect(mock.mock.calls[2][0]).toMatch('insert into `cart_item` (`cart_id`, `sku`, `quantity`) values (\'123\', \'sku1\', 10), (\'123\', \'sku2\', 10)');
    expect(mock.mock.calls[3][0]).toMatch('commit');
    expect(mock.mock.calls[4][0]).toMatch('begin');
    expect(mock.mock.calls[5][0]).toMatch('update `cart_item` set `quantity` = 33 where `cart_id` = \'123\' and `sku` = \'sku2\'');
    expect(mock.mock.calls[6][0]).toMatch('commit');
    await orm.close();
  });

});
