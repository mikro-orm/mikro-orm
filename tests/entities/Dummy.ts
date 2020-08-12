import { Entity } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';

@Entity({ readonly: true })
export class Dummy extends BaseEntity<Dummy> {}
