import { Collection, Entity, LoadStrategy, ManyToOne, OneToMany, PrimaryKey, Property, SimpleLogger } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

@Entity()
class Channel {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => DeviceChannel, item => item.channel, { orphanRemoval: true })
  links = new Collection<DeviceChannel>(this);

}

@Entity()
class Device {

  @PrimaryKey()
  id!: number;

  @Property()
  serial!: string;

  @OneToMany(() => DeviceChannel, item => item.device, { orphanRemoval: true })
  links = new Collection<DeviceChannel>(this);

}

@Entity()
class DeviceChannel {

  @ManyToOne({ entity: () => Device, primary: true })
  device!: Device;

  @ManyToOne({ entity: () => Channel, primary: true })
  channel!: Channel;

  @Property()
  lastTime!: Date;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Device, Channel, DeviceChannel],
    dbName: ':memory:',
    loggerFactory: SimpleLogger.create,
    loadStrategy: LoadStrategy.JOINED,
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

beforeEach(async () => {
  await orm.schema.clearDatabase();

  const chn = orm.em.create(Channel, { id: 1, name: 'ChannelOne', links: [] });
  const dev1 = orm.em.create(Device, { id: 2, serial: 'DeviceOne', links: [] });
  const link1 = orm.em.create(DeviceChannel, { device: dev1, channel: chn, lastTime: new Date() });
  chn.links.add(link1);

  await orm.em.flush();
  orm.em.clear();
});

test('GH 4129 (1/3)', async () => {
  const channel = await orm.em.findOneOrFail(Channel, { name: 'ChannelOne' }, { populate: ['links'] });

  for (const link of channel.links) {
    link.lastTime = new Date(1678803173316);
  }

  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock.mock.calls[1][0]).toBe('[query] update `device_channel` set `last_time` = 1678803173316 where `device_id` = 2 and `channel_id` = 1');
});

test('GH 4129 (2/3)', async () => {
  const channel = await orm.em.findOneOrFail(Channel, { name: 'ChannelOne' }, { populate: ['links.device', 'links.channel'] });

  for (const link of channel.links) {
    link.lastTime = new Date(1678803173316);
  }

  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock.mock.calls[1][0]).toBe('[query] update `device_channel` set `last_time` = 1678803173316 where `device_id` = 2 and `channel_id` = 1');
});

test('GH 4129 (3/3)', async () => {
  const channel = await orm.em.findOneOrFail(Channel, { name: 'ChannelOne' }, { populate: ['links.device'] });

  for (const link of channel.links) {
    link.lastTime = new Date(1678803173316);
  }

  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock.mock.calls[1][0]).toBe('[query] update `device_channel` set `last_time` = 1678803173316 where `device_id` = 2 and `channel_id` = 1');
});
