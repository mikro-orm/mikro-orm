import type * as Ast from 'typescript/ast';
import type { ClassDeclaration, Node } from 'typescript/ast';
import type * as Sync from 'typescript/sync';
import type { API, Checker, Program, Type, TypeReference } from 'typescript/sync';
import { MetadataError } from '../errors.js';
import type { EntityMetadata, EntityProperty } from '../typings.js';
import { absolutePath, normalizePath, relativePath } from '../utils/path-utils.js';
import { Utils } from '../utils/Utils.js';
import {
  AbstractTypeScriptMetadataProvider,
  type ReflectedPropertyType,
} from './AbstractTypeScriptMetadataProvider.js';
import { MetadataStorage } from './MetadataStorage.js';

interface Session {
  api: API;
  program: Program;
  checker: Checker;
  sync: typeof Sync;
  ast: typeof Ast;
}

/** Metadata provider that uses the TypeScript 7 API instead of ts-morph to infer property types. */
export class TypeScriptApiMetadataProvider extends AbstractTypeScriptMetadataProvider {
  /** Package the TypeScript 7 API is loaded from. */
  protected static apiPackage = 'typescript';

  #session?: Session;
  // `undefined` when the class does not declare the property
  readonly #types = new Map<string, Map<string, ReflectedPropertyType | undefined>>();

  protected override reflectPropertyType(
    meta: EntityMetadata,
    prop: EntityProperty,
  ): ReflectedPropertyType | undefined {
    const key = this.getKey(meta);

    if (!this.#types.get(key)?.has(prop.name)) {
      // the first lookup reflects every registered entity in the same requests
      const prefetch = this.#session
        ? []
        : Utils.values(MetadataStorage.getMetadata()).filter(m => this.getKey(m) !== key);
      this.reflect(meta, prefetch);
    }

    return this.#types.get(key)!.get(prop.name);
  }

  override loadEntityMetadata(meta: EntityMetadata): void {
    try {
      super.loadEntityMetadata(meta);
    } catch (e) {
      // discovery fails, so `combineCache` would never close the API process
      this.closeSession();
      throw e;
    }
  }

  // discovery calls this once it is done
  override combineCache(): void {
    this.closeSession();
    super.combineCache();
  }

  private closeSession(): void {
    this.#session?.api.close();
    this.#session = undefined;
    this.#types.clear();
  }

  private getKey(meta: EntityMetadata): string {
    return `${normalizePath(meta.path)}#${meta.className}`;
  }

  private open(): Session {
    const { apiPackage } = this.constructor as typeof TypeScriptApiMetadataProvider;
    // built-ins are loaded lazily to keep the main entry browser-safe
    const require = globalThis.process.getBuiltinModule('node:module').createRequire(import.meta.url);
    const { existsSync } = globalThis.process.getBuiltinModule('node:fs');
    let sync: typeof Sync;
    let ast: typeof Ast;

    try {
      sync = require(`${apiPackage}/sync`);
      ast = require(`${apiPackage}/ast`);
    } catch (e: any) {
      throw new MetadataError(
        `TypeScriptApiMetadataProvider could not load the TypeScript 7 API from '${apiPackage}', install 'typescript' 7.1+: ${e.message}`,
      );
    }

    const api = new sync.API({ cwd: process.cwd() });
    /* v8 ignore next */
    const tsConfigPath = this.config.get('discovery').tsConfigPath ?? './tsconfig.json';
    let options = {};

    try {
      options = api.parseConfigFile(normalizePath(process.cwd(), tsConfigPath)).options;
    } catch (e: any) {
      this.config.getLogger().warn('discovery', e.message);
    }

    const files = Utils.values(MetadataStorage.getMetadata())
      .map(meta => absolutePath(normalizePath(meta.path).replace(/\.js$/, '.d.ts')))
      .filter(path => existsSync(path));
    const program = api.createProgram([...new Set(files)], {
      ...options,
      strictNullChecks: true,
      module: sync.ModuleKind.Node20,
    });

    return { api, program, checker: program.getProject().checker, sync, ast };
  }

  private findClass(meta: EntityMetadata, required: boolean): ClassDeclaration | undefined {
    const { program, ast } = this.#session!;
    const path = absolutePath(meta.path);
    const source =
      program.getSourceFile(path.replace(/\.js$/, '.d.ts')) ?? program.getSourceFile(path.replace(/\.js$/, '.ts'));
    const cls = source?.statements.find(
      (node): node is ClassDeclaration => ast.isClassDeclaration(node) && node.name?.text === meta.className,
    );

    if (cls || !required) {
      return cls;
    }

    if (!source) {
      throw new MetadataError(
        `Source file '${relativePath(meta.path.replace(/\.js$/, '.ts'), this.config.get('baseDir'))}' not found. Check your 'entitiesTs' option and verify you have 'compilerOptions.declaration' enabled in your 'tsconfig.json'. If you are using webpack, see https://bit.ly/35pPDNn`,
      );
    }

    throw new MetadataError(
      `Source class for entity ${meta.className} not found. Verify you have 'compilerOptions.declaration' enabled in your 'tsconfig.json'. If you are using webpack, see https://bit.ly/35pPDNn`,
    );
  }

