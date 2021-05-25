import {
  Entity,
  Property,
  ManyToOne,
  IdentifiedReference,
  Reference,
} from '@mikro-orm/core';
import {BaseIdEntity, BaseIdEntityConstructor} from './BaseIdEntity';
import {User} from './User';

interface MessageConstructor extends BaseIdEntityConstructor {
  content: string;
  sender: User;
  recipient: User;
}

@Entity()
export class Message extends BaseIdEntity {
  @Property()
  content: string;

  @ManyToOne()
  sender: IdentifiedReference<User>;

  @ManyToOne()
  recipient: IdentifiedReference<User>;

  constructor({id, createdAt, content, sender, recipient}: MessageConstructor) {
    super({id, createdAt});
    this.content = content;
    this.sender = Reference.create(sender);
    this.recipient = Reference.create(recipient);
  }
}
