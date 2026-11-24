"""
Rebuilds public/data/questions-bt101co.json (the Code Clash bank) from r1.py, r2.py and r3.py.

    python3 scripts/question-banks/bt101co/build.py

Every code snippet and expression is run while the bank is built, and the right option is whatever Python
really prints, so a wrong answer key can't slip in. Editing the JSON by hand is fine too, but then nothing
re-checks the answers.
"""
import collections, json, os
import r1, r2, r3, lib

# Round 1 is mostly medium; give the draw a gentle ramp by marking a few easier and harder ones.
EASY = {'t-print-fn','t-keyword','t-compound','t-noreturn','t-range-list','t-odd','t-not','t-divmod'}
HARD = {'t-neg-floor','t-invert','t-first-true','t-shortcircuit','t-bigint','t-return-tuple','t-continue'}
for q in lib.QS:
    if q['id'] in EASY: q['difficulty'] = 'easy'
    if q['id'] in HARD: q['difficulty'] = 'hard'

bank = {
  'version': 1,
  'categories': [
    {'id': 'py-intro',   'name': 'Unit 1 · Python basics',    'icon': '🐍'},
    {'id': 'py-data',    'name': 'Unit 2 · Data & I/O',       'icon': '🔤'},
    {'id': 'py-ops',     'name': 'Unit 3 · Operators',        'icon': '➕'},
    {'id': 'py-control', 'name': 'Unit 4 · Control flow',     'icon': '🔁'},
    {'id': 'round-turns', 'name': 'Turn by turn',  'icon': '🎯'},
    {'id': 'round-rapid', 'name': 'Rapid fire',    'icon': '⚡'},
    {'id': 'round-hard',  'name': 'Hard questions','icon': '🔥'},
  ],
  'questions': lib.QS,
}
# checks
pos = collections.Counter(); longest = []
for q in lib.QS:
    assert q['explanation'], q['id']
    if q['type'] == 'mcq':
        pos[q['answerIndex']] += 1
        for o in q['options']:
            if len(o) > 40: longest.append((q['id'], len(o), o))
print('answer positions', dict(sorted(pos.items())))
print('long options', longest)
print('per prefix', collections.Counter(q['id'].split('-')[0] for q in lib.QS))
print('difficulty', {p: dict(collections.Counter(q['difficulty'] for q in lib.QS if q['id'].startswith(p+'-'))) for p in 'trhb'})
print('units', dict(collections.Counter(next(t for t in q['tags'] if t.startswith('unit')) for q in lib.QS)))
json.dump(bank, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'public', 'data', 'questions-bt101co.json'), 'w'), indent=1, ensure_ascii=False)
