import { Collection, Entity, ManyToOne, MikroORM, OneToMany, OneToOne, PrimaryKey, Rel, wrap } from '@mikro-orm/sqlite';

@Entity()
class UnitDetails {

  @OneToOne(() => Unit, u => u.details, {
    primary: true,
    owner: true,
  })
  unit!: Rel<Unit>;

  @OneToMany(() => UnitDetailPicture, re => re.unitDetail)
  pictures = new Collection<UnitDetailPicture>(this);

}

@Entity()
class Unit {

  @PrimaryKey()
  id!: string;

  @OneToOne(() => UnitDetails, p => p.unit, {
    nullable: true,
    eager: true,
  })
  details: UnitDetails | null = null;

}

@Entity()
class UnitDetailPicture {

  @PrimaryKey()
  id!: string;

  @ManyToOne(() => UnitDetails, {
    eager: true,
  })
  unitDetail!: UnitDetails;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = MikroORM.initSync({
    entities: [UnitDetailPicture, Unit],
    dbName: `:memory:`,
  });

  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('query by 1:1 PK', async () => {
  const demoUnit = new Unit();
  demoUnit.id = 'demo';

  const d = new UnitDetails();
  d.unit = demoUnit;

  const pic1 = new UnitDetailPicture();
  pic1.id = 'pic1';
  pic1.unitDetail = d;

  await orm.em.persistAndFlush(pic1);
  orm.em.clear();

  const details = await orm.em.find(UnitDetailPicture, {
    unitDetail: {
      unit: {
        id: 'demo',
      },
    },
  });

  expect(wrap(details[0]).toObject()).toMatchObject({
    id: 'pic1',
    unitDetail: {
      unit: 'demo',
    },
  });
});
