import { ModuleKind, Project, type PropertyDeclaration, type SourceFile } from 'ts-morph';
import {
  AbstractTypeScriptMetadataProvider,
  type EntityMetadata,
  type EntityProperty,
  MetadataError,
  MetadataStorage,
  type ReflectedPropertyType,
  Utils,
} from '@mikro-orm/core';
import { fs } from '@mikro-orm/core/fs-utils';

/** Metadata provider that uses ts-morph to infer property types from TypeScript source files or declaration files. */
export class TsMorphMetadataProvider extends AbstractTypeScriptMetadataProvider {
  private project!: Project;
  private sources!: SourceFile[];

  getExistingSourceFile(path: string, ext?: string, validate = true): SourceFile {
    if (!ext) {
      return this.getExistingSourceFile(path, '.d.ts', false) || this.getExistingSourceFile(path, '.ts');
    }

    const tsPath = /.*\/[^/]+$/.exec(path)![0].replace(/\.js$/, ext);

    return this.getSourceFile(tsPath, validate)!;
  }

  /** Reads the declared type of `prop`, or returns `undefined` when the entity class has no such property. */
  protected override reflectPropertyType(
    meta: EntityMetadata,
    prop: EntityProperty,
  ): ReflectedPropertyType | undefined {
    const source = this.getExistingSourceFile(meta.path);
    const cls = source.getClass(meta.className);

    /* v8 ignore next */
    if (!cls) {
      throw new MetadataError(
        `Source class for entity ${meta.className} not found. Verify you have 'compilerOptions.declaration' enabled in your 'tsconfig.json'. If you are using webpack, see https://bit.ly/35pPDNn`,
      );
    }

    const property = (cls.getInstanceProperty(prop.name) ??
      // fallback to the type checker for inherited properties (e.g. with TC39/ES decorators)
      cls.getType().getProperty(prop.name)?.getDeclarations()?.[0]) as PropertyDeclaration | undefined;

    if (!property) {
      return undefined;
    }

    const tsType = property.getType();
    const array = tsType.isArray();
    const enumType = array ? tsType.getArrayElementType()! : tsType;

    return {
      text: tsType.getText(property),
      optional: !!property.hasQuestionToken?.() || tsType.isNullable(),
      array,
      enumItems: enumType.isEnum()
        ? (enumType.getUnionTypes().map(t => t.getLiteralValueOrThrow()) as string[])
        : undefined,
    };
  }

  private getSourceFile(tsPath: string, validate: boolean): SourceFile | undefined {
    if (!this.sources) {
      this.initSourceFiles();
    }

    const baseDir = this.config.get('baseDir');
    const outDir = this.project.getCompilerOptions().outDir;
    let path = tsPath;

    /* v8 ignore next */
    if (outDir != null) {
      const outDirRelative = fs.relativePath(outDir, baseDir);
      path = path.replace(new RegExp(`^${outDirRelative}`), '');
    }

    path = this.stripRelativePath(path);
    const source = this.sources.find(s => s.getFilePath().endsWith(path));

    if (!source && validate) {
      throw new MetadataError(
        `Source file '${fs.relativePath(tsPath, baseDir)}' not found. Check your 'entitiesTs' option and verify you have 'compilerOptions.declaration' enabled in your 'tsconfig.json'. If you are using webpack, see https://bit.ly/35pPDNn`,
      );
    }

    return source;
  }

  private stripRelativePath(str: string): string {
    return str.replace(/^(?:\.\.\/|\.\/)+/, '/');
  }

  private initProject(): void {
    /* v8 ignore next */
    const tsConfigFilePath = this.config.get('discovery').tsConfigPath ?? './tsconfig.json';

    try {
      this.project = new Project({
        tsConfigFilePath: fs.normalizePath(process.cwd(), tsConfigFilePath),
        skipAddingFilesFromTsConfig: true,
        compilerOptions: {
          strictNullChecks: true,
          module: ModuleKind.Node20,
        },
      });
    } catch (e: any) {
      this.config.getLogger().warn('discovery', e.message);
      this.project = new Project({
        compilerOptions: {
          strictNullChecks: true,
          module: ModuleKind.Node20,
        },
      });
    }
  }

  private initSourceFiles(): void {
    this.initProject();
    this.sources = [];

    // All entity files are first required during the discovery, before we reach here, so it is safe to get the parts from the global
    // metadata storage. We know the path thanks to the decorators being executed. In case we are running the TS code, the extension
    // will be already `.ts`, so no change is needed. `.js` files will get renamed to `.d.ts` files as they will be used as a source for
    // the ts-morph reflection.
    for (const meta of Utils.values(MetadataStorage.getMetadata())) {
      const metaPath = fs.normalizePath(meta.path);
      /* v8 ignore next */
      const path = /\.[jt]s$/.exec(metaPath) ? metaPath.replace(/\.js$/, '.d.ts') : `${metaPath}.d.ts`; // when entities are bundled, their paths are just their names
      const sourceFile = this.project.addSourceFileAtPathIfExists(path);

      if (sourceFile) {
        this.sources.push(sourceFile);
      }
    }
  }
}
