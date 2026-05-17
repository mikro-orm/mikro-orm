import type { GenerateOptions, NamingStrategy, Platform, RoutineRuntimeType } from '@mikro-orm/core';
import type { SqlRoutineDef, SqlRoutineParamDef } from '@mikro-orm/sql';

const identifierRegex = /^(?:[$_\p{ID_Start}])(?:[$\p{ID_Continue}])*$/u;

function quote(val: string): string {
  // Backslashes first so subsequent escapes don't double up the `\` we just added.
  const escaped = val
    .replaceAll('\\', '\\\\')
    .replaceAll('\r', '\\r')
    .replaceAll('\n', '\\n')
    .replaceAll('\t', '\\t')
    .replaceAll(`'`, `\\'`);
  return `'${escaped}'`;
}

function safeKey(name: string): string {
  return identifierRegex.test(name) ? name : quote(name);
}

function quoteMultiline(val: string): string {
  if (val.includes('\n') || val.includes('`') || val.includes('${')) {
    return `\`${val.replaceAll('\\', '\\\\').replaceAll('`', '\\`').replaceAll('${', '\\${')}\``;
  }

  return quote(val);
}

function toPascalCase(name: string): string {
  return name
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

// `satisfies` ties this list to `RoutineRuntimeType` so the runtime set can't drift from the union.
const ROUTINE_RUNTIME_TYPES = [
  'string',
  'number',
  'boolean',
  'bigint',
  'Buffer',
  'Date',
  'object',
  'any',
] as const satisfies readonly RoutineRuntimeType[];
const ROUTINE_RUNTIME_TYPE_SET = new Set<string>(ROUTINE_RUNTIME_TYPES);

function narrowRuntimeType(runtimeType: string | undefined): string {
  return runtimeType && ROUTINE_RUNTIME_TYPE_SET.has(runtimeType) ? runtimeType : 'any';
}

/** Always emits the class-less `new Routine(...)` form; there is no decorator form for routines. */
export class RoutineSourceFile {
  constructor(
    private readonly routine: SqlRoutineDef,
    private readonly namingStrategy: NamingStrategy,
    private readonly platform: Platform,
    private readonly options: GenerateOptions,
  ) {}

  generate(): string {
    return this.emitRoutine(this.getClassName(), this.buildConfig());
  }

  getBaseName(extension = '.ts'): string {
    return `${this.options.fileName!(this.getClassName())}${extension}`;
  }

  getClassName(): string {
    return toPascalCase(this.routine.name);
  }

  private buildConfig(): string {
    const lines: string[] = [];

    lines.push(`  name: ${quote(this.routine.name)},`);
    lines.push(`  type: ${quote(this.routine.type)},`);

    if (this.routine.schema) {
      lines.push(`  schema: ${quote(this.routine.schema)},`);
    }

    if (this.routine.language) {
      lines.push(`  language: ${quote(this.routine.language)},`);
    }

    if (this.routine.security) {
      lines.push(`  security: ${quote(this.routine.security)},`);
    }

    if (this.routine.deterministic != null) {
      lines.push(`  deterministic: ${this.routine.deterministic},`);
    }

    if (this.routine.comment) {
      lines.push(`  comment: ${quote(this.routine.comment)},`);
    }

    if (this.routine.params.length > 0) {
      lines.push(`  params: ${this.formatParams(this.routine.params)},`);
    } else {
      lines.push(`  params: {},`);
    }

    if (this.routine.returns) {
      lines.push(`  returns: ${this.formatReturns(this.routine.returns)},`);
    }

    if (this.routine.body) {
      lines.push(`  body: ${quoteMultiline(this.routine.body)},`);
    } else if (this.routine.expression) {
      lines.push(`  expression: ${quoteMultiline(this.routine.expression)},`);
    }

    return `{\n${lines.join('\n')}\n}`;
  }

  private formatParams(params: SqlRoutineParamDef[]): string {
    const lines = params.map(p => {
      const parts: string[] = [`type: ${quote(p.type)}`];

      if (p.direction !== 'in') {
        parts.push(`direction: ${quote(p.direction)}`);
      }

      if (p.direction === 'out' || p.direction === 'inout') {
        parts.push(`ref: true`);
      }

      if (p.nullable) {
        parts.push(`nullable: true`);
      }

      if (p.defaultRaw) {
        parts.push(`defaultRaw: ${quote(p.defaultRaw)}`);
      }

      return `    ${safeKey(p.name)}: { ${parts.join(', ')} },`;
    });

    return `{\n${lines.join('\n')}\n  }`;
  }

  private formatReturns(returns: NonNullable<SqlRoutineDef['returns']>): string {
    const parts: string[] = [];

    // Narrow to `RoutineRuntimeType`; unrecognised types collapse to `'any'`.
    const inferred = returns.runtimeType ?? this.platform.getMappedType(returns.type)?.runtimeType;
    parts.push(`runtimeType: ${quote(narrowRuntimeType(inferred))}`);

    parts.push(`columnType: ${quote(returns.type)}`);

    if (returns.nullable) {
      parts.push(`nullable: true`);
    }

    return `{ ${parts.join(', ')} }`;
  }

  private emitRoutine(className: string, config: string): string {
    return `import { Routine } from '@mikro-orm/core';\n\nexport const ${className} = new Routine(${config});\n`;
  }
}
