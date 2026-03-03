import { Collection, EntityCaseNamingStrategy } from '@mikro-orm/core';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/mysql';

enum UserRoleEnum {
  Admin = 'Admin',
  DataManager = 'Data Manager',
  DataEntry = 'Data Entry',
}

@Entity({ tableName: 'user' })
class User {
  @PrimaryKey({
    defaultRaw: '(UUID())',
    length: 38,
    name: 'idUser',
  })
  id!: string;

  @Unique()
  @Property({
    length: 255,
  })
  Email!: string;

  @OneToMany({ entity: () => WorkspaceUser, mappedBy: 'user' })
  workspaceRoles = new Collection<WorkspaceUser>(this);
}

@Entity({ tableName: 'workspace' })
class Workspace {
  @PrimaryKey({
    fieldName: 'idWorkspace',
    length: 38,
    defaultRaw: '(UUID())',
    type: 'string',
  })
  id!: string;

  @Unique()
  @Property({
    length: 45,
    type: 'string',
  })
  orgName!: string;
}

@Entity({ tableName: 'userroles' })
class UserRole {
  @PrimaryKey({
    name: 'UserRole',
    fieldName: 'userRole',
    length: 45,
  })
  UserRole!: UserRoleEnum;

  @Property({
    fieldName: 'level',
    columnType: 'TINYINT',
  })
  Level!: number;
}

@Entity({ tableName: 'workspaceuser' })
class WorkspaceUser {
  @ManyToOne({
    entity: () => User,
    primary: true,
    fieldName: 'idUser',
  })
  user!: User;

  @ManyToOne({
    entity: () => Workspace,
    primary: true,
    fieldName: 'idWorkspace',
  })
  workspace!: Workspace;

  @ManyToOne({
    entity: () => UserRole,
    fieldName: 'userRole',
  })
  userRole!: UserRole;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [UserRole, Workspace, WorkspaceUser, User],
    namingStrategy: EntityCaseNamingStrategy,
    dbName: '4816',
    port: 3308,
  });
  await orm.schema.refresh();

  await orm.em.execute("INSERT INTO `userroles` VALUES ('Admin', '1');");
  await orm.em.execute("INSERT INTO `userroles` VALUES ('Data Manager', '2');");
  await orm.em.execute("INSERT INTO `userroles` VALUES ('Data Entry', '3');");

  await orm.em.execute("INSERT INTO `user` VALUES ('445bff08-0258-45c4-98b8-a1b1b3997de5', 'test@test.com');");

  await orm.em.execute("INSERT INTO `workspace` VALUES ('8724b13e-9472-462f-b4be-927dc06f11fe', 'Test');");
  await orm.em.execute("INSERT INTO `workspace` VALUES ('d278edec-97fc-4a7c-9999-df0b28967dba', 'Test2');");

  await orm.em.execute(
    "INSERT INTO `workspaceuser` VALUES ('445bff08-0258-45c4-98b8-a1b1b3997de5', '8724b13e-9472-462f-b4be-927dc06f11fe', 'Admin');",
  );
  await orm.em.execute(
    "INSERT INTO `workspaceuser` VALUES ('445bff08-0258-45c4-98b8-a1b1b3997de5', 'd278edec-97fc-4a7c-9999-df0b28967dba', 'Admin');",
  );
});

afterAll(() => orm.close(true));

test('GH #4816', async () => {
  const users = await orm.em
    .createQueryBuilder(User)
    .select('*')
    .leftJoinAndSelect('workspaceRoles', 'wsr')
    .leftJoinAndSelect('wsr.workspace', 'ws')
    .leftJoinAndSelect('wsr.userRole', 'role')
    .where({ id: '445bff08-0258-45c4-98b8-a1b1b3997de5' })
    .execute();

  expect(JSON.stringify(users, null, 2)).toEqual(`[
  {
    "id": "445bff08-0258-45c4-98b8-a1b1b3997de5",
    "Email": "test@test.com",
    "workspaceRoles": [
      {
        "user": "445bff08-0258-45c4-98b8-a1b1b3997de5",
        "workspace": {
          "id": "8724b13e-9472-462f-b4be-927dc06f11fe",
          "orgName": "Test"
        },
        "userRole": {
          "UserRole": "Admin",
          "Level": 1
        }
      },
      {
        "user": "445bff08-0258-45c4-98b8-a1b1b3997de5",
        "workspace": {
          "id": "d278edec-97fc-4a7c-9999-df0b28967dba",
          "orgName": "Test2"
        },
        "userRole": {
          "UserRole": "Admin",
          "Level": 1
        }
      }
    ]
  }
]`);
});
