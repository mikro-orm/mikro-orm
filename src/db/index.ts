import {IDatabaseDriver, Connection, MikroORM} from '@mikro-orm/core';
import {Sex, User} from '../mikro-orm/entities/User';
import {Site} from '../mikro-orm/entities/Site';
import {Category} from '../mikro-orm/entities/Category';
import {Event} from '../mikro-orm/entities/Event';
import {Message} from '../mikro-orm/entities/Message';
import {useDocker, dbName} from '../mikro-orm/config';

export async function wipeDatabasePostgreSql({
  orm,
  wrap = false,
}: {
  orm: MikroORM<IDatabaseDriver<Connection>>;
  wrap?: boolean;
}) {
  const generator = orm.getSchemaGenerator();

  if (useDocker) {
    await generator.dropDatabase(dbName);
    await generator.createDatabase(dbName);
  } else {
    await generator.dropSchema({wrap});
  }

  try {
    await orm.em.getConnection().execute('CREATE EXTENSION postgis;');
  } catch (e) {
    console.log(e.message);
  }

  await generator.createSchema({wrap});

  orm.em.clear();
}

export async function addSampleData({
  orm,
  wrap = false,
}: {
  orm: MikroORM<IDatabaseDriver<Connection>>;
  wrap?: boolean;
}) {
  await wipeDatabasePostgreSql({orm, wrap});

  const {em} = orm;

  for (const {id, createdAt, name, sex} of users) {
    em.persist(
      new User({
        id,
        createdAt,
        name,
        sex,
      })
    );
  }

  for (const {id, createdAt, name} of sites) {
    em.persist(
      new Site({
        id,
        createdAt,
        name,
      })
    );
  }

  for (const {id, createdAt, name} of categories) {
    em.persist(
      new Category({
        id,
        createdAt,
        name,
      })
    );
  }

  for (const {
    id,
    createdAt,
    name,
    creatorId,
    categoryId: specialtyId,
    siteId,
    partecipantIds,
  } of events) {
    em.persist(
      new Event({
        id,
        createdAt,
        name,
        creator: em.getReference(User, creatorId, true),
        category: em.getReference(Category, specialtyId, true),
        site: em.getReference(Site, siteId, true),
        partecipants: partecipantIds.map(userId =>
          em.getReference(User, userId)
        ),
      })
    );
  }

  for (const {id, createdAt, content, senderId, recipientId} of messages) {
    em.persist(
      new Message({
        id,
        createdAt,
        content,
        sender: em.getReference(User, senderId, true),
        recipient: em.getReference(User, recipientId, true),
      })
    );
  }

  await em.flush();
  em.clear();
}

export type UserDb = {
  id: number;
  createdAt: Date;
  name: string;
  sex: Sex;
};

export type SiteDb = {
  id: number;
  createdAt: Date;
  name: string;
};

export type CategoryDb = {
  id: number;
  createdAt: Date;
  name: string;
};

export type EventDb = {
  id: number;
  name: string;
  createdAt: Date;
  creatorId: number;
  categoryId: number;
  partecipantIds: number[];
  siteId: number;
};

export type MemberDb = {
  id: number;
  userId: number;
  groupId: number;
  joinedAt: Date;
  joinedActionUserId: number;
  leftAt?: Date;
  leftActionUserId?: number;
  removedGroupAt?: Date;
};

export type MessageDb = {
  id: number;
  createdAt: Date;
  content: string;
  senderId: number;
  recipientId: number;
};

