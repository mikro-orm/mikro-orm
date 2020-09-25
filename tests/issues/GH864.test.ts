/* eslint-disable no-console */
import { AnyEntity, BaseEntity, Entity, EntityProperty, IdentifiedReference, MikroORM, OneToOne, Platform, PrimaryKey, Property, EventSubscriber, FlushEventArgs, ChangeSet, Subscriber, Type, ChangeSetType, ValidationError } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { v4 } from 'uuid';
import { Decimal } from 'decimal.js';
import { DateTime } from 'luxon';

export class DateTimeType extends Type {

	convertToDatabaseValue(value: any, platform: Platform) {
		if (!value) { return value; }
		if (value instanceof DateTime) { return value.toUTC().toJSDate(); }

		throw ValidationError.invalidType(DateTimeType, value, 'JS');
	}

	convertToJSValue(value: any, platform: Platform) {
		if (!value) { return value; }

		let dt = null;
		if (value instanceof DateTime) {
			dt = value;
		} else if (value instanceof Date) {
			dt = DateTime.fromJSDate(value, { zone: 'utc' });
		}
		if (!dt || !dt.isValid) { throw ValidationError.invalidType(DateTimeType, value, 'database'); }

		return dt;
	}

	getColumnType(prop: EntityProperty, platform: Platform) {
		return 'timestamptz(0)';
  }

}

export class DecimalType extends Type {

	convertToDatabaseValue(value: any, platform: Platform) {
    // eslint-disable-next-line eqeqeq
    if (value == null) { return value; }

		if (value instanceof Decimal) {
			if (value.isNaN()) { throw new Error('Decimal should not be NaN'); }
			if (!value.isFinite()) { throw new Error('Decimal should be finite'); }
			return value.toString();
		}
		throw ValidationError.invalidType(DecimalType, value, 'JS');
	}

	convertToJSValue(value: any, platform: Platform) {
    // eslint-disable-next-line eqeqeq
    if (value == null) { return value; }

		const decimal = new Decimal(value);

		if (!decimal.isFinite()) { throw new Error('Decimal should be finite'); }

		return decimal;
	}

	getColumnType(prop: EntityProperty, platform: Platform) {
		return `numeric(12, 4)`;
  }

}


@Subscriber()
export class AfterFlushSubscriber implements EventSubscriber {

  static readonly log: ChangeSet<AnyEntity>[][] = [];

  async afterFlush(args: FlushEventArgs): Promise<void> {
    AfterFlushSubscriber.log.push(args.uow.getChangeSets());
  }

}

@Entity()
export class A extends BaseEntity<A, 'id'> {

  @PrimaryKey({ type: 'uuid' })
  id = v4();

  @Property({ type: 'string', nullable: true })
  name!: string;

  @OneToOne({ type: 'B', mappedBy: 'a' })
  b!: IdentifiedReference<B>;

  @Property({ type: DecimalType })
  aDecimal: Decimal = new Decimal(0);

  @Property({ type: DateTimeType })
	aDateTime = DateTime.utc();

}

@Entity()
export class B extends BaseEntity<B, 'id'> {

  @PrimaryKey({ type: 'uuid' })
  id = v4();

  @Property({ type: 'string', nullable: true })
  name?: string;

  @OneToOne({ type: A })
  a!: IdentifiedReference<A>;

}

describe('GH issue 864', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B, AfterFlushSubscriber],
      dbName: 'mikro_orm_test_gh864',
      type: 'postgresql',
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test('populating relations should not send update changesets when using custom types', async () => {

    const a = new A();
    a.name = '1stA';
    const b = new B();
    b.name = '1stB';
    b.a = a.toReference();

    await orm.em.persistAndFlush(b);
    orm.em.clear();

    // Comment this out and the test will pass
    await orm.em.findOneOrFail(B, { name: '1stB' }, ['a']);

    const newA = new A();
    newA.name = '2ndA';
    const newB = new B();
    newB.name = '2ndB';
    newB.a = newA.toReference();
    await orm.em.persistAndFlush(newB);

    expect(AfterFlushSubscriber.log).toHaveLength(2);
    const updates = AfterFlushSubscriber.log.reduce((x, y) => x.concat(y), []).filter(c => c.type === ChangeSetType.UPDATE);
    expect(updates).toHaveLength(0);
  });

});
