import { defineEntity, p } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/mysql';
import { mockLogger } from '../helpers.js';

interface Payment {
  amount: string;
  cheque_date: string;
  cheque_notes: string | null;
  payment_method: string;
}

interface OrderItem {
  product_id: number;
  quantity: number;
  price: number;
  name: string;
}

interface Tag {
  name: string;
  priority: number;
}

const BalanceMove = defineEntity({
  name: 'BalanceMove',
  properties: {
    id: p.integer().autoincrement().primary(),
    payments: p.json().$type<Payment[]>(),
    metadata: p.json().$type<Record<string, unknown>>().nullable(),
  },
});

const Order = defineEntity({
  name: 'Order',
  properties: {
    id: p.integer().autoincrement().primary(),
    items: p.json().$type<OrderItem[]>(),
    tags: p.json().$type<Tag[]>().nullable(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = new MikroORM({
    entities: [BalanceMove, Order],
    dbName: 'mikro_orm_test_elem_match',
    port: 3308,
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

describe('$elemMatch operator for JSON arrays (MySQL)', () => {

  test('simple equality matching', async () => {
    const mock = mockLogger(orm);

    await orm.em.findAll(BalanceMove, {
      where: {
        payments: {
          $elemMatch: { payment_method: '7' },
        },
      },
    });

    // Simple equality uses optimized JSON_CONTAINS
    expect(mock.mock.calls[0][0]).toMatch(/json_contains\(`b0`\.`payments`, '/);
    expect(mock.mock.calls[0][0]).toMatch(/payment_method/);
  });

  test('$in operator inside $elemMatch', async () => {
    const mock = mockLogger(orm);

    await orm.em.findAll(BalanceMove, {
      where: {
        payments: {
          $elemMatch: { payment_method: { $in: ['7', '8', '9'] } },
        },
      },
    });

    expect(mock.mock.calls[0][0]).toMatch(
      /exists \(select 1 from `balance_move` as `b0_jt`, json_table\([^)]+, '\$\[\*\]' columns \(elem json path '\$'\)\) as `payments_je` where `b0_jt`\.`id` = `b0`\.`id` and json_unquote\(json_extract\(`payments_je`\.elem, '\$\.payment_method'\)\) in \('7', '8', '9'\)\)/,
    );
  });

  test('$nin operator inside $elemMatch', async () => {
    const mock = mockLogger(orm);

    await orm.em.findAll(BalanceMove, {
      where: {
        payments: {
          $elemMatch: { payment_method: { $nin: ['1', '2'] } },
        },
      },
    });

    expect(mock.mock.calls[0][0]).toMatch(
      /exists \(select 1 from `balance_move` as `b0_jt`, json_table\([^)]+, '\$\[\*\]' columns \(elem json path '\$'\)\) as `payments_je` where `b0_jt`\.`id` = `b0`\.`id` and json_unquote\(json_extract\(`payments_je`\.elem, '\$\.payment_method'\)\) not in \('1', '2'\)\)/,
    );
  });

  test('empty $in returns false', async () => {
    const mock = mockLogger(orm);

    await orm.em.findAll(BalanceMove, {
      where: {
        payments: {
          $elemMatch: { payment_method: { $in: [] } },
        },
      },
    });

    expect(mock.mock.calls[0][0]).toMatch(/exists \(select 1 from `balance_move` as `b0_jt`, json_table\([^)]+, '\$\[\*\]' columns \(elem json path '\$'\)\) as `payments_je` where `b0_jt`\.`id` = `b0`\.`id` and 1 = 0\)/);
  });

  test('empty $nin returns true', async () => {
    const mock = mockLogger(orm);

    await orm.em.findAll(BalanceMove, {
      where: {
        payments: {
          $elemMatch: { payment_method: { $nin: [] } },
        },
      },
    });

    expect(mock.mock.calls[0][0]).toMatch(/exists \(select 1 from `balance_move` as `b0_jt`, json_table\([^)]+, '\$\[\*\]' columns \(elem json path '\$'\)\) as `payments_je` where `b0_jt`\.`id` = `b0`\.`id` and 1 = 1\)/);
  });

  test('multiple conditions with $and', async () => {
    const mock = mockLogger(orm);

    await orm.em.findAll(BalanceMove, {
      where: {
        payments: {
          $elemMatch: {
            payment_method: '7',
            amount: '500',
          },
        },
      },
    });

    // Multiple simple equality conditions use optimized JSON_CONTAINS
    expect(mock.mock.calls[0][0]).toMatch(/json_contains\(`b0`\.`payments`, '/);
    expect(mock.mock.calls[0][0]).toMatch(/payment_method/);
    expect(mock.mock.calls[0][0]).toMatch(/amount/);
  });

  test('$not inside $elemMatch', async () => {
    const mock = mockLogger(orm);

    await orm.em.findAll(BalanceMove, {
      where: {
        payments: {
          $elemMatch: {
            $not: { payment_method: '7' },
          },
        },
      },
    });

    expect(mock.mock.calls[0][0]).toMatch(/not \(json_unquote\(json_extract\(`payments_je`\.elem, '\$\.payment_method'\)\) = '7'\)/);
  });

  test('numeric comparison operators', async () => {
    const mock = mockLogger(orm);

    await orm.em.findAll(Order, {
      where: {
        items: {
          $elemMatch: { quantity: { $gt: 5 } },
        },
      },
    });

    await orm.em.findAll(Order, {
      where: {
        items: {
          $elemMatch: { price: { $gte: 100 } },
        },
      },
    });

    await orm.em.findAll(Order, {
      where: {
        items: {
          $elemMatch: { quantity: { $lt: 10 } },
        },
      },
    });

    await orm.em.findAll(Order, {
      where: {
        items: {
          $elemMatch: { price: { $lte: 50 } },
        },
      },
    });

    // MySQL now uses the base castJsonElementValue (no decimal cast)
    expect(mock.mock.calls[0][0]).toMatch(/json_unquote\(json_extract\(`items_je`\.elem, '\$\.quantity'\)\) > 5/);
    expect(mock.mock.calls[1][0]).toMatch(/json_unquote\(json_extract\(`items_je`\.elem, '\$\.price'\)\) >= 100/);
    expect(mock.mock.calls[2][0]).toMatch(/json_unquote\(json_extract\(`items_je`\.elem, '\$\.quantity'\)\) < 10/);
    expect(mock.mock.calls[3][0]).toMatch(/json_unquote\(json_extract\(`items_je`\.elem, '\$\.price'\)\) <= 50/);
  });

  test('$like operator', async () => {
    const mock = mockLogger(orm);

    await orm.em.findAll(Order, {
      where: {
        items: {
          $elemMatch: { name: { $like: '%Book%' } },
        },
      },
    });

    expect(mock.mock.calls[0][0]).toMatch(/json_unquote\(json_extract\(`items_je`\.elem, '\$\.name'\)\) like '%Book%'/);
  });

  test('$exists operator', async () => {
    const mock = mockLogger(orm);

    await orm.em.findAll(BalanceMove, {
      where: {
        payments: {
          $elemMatch: { cheque_notes: { $exists: true } },
        },
      },
    });

    await orm.em.findAll(BalanceMove, {
      where: {
        payments: {
          $elemMatch: { cheque_notes: { $exists: false } },
        },
      },
    });

    expect(mock.mock.calls[0][0]).toMatch(/json_unquote\(json_extract\(`payments_je`\.elem, '\$\.cheque_notes'\)\) is not null/);
    expect(mock.mock.calls[1][0]).toMatch(/json_unquote\(json_extract\(`payments_je`\.elem, '\$\.cheque_notes'\)\) is null/);
  });

  test('$eq and $ne operators', async () => {
    const mock = mockLogger(orm);

    await orm.em.findAll(BalanceMove, {
      where: {
        payments: {
          $elemMatch: { payment_method: { $eq: '7' } },
        },
      },
    });

    await orm.em.findAll(BalanceMove, {
      where: {
        payments: {
          $elemMatch: { payment_method: { $ne: '7' } },
        },
      },
    });

    expect(mock.mock.calls[0][0]).toMatch(/json_unquote\(json_extract\(`payments_je`\.elem, '\$\.payment_method'\)\) = '7'/);
    expect(mock.mock.calls[1][0]).toMatch(/json_unquote\(json_extract\(`payments_je`\.elem, '\$\.payment_method'\)\) != '7'/);
  });

  test('null comparisons', async () => {
    const mock = mockLogger(orm);

    await orm.em.findAll(BalanceMove, {
      where: {
        payments: {
          $elemMatch: { cheque_notes: { $eq: null } },
        },
      },
    });

    await orm.em.findAll(BalanceMove, {
      where: {
        payments: {
          $elemMatch: { cheque_notes: { $ne: null } },
        },
      },
    });

    expect(mock.mock.calls[0][0]).toMatch(/json_unquote\(json_extract\(`payments_je`\.elem, '\$\.cheque_notes'\)\) is null/);
    expect(mock.mock.calls[1][0]).toMatch(/json_unquote\(json_extract\(`payments_je`\.elem, '\$\.cheque_notes'\)\) is not null/);
  });

  test('multiple $elemMatch on different JSON arrays uses unique aliases', async () => {
    const mock = mockLogger(orm);

    await orm.em.findAll(Order, {
      where: {
        items: {
          $elemMatch: { quantity: { $gt: 5 } },
        },
        tags: {
          $elemMatch: { priority: { $gte: 1 } },
        },
      },
    });

    const sql = mock.mock.calls[0][0];
    // Each $elemMatch should have its own unique alias based on field name
    expect(sql).toMatch(/as `items_je`/);
    expect(sql).toMatch(/as `tags_je`/);
    // The aliases should not conflict - both should be present
    expect(sql).toMatch(/`items_je`\.elem/);
    expect(sql).toMatch(/`tags_je`\.elem/);
  });

});

describe('$elemMatch integration tests (MySQL)', () => {

  beforeEach(async () => {
    await orm.em.createQueryBuilder(BalanceMove).truncate().execute();
    await orm.em.createQueryBuilder(Order).truncate().execute();
  });

  test('actually finds matching records', async () => {
    const em = orm.em.fork();

    // Insert test data
    const bm1 = em.create(BalanceMove, {
      payments: [
        { amount: '500', cheque_date: '2026-01-16', cheque_notes: null, payment_method: '7' },
        { amount: '300', cheque_date: '2026-01-17', cheque_notes: 'Note 1', payment_method: '3' },
      ],
    });

    const bm2 = em.create(BalanceMove, {
      payments: [
        { amount: '1000', cheque_date: '2026-01-18', cheque_notes: null, payment_method: '1' },
      ],
    });

    const bm3 = em.create(BalanceMove, {
      payments: [
        { amount: '750', cheque_date: '2026-01-19', cheque_notes: null, payment_method: '7' },
        { amount: '250', cheque_date: '2026-01-20', cheque_notes: null, payment_method: '8' },
      ],
    });

    await em.flush();

    // Test finding records with payment_method = '7'
    const results = await em.find(BalanceMove, {
      payments: {
        $elemMatch: { payment_method: '7' },
      },
    }, { orderBy: { id: 1 } });

    expect(results).toHaveLength(2);
    expect(results[0].id).toBe(bm1.id);
    expect(results[1].id).toBe(bm3.id);
  });

  test('finds with $in operator', async () => {
    const em = orm.em.fork();

    const bm1 = em.create(BalanceMove, {
      payments: [{ amount: '500', cheque_date: '2026-01-16', cheque_notes: null, payment_method: '7' }],
    });

    const bm2 = em.create(BalanceMove, {
      payments: [{ amount: '1000', cheque_date: '2026-01-18', cheque_notes: null, payment_method: '1' }],
    });

    const bm3 = em.create(BalanceMove, {
      payments: [{ amount: '750', cheque_date: '2026-01-19', cheque_notes: null, payment_method: '8' }],
    });

    await em.flush();

    const results = await em.find(BalanceMove, {
      payments: {
        $elemMatch: { payment_method: { $in: ['7', '8'] } },
      },
    }, { orderBy: { id: 1 } });

    expect(results).toHaveLength(2);
    expect(results[0].id).toBe(bm1.id);
    expect(results[1].id).toBe(bm3.id);
  });

  test('finds with $not operator', async () => {
    const em = orm.em.fork();

    em.create(BalanceMove, {
      payments: [{ amount: '500', cheque_date: '2026-01-16', cheque_notes: null, payment_method: '7' }],
    });

    const bm2 = em.create(BalanceMove, {
      payments: [{ amount: '1000', cheque_date: '2026-01-18', cheque_notes: null, payment_method: '1' }],
    });

    const bm3 = em.create(BalanceMove, {
      payments: [
        { amount: '750', cheque_date: '2026-01-19', cheque_notes: null, payment_method: '7' },
        { amount: '250', cheque_date: '2026-01-20', cheque_notes: null, payment_method: '8' },
      ],
    });

    await em.flush();

    const results = await em.find(BalanceMove, {
      payments: {
        $elemMatch: { $not: { payment_method: '7' } },
      },
    }, { orderBy: { id: 1 } });

    expect(results).toHaveLength(2);
    expect(results[0].id).toBe(bm2.id);
    expect(results[1].id).toBe(bm3.id);
  });

  test('finds with multiple conditions', async () => {
    const em = orm.em.fork();

    const order1 = em.create(Order, {
      items: [
        { product_id: 1, quantity: 10, price: 50, name: 'Book A' },
        { product_id: 2, quantity: 2, price: 100, name: 'Book B' },
      ],
    });

    const order2 = em.create(Order, {
      items: [
        { product_id: 3, quantity: 5, price: 30, name: 'Pen' },
      ],
    });

    const order3 = em.create(Order, {
      items: [
        { product_id: 4, quantity: 8, price: 80, name: 'Notebook' },
      ],
    });

    await em.flush();

    // Find orders with items where quantity > 5 AND price > 40
    const results = await em.find(Order, {
      items: {
        $elemMatch: {
          quantity: { $gt: 5 },
          price: { $gt: 40 },
        },
      },
    }, { orderBy: { id: 1 } });

    expect(results).toHaveLength(2);
    expect(results[0].id).toBe(order1.id);
    expect(results[1].id).toBe(order3.id);
  });

  test('finds with multiple $elemMatch on different JSON arrays', async () => {
    const em = orm.em.fork();

    const order1 = em.create(Order, {
      items: [
        { product_id: 1, quantity: 10, price: 50, name: 'Book A' },
      ],
      tags: [
        { name: 'urgent', priority: 1 },
        { name: 'sale', priority: 2 },
      ],
    });

    const order2 = em.create(Order, {
      items: [
        { product_id: 2, quantity: 3, price: 100, name: 'Book B' },
      ],
      tags: [
        { name: 'normal', priority: 0 },
      ],
    });

    const order3 = em.create(Order, {
      items: [
        { product_id: 3, quantity: 8, price: 80, name: 'Notebook' },
      ],
      tags: [
        { name: 'urgent', priority: 1 },
      ],
    });

    await em.flush();

    // Find orders with items quantity > 5 AND tags with priority >= 1
    const results = await em.find(Order, {
      items: {
        $elemMatch: { quantity: { $gt: 5 } },
      },
      tags: {
        $elemMatch: { priority: { $gte: 1 } },
      },
    }, { orderBy: { id: 1 } });

    expect(results).toHaveLength(2);
    expect(results[0].id).toBe(order1.id);
    expect(results[1].id).toBe(order3.id);
  });

});
