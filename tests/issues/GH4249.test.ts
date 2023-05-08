import {
    BigIntType,
    Entity,
    FilterQuery,
    JsonType,
    LoadStrategy,
    ManyToOne,
    PrimaryKey,
    Property,
    SimpleLogger,
    wrap,
} from '@mikro-orm/core';
import { MikroORM, MySqlDriver } from '@mikro-orm/mysql';
import { mockLogger } from '../helpers';

@Entity()
class Author {

    @PrimaryKey({ columnType: 'bigint', type: BigIntType })
    private id: string;

    public constructor(id: string) {
        this.id = id;
    }

    public getId(): string {
        return this.id;
    }

}

@Entity()
class Post {

    @PrimaryKey()
    private id: number;

    @ManyToOne({ entity: () => Author })
    private author: Author;

    @Property({ columnType: 'json', type: JsonType })
    private extra: Record<string, any>;

    public constructor(authro: Author, extra: Record<string, any>) {
        this.author = authro;
        this.extra = extra;
    }

    public getId(): number {
        return this.id;
    }

    public async getAuthor(): Promise<Author> {
        if (!wrap(this.author).isInitialized()) {
            await wrap(this.author).init();
        }
        return this.author;
    }

    public getExtra(): Record<string, any> {
        return this.extra;
    }

}

let orm: MikroORM;
let postId: number;

beforeAll(async () => {
    orm = await MikroORM.init({
        type: 'mysql',
        driver: MySqlDriver,
        dbName: 'mikro_orm_4062',
        port: 3308,
        loadStrategy: LoadStrategy.JOINED,
        debug: true,
        entities: [Author, Post],
        loggerFactory: options => new SimpleLogger(options),
    });
    await orm.schema.refreshDatabase();


    const em = orm.em.fork();
    const author = new Author('198604260123');
    const post = new Post(author, { category: 'Tech' });
    em.persist(author);
    em.persist(post);
    await em.flush();
    postId = post.getId();
});

afterAll(async () => {
    await orm.close(true);
});

test('4249', async () => {
    const mock = mockLogger(orm);
    const em = orm.em.fork();
    const post = await em.getRepository(Post).findOneOrFail({ id: postId } as FilterQuery<Post>);
    await post.getAuthor();
    await em.flush();
    expect(mock.mock.calls).toEqual([
            [
                '[query] select `p0`.* from `post` as `p0` where `p0`.`id` = 1 limit 1',
            ],
            [
                "[query] select `a0`.* from `author` as `a0` where `a0`.`id` = '198604260123' limit 1",
            ],
        ],
    );
});
