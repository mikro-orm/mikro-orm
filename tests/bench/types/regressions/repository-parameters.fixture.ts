import { defineEntity, p, type EntityRepository } from '@mikro-orm/core';

// From decline's reproduction in #8665: this declaration and its position trigger the compiler blowup.
export type Query = { [K in '$eq']: string };

const promptSchema = defineEntity({
  name: 'Prompt',
  properties: {
    name: p.string().primary(),
    text: p.text(),
  },
});

class Prompt extends promptSchema.class {}
promptSchema.setClass(Prompt);

export declare const options: Parameters<EntityRepository<Prompt>['findAll']>;

type IsAny<T> = 0 extends 1 & T ? true : false;
type Assert<T extends true> = T;
type EntityRemainsTyped = Assert<IsAny<Prompt> extends false ? true : false>;
type TextRemainsString = Assert<Prompt['text'] extends string ? true : false>;
type OptionsRemainTyped = Assert<IsAny<typeof options> extends false ? true : false>;
type Where = NonNullable<NonNullable<(typeof options)[0]>['where']>;

const valid: Where = { text: { $eq: 'value' } };
// @ts-expect-error A string property must not accept a number comparison.
const invalid: Where = { text: { $eq: 123 } };
