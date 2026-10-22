// Self-contained test script for the garden interpreter + simulation (no test framework needed).
// Run:  npx esbuild src/garden/__tests__/garden.test.ts --bundle --platform=node --outfile=/tmp/gtest.mjs && node /tmp/gtest.mjs

import { GardenError, countCodeLines, parse } from '../interpreter';
import { applyAction, createState, emptyGrid, makeTile } from '../sim';
import { runHeadless } from '../session';
import { GARDEN_MISSIONS, computeStars, initialStateFor, isGoalMet } from '../missions';

let failures = 0;
let passes = 0;
const check = (name: string, cond: boolean, detail = '') => {
  if (cond) passes++;
  else {
    failures++;
    console.log(`FAIL ${name}${detail ? `: ${detail}` : ''}`);
  }
};

const blank = () => createState(emptyGrid(), 100);
const run = (src: string, init = blank()) => runHeadless(src, init);
const printsOf = (src: string) => {
  const r = run(src);
  if (r.error) console.log(`  (error in ${JSON.stringify(src.slice(0, 40))}: line ${r.error.line} ${r.error.message})`);
  return r.prints.join('|');
};
const errorOf = (src: string) => {
  const r = run(src);
  return r.error ? `${r.error.line}:${r.error.message}` : `no error (${r.status})`;
};

// ---------------- interpreter ----------------

check('arith', printsOf('print(1 + 2 * 3, 7 // 2, -7 // 2, 7 % 3, -7 % 3, 2 ** 3, 7 / 2)') === '7 3 -4 1 2 8 3.5');
check('strings', printsOf('x = "ab" + \'cd\'\nprint(x, len(x), x * 2, "b" in x)') === 'abcd 4 abcdabcd True');
check('bool ops', printsOf('print(True and 0, 0 or "x", not None, 1 < 2 < 3, 3 > 2 > 2)') === '0 x True True False');
check('ternary', printsOf('a = 5\nprint("big" if a > 3 else "small", "big" if a > 9 else "small")') === 'big small');
check('None/is', printsOf('x = None\nprint(x is None, x is not None, x)') === 'True False None');
check(
  'elif chain',
  printsOf(`for i in range(4):
    if i == 0:
        print("zero")
    elif i == 1:
        print("one")
    elif i == 2:
        print("two")
    else:
        print("many")`) === 'zero|one|two|many'
);
check(
  'while True break',
  printsOf(`n = 0
while True:
    n += 1
    if n >= 5:
        break
print(n)`) === '5'
);
check(
  'continue',
  printsOf(`total = 0
for i in range(10):
    if i % 2 == 1:
        continue
    total += i
print(total)`) === '20'
);
check('range step', printsOf('s = ""\nfor i in range(10, 0, -3):\n    s = s + str(i) + ","\nprint(s)') === '10,7,4,1,');
check(
  'def/return/recursion',
  printsOf(`def fact(n):
    if n <= 1:
        return 1
    return n * fact(n - 1)

def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)
print(fact(6), fib(15))`) === '720 610'
);
check(
  'globals & locals',
  printsOf(`count = 0
def bump():
    global count
    count += 1
def shadow():
    count = 99
    return count
bump()
bump()
print(count, shadow(), count)`) === '2 99 2'
);
check('tabs indentation', printsOf('for i in range(2):\n\tif i == 1:\n\t\tprint("tab", i)\n\tpass') === 'tab 1');
check('2-space indentation', printsOf('for i in range(2):\n  if i == 1:\n    print("two", i)') === 'two 1');
check('inline comments', printsOf('x = 3  # three\n# full line\n\n    # indented comment\nprint(x) # done') === '3');
check('builtins', printsOf('print(abs(-3), min(4, 2, 8), max(range(5)), int(3.9), round(2.567, 2), str(5) + "!")') === '3 2 4 3 2.57 5!');
check('one-liner if', printsOf('x = 1\nif x == 1: print("yes")') === 'yes');
check('multiline call', printsOf('print(1,\n      2)') === '1 2');

