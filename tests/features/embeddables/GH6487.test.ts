import { MikroORM } from '@mikro-orm/sqlite';

import { Embeddable, Embedded, Entity, Enum, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
enum IpVersion {
  V4 = 'v4',
  V6 = 'v6'
}

@Embeddable({ abstract: true, discriminatorColumn: 'type' })
abstract class IpBase<T extends IpVersion> {

  @Enum(() => IpVersion)
  type!: T;

  @Property()
  ip!: string;

}

@Embeddable({ discriminatorValue: IpVersion.V4 })
class IpV4 extends IpBase<IpVersion.V4> {

  @Property()
  range!: number;

}

@Embeddable({ discriminatorValue: IpVersion.V6 })
class IpV6 extends IpBase<IpVersion.V6> {

  @Property()
  convert!: boolean;

}

enum NetworkType {
  AUTO = 'auto',
  MANUAL = 'manual'
}

@Embeddable({ abstract: true, discriminatorColumn: 'type' })
abstract class NetworkBase<T extends NetworkType> {

  @Enum(() => NetworkType)
  type!: T;

}

@Embeddable({ discriminatorValue: NetworkType.AUTO })
class NetworkAuto extends NetworkBase<NetworkType.AUTO> {

  @Property()
  refresh!: number;

}

@Embeddable({ discriminatorValue: NetworkType.MANUAL })
class NetworkManual extends NetworkBase<NetworkType.MANUAL> {

  @Property()
  dns!: string;

  @Embedded(() => [IpV4, IpV6])
  ip!: IpV4 | IpV6;

}

@Entity()
class Host {

  @PrimaryKey()
  _id!: number;

  @Property()
  name!: string;

  @Embedded(() => [NetworkAuto, NetworkManual])
  network!: NetworkAuto | NetworkManual;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Host],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

afterAll(() => orm.close(true));

test('GH #6487', async () => {
  const created = orm.em.create(Host, {
    name: 'test',
    network: {
      type: NetworkType.MANUAL,
      dns: '0.0.0.0',
      ip: { type: IpVersion.V4, ip: '192.168.0.100', range: 24 },
    },
  });
  await orm.em.flush();

  function checkHost(host: Host) {
    const network = host.network as NetworkManual;
    expect(network.type).toBe(NetworkType.MANUAL);
    expect(network.ip).toBeDefined();
    expect(network.dns).toBeDefined();

    const netIp = network.ip as IpV4;
    expect(netIp.type).toBe(IpVersion.V4);
    expect(netIp.ip).toBeDefined();
    expect(netIp.range).toBeDefined();
  }

  checkHost(created);
  orm.em.clear();

  const host = await orm.em.findOneOrFail(Host, created._id);
  checkHost(host);
});
