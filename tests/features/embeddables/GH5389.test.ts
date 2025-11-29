import { MikroORM } from '@mikro-orm/libsql';
import { Embeddable, Embedded, Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

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
    metadataProvider: ReflectMetadataProvider,
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