// errors with line numbers
check('NameError', errorOf('x = 1\nprint(foo)') === "2:NameError: 'foo' is not defined");
check('missing colon', errorOf('x = 1\nif x == 1\n    pass') === "2:SyntaxError: expected ':' after 'if'", errorOf('x = 1\nif x == 1\n    pass'));
check('expected indent', errorOf('for i in range(3):\nprint(i)').startsWith("2:IndentationError: expected an indented block after 'for' on line 1"), errorOf('for i in range(3):\nprint(i)'));
check('unexpected indent', errorOf('x = 1\n    y = 2') === '2:IndentationError: unexpected indent');
check('bad dedent', errorOf('if True:\n        x = 1\n    y = 2').startsWith('3:IndentationError'));
check('unclosed paren', errorOf('x = 1\nprint((1 + 2)\ny = 3').startsWith("2:SyntaxError: '(' was never closed"), errorOf('x = 1\nprint((1 + 2)\ny = 3'));
check('= in condition', errorOf('x = 1\nif x = 1:\n    pass').includes("Maybe you meant '=='"));
check('break outside loop', errorOf('x = 1\nbreak') === "2:SyntaxError: 'break' outside loop");
check('type error', errorOf('x = "a" + 1').startsWith('1:TypeError: can only concatenate str'));
check('zero div', errorOf('\n\nx = 1 / 0') === '3:ZeroDivisionError: division by zero');
check('bad move', errorOf('move("up-left")').startsWith("1:ValueError: move() expects"));
check('arg count', errorOf('def f(a):\n    return a\nf()').startsWith("3:TypeError: f() missing 1 required argument: 'a'"));
check('bare function', errorOf('harvest').includes('Call it with harvest()'));
check('recursion limit', errorOf('def f(n):\n    return f(n + 1)\nf(0)') === '2:RecursionError: maximum recursion depth exceeded', errorOf('def f(n):\n    return f(n + 1)\nf(0)'));
check('infinite loop guard', /^[23]:Infinite loop\? No farming action in 20000 steps$/.test(errorOf('x = 0\nwhile True:\n    x += 1')), errorOf('x = 0\nwhile True:\n    x += 1'));
check('infinite loop pass', errorOf('while True:\n    pass').includes('Infinite loop?'));
check('unsupported keyword', errorOf('import os').startsWith("1:SyntaxError: 'import' is not supported"));
check('no eval access', errorOf('eval("1")') === "1:NameError: 'eval' is not defined");
check('GardenError instance', (() => { try { parse('if'); return false; } catch (e) { return e instanceof GardenError; } })());

// action guard: 400 actions then graceful stop, results kept
{
  const r = run('while True:\n    wait()');
  check('out of energy', r.status === 'out_of_energy' && r.actions === 400 && r.state.tick === 400, `${r.status} ${r.actions}`);
}
// actions reset the infinite loop budget
{
  const r = run('for i in range(16000):\n    if i % 8000 == 0:\n        wait()');
  check('budget resets after action', r.status === 'finished' && r.actions === 2, `${r.status} ${r.error?.message}`);
}
check('countCodeLines', countCodeLines('# c\n\nx = 1\n  # c2\ny = 2\n') === 2);

// ---------------- simulation ----------------
{
  let s = createState(emptyGrid(), 10);
  const step = (a: Parameters<typeof applyAction>[1]) => {
    const r = applyAction(s, a);
    s = r.state;
    return r;
  };
  step({ type: 'plant', crop: 'carrot' });
  check('plant cost', s.coins === 7 && s.grid[0][0].crop === 'carrot');
  check('growth after plant tick', Math.abs(s.grid[0][0].growth - 1 / 6) < 1e-6);
  const again = step({ type: 'plant', crop: 'carrot' });
  check('plant on non-empty is no-op', again.result === false && s.coins === 7 && again.events[0].kind === 'fail');
  step({ type: 'water' });
  check('watered doubles growth', Math.abs(s.grid[0][0].growth - (2 / 6 + 2 / 6)) < 1e-6 && s.grid[0][0].waterTicks === 9);
  const early = applyAction(s, { type: 'harvest' });
  check('early harvest destroys', early.state.grid[0][0].crop === 'none' && early.state.coins === 7 && early.events[0].kind === 'spoil');
  step({ type: 'wait' });
  step({ type: 'wait' });
  const h = step({ type: 'harvest' });
  check('mature harvest pays', h.result === true && s.coins === 27 && s.earned === 20 && s.inventory.carrot === 1);
  const none = step({ type: 'harvest' });
  check('empty harvest', none.result === false && s.coins === 27);
  check('tick count', s.tick === 7);
  const poor = applyAction({ ...s, coins: 1 }, { type: 'plant', crop: 'pumpkin' });
  check('not enough coins', poor.result === false && poor.state.coins === 1);
  const locked = applyAction({ ...s, lockedCrops: ['sunflower'] }, { type: 'plant', crop: 'sunflower' });
  check('locked crop', locked.result === false && locked.events[0].message.includes('locked'));
  step({ type: 'move', dir: 'W' });
  check('wrap west', s.drone.x === 4 && s.drone.dir === 'W');
  step({ type: 'move', dir: 'N' });
  check('wrap north', s.drone.y === 4);
  step({ type: 'turn', turn: 'right' });
  step({ type: 'turn', turn: 'right' });
  step({ type: 'move' });
  check('turn + move facing', s.drone.dir === 'S' && s.drone.y === 0);
  // water evaporates
  for (let i = 0; i < 12; i++) step({ type: 'wait' });
  check('water dries', s.grid[0][0].watered === false && s.grid[0][0].waterTicks === 0);
  // immutability
  const before = s;
  const snapshot = JSON.stringify(before);
  applyAction(before, { type: 'plant', crop: 'wheat' });
  check('reducer is pure', JSON.stringify(before) === snapshot);
  const g = createState([[makeTile('wheat', 0.9)]].concat(emptyGrid().slice(1)).map((r) => r.concat(emptyGrid()[0]).slice(0, 5)), 0);
  check('makeTile grid ok', g.grid[0][0].crop === 'wheat');
}

