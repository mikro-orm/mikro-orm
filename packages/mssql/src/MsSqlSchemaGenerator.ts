import { SchemaGenerator } from '@mikro-orm/knex';

export class MsSqlSchemaGenerator extends SchemaGenerator {

    async clearDatabase(options?: { schema?: string; truncate?: boolean }): Promise<void> {
        // truncate by default, so no value is considered as true
        /* istanbul ignore if */
        if (options?.truncate === false) {
            return super.clearDatabase(options);
        }

        await this.connection.loadFile(__dirname + '/truncate.sql');

        if (this.em) {
            const allowGlobalContext = this.config.get('allowGlobalContext');
            this.config.set('allowGlobalContext', true);
            this.em.clear();
            this.config.set('allowGlobalContext', allowGlobalContext);
        }
    }

}
