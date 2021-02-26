"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Publisher = exports.PublisherType = void 0;
const mongodb_1 = require("mongodb");
const core_1 = require("@mikro-orm/core");
const TsMorphMetadataProvider_test_1 = require("../TsMorphMetadataProvider.test");
var PublisherType;
(function (PublisherType) {
    PublisherType["LOCAL"] = "local";
    PublisherType["GLOBAL"] = "global";
})(PublisherType = exports.PublisherType || (exports.PublisherType = {}));
let Publisher = class Publisher {
    constructor(name = 'asd', type = PublisherType.LOCAL) {
        this.books = new TsMorphMetadataProvider_test_1.Collection(this);
        this.tests = new TsMorphMetadataProvider_test_1.Collection(this);
        this.type = PublisherType.LOCAL;
        // this.name = name;
        this.type = type;
    }
    beforeCreate() {
        // do sth
    }
};
__decorate([
    core_1.PrimaryKey(),
    __metadata("design:type", mongodb_1.ObjectId)
], Publisher.prototype, "_id", void 0);
__decorate([
    core_1.SerializedPrimaryKey(),
    __metadata("design:type", String)
], Publisher.prototype, "id", void 0);
__decorate([
    core_1.Property(),
    __metadata("design:type", Number)
], Publisher.prototype, "name", void 0);
__decorate([
    core_1.OneToMany({ mappedBy: 'publisher' }),
    __metadata("design:type", Object)
], Publisher.prototype, "books", void 0);
__decorate([
    core_1.ManyToMany({ eager: true }),
    __metadata("design:type", Object)
], Publisher.prototype, "tests", void 0);
__decorate([
    core_1.Enum(),
    __metadata("design:type", Object)
], Publisher.prototype, "type", void 0);
__decorate([
    core_1.BeforeCreate(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Publisher.prototype, "beforeCreate", null);
Publisher = __decorate([
    core_1.Entity(),
    __metadata("design:paramtypes", [Object, Object])
], Publisher);
exports.Publisher = Publisher;