export const users: UserDb[] = [
  {
    id: 1,
    createdAt: new Date(2030, 1, 10, 15, 45),
    name: 'Niccolò',
    sex: Sex.MALE,
  },
  {
    id: 2,
    createdAt: new Date(2030, 1, 11, 10, 10),
    name: 'Mario',
    sex: Sex.MALE,
  },
  {
    id: 3,
    createdAt: new Date(2030, 1, 15, 9, 15),
    name: 'Luigi',
    sex: Sex.MALE,
  },
  {
    id: 4,
    createdAt: new Date(2030, 2, 1, 20, 30),
    name: 'Mattia',
    sex: Sex.MALE,
  },
  {
    id: 5,
    createdAt: new Date(2030, 2, 2, 19, 0),
    name: 'Riccardo',
    sex: Sex.MALE,
  },
  {
    id: 6,
    createdAt: new Date(2030, 2, 5, 16, 20),
    name: 'Filippo',
    sex: Sex.MALE,
  },
  {
    id: 7,
    createdAt: new Date(2030, 2, 6, 18, 50),
    name: 'Sara',
    sex: Sex.FEMALE,
  },
  {
    id: 8,
    createdAt: new Date(2030, 2, 6, 21, 30),
    name: 'Lucia',
    sex: Sex.FEMALE,
  },
  {
    id: 9,
    createdAt: new Date(2030, 2, 6, 22, 50),
    name: 'Giorgia',
    sex: Sex.FEMALE,
  },
  {
    id: 10,
    createdAt: new Date(2030, 2, 7, 8, 30),
    name: 'Claudia',
    sex: Sex.FEMALE,
  },
];

export const sites: SiteDb[] = [
  {
    id: 1,
    createdAt: new Date(2030, 1, 5, 8, 15),
    name: 'The Beach',
  },
  {
    id: 2,
    createdAt: new Date(2030, 1, 5, 8, 15),
    name: 'Palabeach',
  },
];

export const categories: CategoryDb[] = [
  {
    id: 1,
    createdAt: new Date(2030, 1, 1, 1, 1),
    name: 'Concert',
  },
  {
    id: 2,
    createdAt: new Date(2030, 2, 2, 2, 2),
    name: 'Play',
  },
  {
    id: 3,
    createdAt: new Date(2030, 3, 3, 3, 3),
    name: 'Ballad',
  },
];

export const events: EventDb[] = [
  {
    id: 1,
    name: 'Event 1',
    createdAt: new Date(2030, 2, 12, 8, 5),
    creatorId: 1,
    categoryId: 1,
    partecipantIds: [1, 2, 4, 6],
    siteId: 1,
  },
  {
    id: 2,
    name: 'Event 2',
    createdAt: new Date(2030, 2, 13, 15, 45),
    creatorId: 1,
    categoryId: 3,
    partecipantIds: [1, 4, 7, 9],
    siteId: 1,
  },
  {
    id: 3,
    name: 'Event 3',
    createdAt: new Date(2030, 2, 14, 9, 0),
    creatorId: 1,
    categoryId: 1,
    partecipantIds: [1, 2, 4, 6],
    siteId: 1,
  },
  {
    id: 4,
    name: 'Event 4',
    createdAt: new Date(2030, 2, 14, 18, 30),
    creatorId: 10,
    categoryId: 3,
    partecipantIds: [10, 4, 6, 9],
    siteId: 2,
  },
  {
    id: 5,
    name: 'Event 5',
    createdAt: new Date(2030, 2, 14, 19, 0),
    creatorId: 7,
    categoryId: 2,
    partecipantIds: [7, 8, 9, 10],
    siteId: 1,
  },
  {
    id: 6,
    name: 'Event 6',
    createdAt: new Date(2030, 2, 14, 19, 30),
    creatorId: 4,
    categoryId: 3,
    partecipantIds: [1, 4, 7, 9],
    siteId: 1,
  },
  {
    id: 7,
    name: 'Event 7',
    createdAt: new Date(2030, 2, 14, 20, 0),
    creatorId: 2,
    categoryId: 1,
    partecipantIds: [2, 4, 6],
    siteId: 1,
  },
  {
    id: 8,
    name: 'Event 8',
    createdAt: new Date(2030, 2, 14, 20, 30),
    creatorId: 10,
    categoryId: 3,
    partecipantIds: [10, 4, 6, 9],
    siteId: 2,
  },
  {
    id: 9,
    name: 'Event 9',
    createdAt: new Date(2030, 2, 15, 8, 0),
    creatorId: 1,
    categoryId: 1,
    partecipantIds: [1, 2, 4, 6],
    siteId: 1,
  },
  {
    id: 10,
    name: 'Event 10',
    createdAt: new Date(2030, 2, 15, 8, 30),
    creatorId: 9,
    categoryId: 3,
    partecipantIds: [1, 4, 7, 9],
    siteId: 1,
  },
  {
    id: 11,
    name: 'Event 11',
    createdAt: new Date(2030, 2, 15, 9, 0),
    creatorId: 6,
    categoryId: 1,
    partecipantIds: [1, 2, 4, 6],
    siteId: 1,
  },
  {
    id: 12,
    name: 'Event 12',
    createdAt: new Date(2030, 2, 15, 9, 30),
    creatorId: 4,
    categoryId: 3,
    partecipantIds: [10, 4, 6, 9],
    siteId: 2,
  },
  {
    id: 13,
    name: 'Event 13',
    createdAt: new Date(2030, 2, 15, 21, 0),
    creatorId: 1,
    categoryId: 1,
    partecipantIds: [1, 2, 4, 6],
    siteId: 1,
  },
  {
    id: 14,
    name: 'Event 14',
    createdAt: new Date(2030, 2, 16, 16, 0),
    creatorId: 7,
    categoryId: 3,
    partecipantIds: [1, 4, 7, 9],
    siteId: 1,
  },
  {
    id: 15,
    name: 'Event 15',
    createdAt: new Date(2030, 2, 16, 18, 0),
    creatorId: 3,
    categoryId: 3,
    partecipantIds: [3, 1, 8, 10],
    siteId: 1,
  },
  {
    id: 16,
    name: 'Event 16',
    createdAt: new Date(2030, 2, 17, 9, 0),
    creatorId: 3,
    categoryId: 3,
    partecipantIds: [3, 5, 8, 10],
    siteId: 2,
  },
  {
    id: 17,
    name: 'Event 17',
    createdAt: new Date(2030, 2, 17, 10, 0),
    creatorId: 3,
    categoryId: 3,
    partecipantIds: [3, 5, 8],
    siteId: 2,
  },
  {
    id: 18,
    name: 'Event 18',
    createdAt: new Date(2030, 2, 17, 11, 0),
    creatorId: 5,
    categoryId: 3,
    partecipantIds: [5, 8, 10],
    siteId: 2,
  },
  {
    id: 19,
    name: 'Event 19',
    createdAt: new Date(2030, 2, 17, 12, 0),
    creatorId: 10,
    categoryId: 3,
    partecipantIds: [8, 10],
    siteId: 2,
  },
];

