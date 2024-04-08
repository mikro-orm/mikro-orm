import { Embeddable, Embedded, Entity, ManyToOne, MikroORM, PrimaryKey, Property } from '@mikro-orm/libsql';

@Embeddable()
class DateRange {

  @Property()
  startDate!: Date;

  @Property()
  endDate!: Date;

}

@Entity()
class PromotionalCode {

  @PrimaryKey()
  id!: number;

  @Embedded(() => DateRange)
  activeRange!: DateRange;

}

@Entity()
class ActualSnapshot {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => PromotionalCode, { nullable: true })
  actualPromotionalCode?: PromotionalCode;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [ActualSnapshot],
    dbName: ':memory:',
    ensureDatabase: { create: true },
  });
});

afterAll(async () => {
  await orm.close(true);
});

test('5389', async () => {
  await orm.em.findAll(
    ActualSnapshot,
    {
      populate: ['actualPromotionalCode'],
      orderBy: {
        actualPromotionalCode: {
          activeRange: { startDate: 'ASC' },
        },
      },
    },
  );
});
