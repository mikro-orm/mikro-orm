import { IType, Platform, UnknownType } from '@mikro-orm/sqlite';
import { Cascade, Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property, Type } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

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

  override convertToDatabaseValue(value: Sku | string, platform: Platform): string {
    return value.toString();
  }

  override convertToJSValue(value: Sku | string, platform: Platform): Sku {
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
    this.items.add(items);
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
  readonly sku: IType<Sku, string>;

  @Property()
  quantity: number;

  @Property({ type: UnknownType, columnType: 'double' })
  singularPriceUnensured: number;

  @Property({ type: 'double' })
  singularPrice: number;

  constructor(sku: Sku, quantity: number) {
    this.sku = sku;
    this.quantity = quantity;
    this.singularPriceUnensured = 0;
    this.singularPrice = 0;
  }

  updateQuantity(quantity: number) {
    this.quantity = quantity;
  }

}

describe('GH issue 910', () => {

  test(`composite keys with custom type PK that uses object value`, async () => {
    const orm = await MikroORM.init({
      entities: [Cart, CartItem],
      dbName: ':memory:',
    });
    await orm.schema.createSchema();

    const mock = mockLogger(orm, ['query', 'query-params']);

    const id = '123';
    const item1 = orm.em.create(CartItem, { sku: 'sku1', quantity: 10 }, { partial: true, convertCustomTypes: true });
    const item2 = orm.em.create(CartItem, { sku: Sku.create('sku2'), quantity: 10 }, { partial: true });
    const cart = new Cart(id, [item1, item2]);
    await orm.em.persistAndFlush(cart);

    const item3 = new CartItem(Sku.create('sku3'), 100);
    await orm.em.flush();

    item2.updateQuantity(33);
    await orm.em.flush();

    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into `cart` (`id`) values (\'123\')');
    expect(mock.mock.calls[2][0]).toMatch('insert into `cart_item` (`cart_id`, `sku`, `quantity`, `singular_price_unensured`, `singular_price`) values (\'123\', \'sku1\', 10, 0, 0), (\'123\', \'sku2\', 10, 0, 0)');
    expect(mock.mock.calls[3][0]).toMatch('commit');
    expect(mock.mock.calls[4][0]).toMatch('begin');
    expect(mock.mock.calls[5][0]).toMatch('update `cart_item` set `quantity` = 33 where `cart_id` = \'123\' and `sku` = \'sku2\'');
    expect(mock.mock.calls[6][0]).toMatch('commit');
    await orm.close();
  });

});