// queries & harvest return values through the interpreter
{
  const init = createState(emptyGrid(), 10);
  init.grid[0][0] = makeTile('wheat', 1);
  const r = run(
    `print(get_x(), get_y(), get_crop(), get_growth(), can_harvest(), is_empty(), get_coins(), get_tick())
ok = harvest()
print(ok, get_crop(), get_coins(), get_tick())
move(south)
turn_right()
move()
print(get_x(), get_y(), plant("pumpkin"), get_crop(), get_coins())`,
    init
  );
  check(
    'queries',
    r.prints.join('|') === '0 0 wheat 1 True False 10 0|True None 18 1|4 1 True pumpkin 8',
    r.prints.join('|') + (r.error ? ` ERR ${r.error.message}` : '')
  );
}

// ---------------- missions ----------------
console.log('\nMission  goal  stars  ticks/par  lines/par  status');
for (const m of GARDEN_MISSIONS) {
  const solution = m.hints[m.hints.length - 1];
  const init = initialStateFor(m, []);
  const r = runHeadless(solution, init, { stopWhen: (s, hasDef) => isGoalMet(m, s, hasDef) });
  const met = isGoalMet(m, r.state, r.hasDef);
  const stars = computeStars(m, met, r.state.tick, solution);
  console.log(
    `${m.id.padEnd(8)} ${String(met).padEnd(5)} ${stars}      ${r.state.tick}/${m.par.ticks}`.padEnd(36) +
      `${countCodeLines(solution)}/${m.par.lines}       ${r.status}${r.error ? ` ${r.error.line}:${r.error.message}` : ''}` +
      `  coins=${r.state.coins} earned=${r.state.earned}`
  );
  if (m.goal.kind === 'none') {
    check(`${m.id} sandbox solution runs`, !r.error, r.error?.message);
  } else {
    check(`${m.id} solution earns 3 stars`, stars === 3);
    // the template must NOT already solve the mission
    const t = runHeadless(m.template, initialStateFor(m, []), { stopWhen: (s, hasDef) => isGoalMet(m, s, hasDef) });
    check(`${m.id} template parses`, !t.error, t.error && `${t.error.line}:${t.error.message}`);
    check(`${m.id} template is not a solution`, !isGoalMet(m, t.state, t.hasDef));
  }
  const tmpl = runHeadless(m.template, initialStateFor(m, []), { stopWhen: (s, hasDef) => isGoalMet(m, s, hasDef) });
  check(`${m.id} template has no errors`, !tmpl.error, tmpl.error?.message);
}
// M4 requires def
{
  const m = GARDEN_MISSIONS[3];
  const noDef = `for lap in range(2):
    for i in range(5):
        if can_harvest():
            harvest()
        if is_empty():
            plant("wheat")
            water()
        move(east)`;
  const r = runHeadless(noDef, initialStateFor(m, []));
  check('m4 needs def', r.state.earned >= 100 && !isGoalMet(m, r.state, r.hasDef));
}

console.log(`\n${passes} passed, ${failures} failed`);
if (failures) throw new Error(`${failures} garden tests failed`);