const messages: MessageDb[] = [
  {
    id: 1,
    senderId: 1,
    recipientId: 3,
    content: 'You on your way?',
    createdAt: new Date(2030, 4, 9, 11, 0),
  },
  {
    id: 2,
    senderId: 3,
    recipientId: 1,
    content: 'Yep!',
    createdAt: new Date(2030, 4, 9, 11, 5),
  },
  {
    id: 3,
    senderId: 1,
    recipientId: 4,
    content: "Hey, it's me",
    createdAt: new Date(2030, 4, 9, 10, 0),
  },
  {
    id: 4,
    senderId: 1,
    recipientId: 5,
    content: 'I should buy a boat',
    createdAt: new Date(2030, 4, 8, 12, 0),
  },
  {
    id: 5,
    senderId: 1,
    recipientId: 5,
    content: 'You still there?',
    createdAt: new Date(2030, 4, 9, 4, 0),
  },
  {
    id: 6,
    senderId: 3,
    recipientId: 4,
    content: 'Look at my mukluks!',
    createdAt: new Date(2030, 4, 5, 12, 0),
  },
  {
    id: 7,
    senderId: 2,
    recipientId: 5,
    content: 'This is wicked good ice cream.',
    createdAt: new Date(2030, 3, 26, 12, 0),
  },
  {
    id: 8,
    senderId: 5,
    recipientId: 2,
    content: 'Love it!',
    createdAt: new Date(2030, 3, 26, 12, 10),
  },
  {
    id: 9,
    senderId: 3,
    recipientId: 1,
    content: "I'm coming",
    createdAt: new Date(2030, 4, 9, 11, 6),
  },
  {
    id: 10,
    senderId: 3,
    recipientId: 1,
    content: 'Just give me a minute',
    createdAt: new Date(2030, 4, 9, 11, 7),
  },
];
