import { Cascade, Collection, Entity, OneToMany, PrimaryKey, Property } from '../../lib';
import { FooBarPk0 } from './FooBarPk0';

@Entity()
export class FooBazPk0 {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @OneToMany(() => FooBarPk0, 'baz', { hidden: true })
  bars = new Collection<FooBarPk0>(this);

  @Property({ version: true })
  version!: Date;

  constructor(name: string) {
    this.name = name;
  }

  static create(id: number, name: string) {
    const baz = new FooBazPk0(name);
    baz.id = id;

    return baz;
  }

}
