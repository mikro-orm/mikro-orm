import {
    Collection,
    Entity,
    LoadStrategy,
    ManyToOne,
    OneToMany,
    PrimaryKey,
    Property,
    ref,
    Ref,
} from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class User {

    @PrimaryKey()
    id!: number;

    @OneToMany(() => Pet, p => p.user)
    pets = new Collection<Pet>(this);

}

@Entity()
class Pet {

    @PrimaryKey()
    id!: number;

    @Property({ type: 'text', default: 'yo' })
    name: string;

    @ManyToOne(() => User, {
        ref: true,
        nullable: true,
    })
    user: Ref<User> | null = null;

    @ManyToOne(() => Action, {
        ref: true,
        nullable: true,
    })
    action: Ref<Action> | null = null;

    constructor(name: string) {
        this.name = name;
    }

}

@Entity()
class Action {

    @PrimaryKey()
    id!: number;

    @Property({ type: 'text' })
    name: string;

    @OneToMany(() => Pet, p => p.action)
    pets = new Collection<Pet>(this);

    constructor(name: string) {
        this.name = name;
    }

}

describe('GH issue 3871', () => {

    let orm: MikroORM;

    beforeAll(async () => {
        orm = await MikroORM.init({
            entities: [User, Action, Pet],
            loadStrategy: LoadStrategy.JOINED,
            dbName: ':memory:',
        });
        await orm.schema.refreshDatabase();
        await createEntities();
    });

    beforeEach(() => orm.em.clear());
    afterAll(() => orm.close(true));

    async function createEntities() {
        for (let i = 0; i < 10; i++) {
            const user = new User();

            for (let j = 0; j < 10; j++) {
                const pet = new Pet('name - ' + Math.random().toString());
                pet.user = ref(user);

                if (i === 3 && j === 3) {
                    pet.name = 'yoyo';
                }

                for (let i = 0; i < 10; i++) {
                    const action = new Action('name - ' + Math.random().toString());
                    pet.action = ref(action);
                    orm.em.persist(action);
                }

                orm.em.persist(pet);
            }

            orm.em.persist(user);
        }

        await orm.em.flush();
        orm.em.clear();
    }

    test('joined with populateWhere', async () => {
        const res = await orm.em.find(User, {}, {
            populate: ['pets'],
            populateWhere: {
                pets: {
                    name: 'yoyo',
                },
            },
            strategy: LoadStrategy.JOINED,
        });

        expect(res).toHaveLength(10);
        expect(res[0].pets).toHaveLength(0);
        expect(res[1].pets).toHaveLength(0);
        expect(res[2].pets).toHaveLength(0);
        expect(res[3].pets).toHaveLength(1);
        expect(res[3].pets[0]).toMatchObject({ name: 'yoyo' });
        expect(res[4].pets).toHaveLength(0);
        expect(res[5].pets).toHaveLength(0);
        expect(res[6].pets).toHaveLength(0);
        expect(res[7].pets).toHaveLength(0);
        expect(res[8].pets).toHaveLength(0);
        expect(res[9].pets).toHaveLength(0);
    });

    test('select in with populateWhere', async () => {
        const res = await orm.em.find(User, {}, {
            populate: ['pets'],
            populateWhere: {
                pets: {
                    name: 'yoyo',
                },
            },
            strategy: LoadStrategy.SELECT_IN,
        });

        expect(res).toHaveLength(10);
        expect(res[0].pets).toHaveLength(0);
        expect(res[1].pets).toHaveLength(0);
        expect(res[2].pets).toHaveLength(0);
        expect(res[3].pets).toHaveLength(1);
        expect(res[3].pets[0]).toMatchObject({ name: 'yoyo' });
        expect(res[4].pets).toHaveLength(0);
        expect(res[5].pets).toHaveLength(0);
        expect(res[6].pets).toHaveLength(0);
        expect(res[7].pets).toHaveLength(0);
        expect(res[8].pets).toHaveLength(0);
        expect(res[9].pets).toHaveLength(0);
    });

    test('pagination with joined strategy and populateWhere', async () => {
        const [res, total] = await orm.em.findAndCount(User, {}, {
            populate: ['pets'],
            populateWhere: {
                pets: {
                    name: 'yoyo',
                },
            },
            strategy: LoadStrategy.JOINED,
            limit: 5,
        });

        expect(total).toBe(10);
        expect(res).toHaveLength(5);
        expect(res[0].pets).toHaveLength(0);
        expect(res[1].pets).toHaveLength(0);
        expect(res[2].pets).toHaveLength(0);
        expect(res[3].pets).toHaveLength(1);
        expect(res[3].pets[0]).toMatchObject({ name: 'yoyo' });
        expect(res[4].pets).toHaveLength(0);
    });

    test('pagination with select in strategy and populateWhere', async () => {
        const [res, total] = await orm.em.findAndCount(User, {}, {
            populate: ['pets'],
            populateWhere: {
                pets: {
                    name: 'yoyo',
                },
            },
            strategy: LoadStrategy.SELECT_IN,
            limit: 5,
        });

        expect(total).toBe(10);
        expect(res).toHaveLength(5);
        expect(res[0].pets).toHaveLength(0);
        expect(res[1].pets).toHaveLength(0);
        expect(res[2].pets).toHaveLength(0);
        expect(res[3].pets).toHaveLength(1);
        expect(res[3].pets[0]).toMatchObject({ name: 'yoyo' });
        expect(res[4].pets).toHaveLength(0);
    });

    test('pagination with joined strategy and populateWhere with group operators', async () => {
        const [res, total] = await orm.em.findAndCount(User, {}, {
            populate: ['pets'],
            populateWhere: {
                pets: {
                    name: 'yoyo',
                    action: { $ne: null },
                },
            },
            strategy: LoadStrategy.JOINED,
            limit: 5,
        });

        expect(total).toBe(10);
        expect(res).toHaveLength(5);
        expect(res[0].pets).toHaveLength(0);
        expect(res[1].pets).toHaveLength(0);
        expect(res[2].pets).toHaveLength(0);
        expect(res[3].pets).toHaveLength(1);
        expect(res[3].pets[0]).toMatchObject({ name: 'yoyo' });
        expect(res[4].pets).toHaveLength(0);
    });

});
