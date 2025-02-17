var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BeforeCreate, Collection, Entity, Enum, ManyToMany, OneToMany, PrimaryKey, Property, SerializedPrimaryKey } from '@mikro-orm/core';
// import { Collection } from '../TsMorphMetadataProvider.test.js';
import { PublisherType } from './PublisherType.js';
export var PublisherType2;
(function (PublisherType2) {
    PublisherType2["LOCAL2"] = "local2";
    PublisherType2["GLOBAL2"] = "global2";
})(PublisherType2 || (PublisherType2 = {}));
let Publisher = class Publisher {
    _id;
    id;
    name;
    books = new Collection(this);
    tests = new Collection(this);
    type = PublisherType.LOCAL;
    types = [PublisherType2.LOCAL2];
    types2 = [PublisherType2.LOCAL2];
    constructor(name = 'asd', type = PublisherType.LOCAL) {
        // this.name = name;
        this.type = type;
    }
    beforeCreate() {
        // do sth
    }
};
__decorate([
    PrimaryKey()
], Publisher.prototype, "_id", void 0);
__decorate([
    SerializedPrimaryKey()
], Publisher.prototype, "id", void 0);
__decorate([
    Property()
], Publisher.prototype, "name", void 0);
__decorate([
    OneToMany({ mappedBy: 'publisher' })
], Publisher.prototype, "books", void 0);
__decorate([
    ManyToMany({ eager: true })
], Publisher.prototype, "tests", void 0);
__decorate([
    Enum()
], Publisher.prototype, "type", void 0);
__decorate([
    Enum()
], Publisher.prototype, "types", void 0);
__decorate([
    Enum({ array: true })
], Publisher.prototype, "types2", void 0);
__decorate([
    BeforeCreate()
], Publisher.prototype, "beforeCreate", null);
Publisher = __decorate([
    Entity()
], Publisher);
export { Publisher };
