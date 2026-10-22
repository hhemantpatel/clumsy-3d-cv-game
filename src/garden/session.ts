// Glue between the interpreter (generator) and the pure simulation. A GardenSession owns the
// current GardenState and advances one farming action per step(). Used by GardenContext for
// live playback and by runHeadless() for tests.

import { GardenError, parse, runProgram } from './interpreter';
import type { ActionRequest, GardenHost, Program, QueryName, RunOutcome, RunOptions, Value } from './interpreter';
import { applyAction, isMature } from './sim';
import type { GardenState, SimAction, SimEvent } from './sim';

export interface PrintLine {
  text: string;
  line: number;
}

export type StepResult =
  | { kind: 'action'; line: number; action: SimAction; events: SimEvent[]; prints: PrintLine[] }
  | { kind: 'done'; status: RunOutcome['status']; prints: PrintLine[] }
  | { kind: 'error'; error: GardenError; prints: PrintLine[] };

export const queryState = (s: GardenState, name: QueryName): Value => {
  const t = s.grid[s.drone.y][s.drone.x];
  switch (name) {
    case 'can_harvest':
      return isMature(t);
    case 'is_empty':
      return t.crop === 'none';
    case 'is_watered':
      return t.watered;
    case 'get_x':
      return s.drone.x;
    case 'get_y':
      return s.drone.y;
    case 'get_crop':
      return t.crop === 'none' ? null : t.crop;
    case 'get_growth':
      return Math.round(t.growth * 1000) / 1000;
    case 'get_coins':
      return s.coins;
    case 'get_tick':
      return s.tick;
  }
};

const toGardenError = (e: unknown): GardenError => {
  if (e instanceof GardenError) return e;
  if (e instanceof RangeError) return new GardenError('RecursionError: maximum recursion depth exceeded', 0);
  return new GardenError(`InternalError: ${e instanceof Error ? e.message : String(e)}`, 0);
};

export class GardenSession {
  state: GardenState;
  readonly program: Program | null = null;
  readonly parseError: GardenError | null = null;
  private gen: Generator<ActionRequest, RunOutcome, Value | undefined> | null = null;
  private pendingResult: Value | undefined = undefined;
  private prints: PrintLine[] = [];
  done = false;

  constructor(source: string, initial: GardenState, opts: RunOptions = {}) {
    this.state = initial;
    try {
      this.program = parse(source);
    } catch (e) {
      this.parseError = toGardenError(e);
      return;
    }
    const host: GardenHost = {
      query: (name) => queryState(this.state, name),
      print: (text, line) => {
        this.prints.push({ text, line });
      },
    };
    this.gen = runProgram(this.program, host, opts);
  }

  get hasDef(): boolean {
    return !!this.program?.hasDef;
  }

  step(): StepResult {
    if (this.parseError) {
      this.done = true;
      return { kind: 'error', error: this.parseError, prints: [] };
    }
    if (this.done || !this.gen) return { kind: 'done', status: 'finished', prints: [] };
    this.prints = [];
    let r: IteratorResult<ActionRequest, RunOutcome>;
    try {
      r = this.gen.next(this.pendingResult);
    } catch (e) {
      this.done = true;
      return { kind: 'error', error: toGardenError(e), prints: this.prints };
    }
    if (r.done) {
      this.done = true;
      return { kind: 'done', status: r.value.status, prints: this.prints };
    }
    const { action, line } = r.value;
    const res = applyAction(this.state, action);
    this.state = res.state;
    this.pendingResult = res.result;
    return { kind: 'action', line, action, events: res.events, prints: this.prints };
  }

  /** Abort the program (runs generator finally-blocks). */
  stop() {
    this.done = true;
    try {
      this.gen?.return({ status: 'finished', actions: 0 });
    } catch {
      // ignore
    }
  }
}

export interface HeadlessResult {
  state: GardenState;
  status: 'finished' | 'out_of_energy' | 'error' | 'stopped';
  error?: GardenError;
  prints: string[];
  events: SimEvent[];
  actions: number;
  hasDef: boolean;
}

/** Run a program to completion against a headless state (pure; for tests and previews). */
export function runHeadless(
  source: string,
  initial: GardenState,
  opts: RunOptions & { stopWhen?: (s: GardenState, hasDef: boolean) => boolean } = {}
): HeadlessResult {
  const session = new GardenSession(source, initial, opts);
  const prints: string[] = [];
  const events: SimEvent[] = [];
  let actions = 0;
  for (;;) {
    const r = session.step();
    prints.push(...r.prints.map((p) => p.text));
    if (r.kind === 'error') {
      return { state: session.state, status: 'error', error: r.error, prints, events, actions, hasDef: session.hasDef };
    }
    if (r.kind === 'done') {
      return { state: session.state, status: r.status, prints, events, actions, hasDef: session.hasDef };
    }
    actions++;
    events.push(...r.events);
    if (opts.stopWhen?.(session.state, session.hasDef)) {
      session.stop();
      return { state: session.state, status: 'stopped', prints, events, actions, hasDef: session.hasDef };
    }
  }
}