  private reflect(meta: EntityMetadata, prefetch: EntityMetadata[]): void {
    this.#session ??= this.open();
    const { api, checker, sync, ast } = this.#session;
    const { ModifierFlags, SymbolFlags, TypeFlags, TypeFormatFlags } = sync;
    const entities: { key: string; cls: ClassDeclaration; props: string[] }[] = [];

    for (const m of [meta, ...prefetch]) {
      const cls = this.findClass(m, m === meta);

      if (cls) {
        entities.push({ key: this.getKey(m), cls, props: Object.keys(m.properties) });
      }
    }

    // own instance members come from the AST, inherited ones from the checker
    const declarations = new Map<string, Node | undefined>();
    const inherited: { id: string; cls: ClassDeclaration; prop: string }[] = [];

    for (const { key, cls, props } of entities) {
      for (const prop of props) {
        const id = `${key}.${prop}`;
        const member = cls.members.find(
          node =>
            (ast.isPropertyDeclaration(node) ||
              ast.isGetAccessorDeclaration(node) ||
              ast.isSetAccessorDeclaration(node)) &&
            !(node.modifierFlags & ModifierFlags.Static) &&
            'text' in node.name &&
            node.name.text === prop,
        );

        if (member) {
          declarations.set(id, member);
        } else {
          inherited.push({ id, cls, prop });
        }
      }
    }

    const classes = [...new Set(inherited.map(({ cls }) => cls))];
    const classTypes = new Map(checker.getTypeAtLocation(classes).map((type, i) => [classes[i], type]));
    const symbols = api.batch(
      ...inherited.map(({ cls, prop }) => checker.getPropertyOfType.gen(classTypes.get(cls)!, prop)),
    );
    inherited.forEach(({ id }, i) => declarations.set(id, symbols[i]?.declarations[0]?.resolve()));

    const nodes = [...new Set([...declarations.values()].filter(node => node != null))];
    const types = checker.getTypeAtLocation(nodes);
    // ts-morph's default flags for `Type.getText()`
    const flags =
      TypeFormatFlags.UseTypeOfFunction |
      TypeFormatFlags.NoTruncation |
      TypeFormatFlags.UseFullyQualifiedType |
      TypeFormatFlags.WriteTypeArgumentsOfSignature;
    const texts = api.batch(...types.map((type, i) => checker.typeToString.gen(type, nodes[i], flags)));
    const arrays = api.batch(...types.map(type => checker.isArrayType.gen(type)));

    const arrayTypes = types.filter((type, i): type is TypeReference => arrays[i] && type.isTypeReference());
    const typeArguments = api.batch(...arrayTypes.map(type => checker.getTypeArguments.gen(type)));
    const elementTypes = new Map<Type, Type>(arrayTypes.map((type, i) => [type, typeArguments[i][0]]));

    const enumCandidates = types.map(type => elementTypes.get(type) ?? type);
    const enumUnions = [
      ...new Set(enumCandidates.filter(type => type.flags & TypeFlags.EnumLiteral && type.flags & TypeFlags.Union)),
    ];
    const enumSymbols = api.batch(...enumUnions.map(type => type.getSymbol.gen()));
    const enums = new Set(enumUnions.filter((type, i) => (enumSymbols[i]?.flags ?? 0) & SymbolFlags.Enum));
    const unions = [...new Set([...types, ...enums].filter(type => type.isUnionType()))];
    const unionMembers = new Map<Type, readonly Type[]>(
      api.batch(...unions.map(type => type.getTypes.gen())).map((members, i) => [unions[i], members]),
    );

    const reflected = new Map(
      nodes.map((node, i): [Node, ReflectedPropertyType] => {
        const type = types[i];
        const enumType = enumCandidates[i];
        const hasQuestionToken =
          ((ast.isPropertyDeclaration(node) || ast.isPropertySignatureDeclaration(node)) &&
            node.postfixToken?.kind === ast.SyntaxKind.QuestionToken) ||
          (ast.isParameterDeclaration(node) && !!node.questionToken);
        const isEnum = !!(enumType.flags & TypeFlags.Enum) || enums.has(enumType);

        return [
          node,
          {
            text: texts[i],
            optional:
              hasQuestionToken ||
              !!unionMembers.get(type)?.some(member => member.flags & (TypeFlags.Null | TypeFlags.Undefined)),
            array: arrays[i],
            enumItems: isEnum
              ? (unionMembers.get(enumType) ?? [])
                  .filter(member => member.isLiteralType())
                  .map(member => member.value as string | number)
              : undefined,
          },
        ];
      }),
    );

    for (const { key, props } of entities) {
      const propTypes = this.#types.get(key) ?? new Map<string, ReflectedPropertyType | undefined>();
      this.#types.set(key, propTypes);

      for (const prop of props) {
        const node = declarations.get(`${key}.${prop}`);
        propTypes.set(prop, node && reflected.get(node));
      }
    }
  }
}
