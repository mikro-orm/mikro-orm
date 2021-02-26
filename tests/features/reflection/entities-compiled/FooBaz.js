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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FooBaz = void 0;
const mongodb_1 = require("mongodb");
const core_1 = require("@mikro-orm/core");
const FooBar_1 = __importDefault(require("./FooBar"));
const Book_1 = require("./Book");
let FooBaz = class FooBaz {
};
__decorate([
    core_1.PrimaryKey(),
    __metadata("design:type", mongodb_1.ObjectId)
], FooBaz.prototype, "_id", void 0);
__decorate([
    core_1.SerializedPrimaryKey(),
    __metadata("design:type", String)
], FooBaz.prototype, "id", void 0);
__decorate([
    core_1.Property(),
    __metadata("design:type", String)
], FooBaz.prototype, "name", void 0);
__decorate([
    core_1.OneToOne(() => FooBar_1.default, bar => bar.baz, { eager: true }),
    __metadata("design:type", FooBar_1.default)
], FooBaz.prototype, "bar", void 0);
__decorate([
    core_1.ManyToOne(() => Book_1.Book, { eager: true }),
    __metadata("design:type", Book_1.Book)
], FooBaz.prototype, "book", void 0);
FooBaz = __decorate([
    core_1.Entity()
], FooBaz);
exports.FooBaz = FooBaz;
