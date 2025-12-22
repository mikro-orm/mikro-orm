import { MikroORM } from '@mikro-orm/core';

type Result = Record<string, ReturnType<typeof analyze>>;

function analyze(samples: number[]) {
  const sorted = [...samples].sort((a, b) => a - b);
  const mean = sorted.reduce((sum, v) => sum + v, 0) / sorted.length;
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  const percentile = (p: number) => sorted[Math.ceil((p / 100) * sorted.length) - 1];
  const round = (v: number) => Math.round(v * 1000) / 1000;

  return {
    runs: sorted.length,
    mean: round(mean),
    median: round(median),
    p90: round(percentile(90)),
    p95: round(percentile(95)),
    min: round(sorted[0]),
    max: round(sorted[sorted.length - 1]),
  };
}

async function bench(orm: MikroORM, result: Result, title: string, cb: (args: Record<string, any>) => Promise<any>, setup?: (em: any) => Promise<any>) {
  // eslint-disable-next-line no-console
  console.log(`running benchmark: ${title}`);

  // warmup
  for (let i = 0; i < 10; i++) {
    const args = await setup?.(orm.em.fork());
    await cb(args);
    await orm.schema.clear();
    process.stdout.write('.');
  }

  const samples: number[] = [];

  for (let i = 0; i < 50; i++) {
    const args = await setup?.(orm.em.fork());
    const start = performance.now();
    await cb(args);
    const diff = performance.now() - start;
    samples.push(diff);
    await orm.schema.clear();
    process.stdout.write('.');
  }

  result[title] = analyze(samples);
  process.stdout.write('\n');
}

export function createBenchmark(orm: MikroORM) {
  const result: Result = {};
  return { bench: bench.bind(null, orm, result), result };
}
