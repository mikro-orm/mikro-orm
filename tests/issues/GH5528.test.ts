import { LockMode, MikroORM, BigIntType, type Opt } from '@mikro-orm/postgresql';

import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Entity()
class Test {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ length: 0, nullable: true, onUpdate: () => new Date() })
  updatedAt?: Date;

  @Property({ type: new BigIntType('number'), defaultRaw: '1', version: true })
  version!: number & Opt;

  constructor(props?: Pick<Test, 'id' | 'name'>) {
    if (props) {
      this.id = props.id;
      this.name = props.name;
    }
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: '5528',
    disableIdentityMap: true,
    entities: [Test],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

it('should support lock mode with identity map disabled', async () => {
  const em = orm.em.fork();

  await em.transactional(async tx => {
    return tx.find(
      Test,
      {},
      {
        lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE,
      },
    );
  });
});
