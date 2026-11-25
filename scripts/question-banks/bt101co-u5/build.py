"""
Rebuilds public/data/questions-bt101co-u5.json (the Code Clash II bank, Units 1-5) from r1.py, r2.py and r3.py.

    python3 scripts/question-banks/bt101co-u5/build.py

Every snippet and expression is run while the bank is built, and the right option is whatever Python really
prints, so a wrong answer key can't slip in.
"""
import collections, json, os
import r1, r2, r3, lib

bank = {
  'version': 1,
  'categories': [
    {'id': 'py-intro',   'name': 'Unit 1 · Python basics',     'icon': '🐍'},
    {'id': 'py-data',    'name': 'Unit 2 · Data & I/O',        'icon': '🔤'},
    {'id': 'py-ops',     'name': 'Unit 3 · Operators',         'icon': '➕'},
    {'id': 'py-control', 'name': 'Unit 4 · Control flow',      'icon': '🔁'},
    {'id': 'py-func',    'name': 'Unit 5 · Functions & lists', 'icon': '🧩'},
    {'id': 'round-turns', 'name': 'Turn by turn',  'icon': '🎯'},
    {'id': 'round-rapid', 'name': 'Rapid fire',    'icon': '⚡'},
    {'id': 'round-hard',  'name': 'Hard questions','icon': '🔥'},
  ],
  'questions': lib.QS,
}
pos = collections.Counter()
for q in lib.QS:
    assert q['explanation'], q['id']
    if q['type'] == 'mcq':
        pos[q['answerIndex']] += 1
print('answer positions', dict(sorted(pos.items())))
print('per prefix', collections.Counter(q['id'].split('-')[0] for q in lib.QS))
print('units', dict(sorted(collections.Counter(next(t for t in q['tags'] if t.startswith('unit')) for q in lib.QS).items())))
ids = {p: [q['id'] for q in lib.QS if q['id'].startswith(p + '-')] for p in 'urh'}
ids['h'] += [q['id'] for q in lib.QS if q['id'].startswith('b-')]
json.dump(ids, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ids.json'), 'w'), indent=1)
json.dump(bank, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'public', 'data', 'questions-bt101co-u5.json'), 'w'), indent=1, ensure_ascii=False)
