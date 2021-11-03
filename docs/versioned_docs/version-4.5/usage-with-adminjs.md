---
title: Using MikroORM with AdminJS
sidebar_label: Usage with AdminJS
---

## Installation

To use MikroORM with AdminJS you need to install:
1. [`AdminJS Core`](https://github.com/SoftwareBrothers/adminjs):
```bash
$ yarn add adminjs
```

2. [`MikroORM Adapter`](https://github.com/SoftwareBrothers/adminjs-mikroorm):
```bash
$ yarn add @adminjs/mikroorm
# A MikroORM driver and core package, choose the one which suits you:
$ yarn add @mikro-orm/core @mikro-orm/mongodb     # for mongo
$ yarn add @mikro-orm/core @mikro-orm/mysql       # for mysql
$ yarn add @mikro-orm/core @mikro-orm/mariadb     # for mariadb
$ yarn add @mikro-orm/core @mikro-orm/postgresql  # for postgresql
$ yarn add @mikro-orm/core @mikro-orm/sqlite      # for sqlite
```

3. A plugin specific to your server's framework:
- [`Express Plugin`](https://github.com/SoftwareBrothers/adminjs-expressjs):
```bash
$ yarn add @adminjs/express
# Peer dependencies
$ yarn add express express-formidable express-session
```

- [`Hapi Plugin`](https://github.com/SoftwareBrothers/adminjs-hapijs):
```bash
$ yarn add @adminjs/hapi
# Peer dependencies
$ yarn add @hapi/boom @hapi/cookie @hapi/hapi @hapi/inert
```

---

## Setup

Once the installation process is completed, we need to set up AdminJS endpoints and database connection.
The process is straightforward but differs based on which `plugin` you are using. Below you can find examples specific to supported frameworks:

### MikroORM + Express Plugin

```typescript
import AdminJS from 'adminjs';
import { Database, Resource } from '@adminjs/mikroorm';
import AdminJSExpress from '@adminjs/express';
import { MikroORM } from '@mikro-orm/core';
import { validate } from 'class-validator'; // optional

const PORT = process.env.PORT ?? 3000;

const run = async () => {
  /* Initialize MikroORM like you would do normally, you can also import your MikroORM instance from a separate file */
  const orm = await MikroORM.init({
    entities: [User, Car, Seller], // use your own entities
    dbName: process.env.DATABASE_NAME,
    type: 'postgresql',
    clientUrl: process.env.DATABASE_URL,
  });

  /* Optional: if you're using class-validator, assign it to Resource */
  Resource.validate = validate;
  /* Tell AdminJS which adapter to use */
  AdminJS.registerAdapter({ Database, Resource });

  const app = express();

  /* Create AdminJS instance */
  const admin = new AdminJS({
    databases: [orm],
  });

  const router = AdminJSExpress.buildRouter(admin);

  app.use(admin.options.rootPath, router);

  app.listen(PORT, () => {
    console.log(`App listening at http://localhost:${PORT}`);
  });
}

run();
```

### MikroORM + Hapi Plugin

```typescript
import AdminJS from 'adminjs';
import { Database, Resource } from '@adminjs/mikroorm';
import AdminJSHapi from '@adminjs/hapi';
import { MikroORM } from '@mikro-orm/core';
import { validate } from 'class-validator'; // optional

const PORT = process.env.PORT ?? 3000;

const run = async () => {
  /* Initialize MikroORM like you would do normally, you can also import your MikroORM instance from a separate file */
  const orm = await MikroORM.init({
    entities: [User, Car, Seller], // use your own entities
    dbName: process.env.DATABASE_NAME,
    type: 'postgresql',
    clientUrl: process.env.DATABASE_URL,
  });

  /* Optional: if you're using class-validator, assign it to Resource */
  Resource.validate = validate;
  /* Tell AdminJS which adapter to use */
  AdminJS.registerAdapter({ Database, Resource });

  const server = Hapi.server({ port: PORT })

  /* Configure AdminJS */
  const adminOptions = {
    databases: [orm],
  };

  /* Register AdminJS as a Hapi server's plugin */
  await server.register({
    plugin: AdminJSHapi,
    options: adminOptions,
  });

  await server.start();
  console.log(`App listening at ${server.info.uri}`);
}

run();
```


You can start your server afterwards and the admin panel will be available at `http://localhost:{PORT}/admin`. If you followed the example setup thoroughly, you should be able to see all of your entities in the sidebar and you should be able to perform basic **CRUD** operations on them.

To further customize your AdminJS panel, please refer to the [`official documentation`](https://adminjs.co/docs.html).

---

## Authentication

The examples above set up AdminJS with unauthenticated access. To require your users to authenticate before accessing the admin panel, some plugin-specific modifications are required:

### Express

You need to use `AdminJSExpress.buildAuthenticatedRouter` instead of `AdminJS.buildRouter`:

**Before**:
```typescript
  const router = AdminJSExpress.buildRouter(admin);
```

**After**:
```typescript
const ADMIN_EMAIL = 'example@test.com';
const ADMIN_PASSWORD = 'password';

const router = AdminJSExpress.buildAuthenticatedRouter(admin, {
  authenticate: async (email, password) => {
    /* Your code for verifying email & password goes here */
    return email === ADMIN_EMAIL && password === ADMIN_PASSWORD
      ? { email } // the function should return an object containg user's data if authenticated successfully
      : null;
  },
  cookiePassword: process.env.COOKIE_PASSWORD ?? 'makesurepasswordissecure',
});
```

### Hapi

You need to simply add `auth` property to AdminJS options.

**Before**:
```typescript
const adminOptions = {
  databases: [orm],
};
```

**After**:
```typescript
const ADMIN_EMAIL = 'example@test.com';
const ADMIN_PASSWORD = 'password';

const adminOptions = {
  databases: [orm],
  auth: {
    authenticate: async (email, password) => {
      /* Your code for verifying email & password goes here */
      return email === ADMIN_EMAIL && password === ADMIN_PASSWORD
        ? { email } // the function should return an object containg user's data if authenticated successfully
        : null;
    },
    strategy: 'session',
    cookiePassword: process.env.COOKIE_PASSWORD ?? 'makesurepasswordissecure',
    isSecure: false, // only https requests
  },
};
```

---

## Example

An example app using MikroORM with AdminJS can be found [here](https://github.com/SoftwareBrothers/adminjs-mikroorm/tree/master/example-app)
