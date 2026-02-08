import { Collection, MikroORM, Rel, wrap } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryKey,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

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
  orm = new MikroORM({
    metadataProvider: ReflectMetadataProvider,
    entities: [UnitDetailPicture, Unit],
    dbName: ':memory:',
  });

  await orm.schema.create();
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

  await orm.em.persist(pic1).flush();
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
