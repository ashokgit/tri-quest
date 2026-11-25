"""Helpers for authoring the BT101CO Units 1-5 bank. Every code/expression answer is computed by running Python."""
import hashlib, io, contextlib, textwrap

CAT = {1: 'py-intro', 2: 'py-data', 3: 'py-ops', 4: 'py-control', 5: 'py-func'}
QS = []
IDS = set()

def _place(qid, right, wrong):
    assert len(wrong) in (1, 2, 3), qid
    assert right not in wrong, (qid, right)
    assert len(set(wrong)) == len(wrong), (qid, wrong)
    opts = list(wrong)
    n = len(opts) + 1
    i = int(hashlib.md5(qid.encode()).hexdigest(), 16) % n
    opts.insert(i, right)
    return opts, i

def _add(q):
    assert q['id'] not in IDS, q['id']
    IDS.add(q['id'])
    QS.append(q)

def _base(qid, unit, diff, prompt, expl, tags, show=None, code=False, hint=None):
    q = dict(id=qid, category=CAT[unit], difficulty=diff, prompt=prompt, explanation=expl,
             tags=[f'unit{unit}'] + list(tags))
    if show is not None:
        q['showcase'] = show
        if code:
            q['tags'].append('code')
    if hint:
        q['hint'] = hint
    return q

def Q(qid, unit, diff, prompt, right, wrong, expl, hint=None, tags=()):
    """Plain multiple choice."""
    q = _base(qid, unit, diff, prompt, expl, tags, hint=hint)
    q['type'] = 'mcq'
    q['options'], q['answerIndex'] = _place(qid, right, wrong)
    _add(q)

def TF(qid, unit, diff, statement, answer, expl, tags=()):
    q = _base(qid, unit, diff, 'True or false?', expl, tags, show=statement)
    # statements read like a sentence, not code
    q['type'] = 'truefalse'
    q['answer'] = answer
    _add(q)

def _run(code):
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        exec(textwrap.dedent(code), {})
    return buf.getvalue()

def _show(out):
    return ' then '.join(out.strip('\n').split('\n')).strip()

def C(qid, unit, diff, code, wrong, expl, prompt='What does this print?', hint=None, tags=(), out=None):
    """Code question: the right option is whatever the code really prints (checked against `out`)."""
    code = textwrap.dedent(code).strip('\n')
    got = _run(code)
    if out is not None:
        assert got.rstrip() == out.rstrip(), (qid, got, out)
    right = _show(got)
    for w in wrong:
        assert w != right, (qid, 'distractor equals the answer', w)
    q = _base(qid, unit, diff, prompt, expl, tags, show=code, code=True, hint=hint)
    q['type'] = 'mcq'
    q['options'], q['answerIndex'] = _place(qid, right, wrong)
    _add(q)

def X(qid, unit, diff, expr, wrong, expl, prompt='What does this evaluate to?', hint=None, tags=()):
    """Expression question: the right option is repr(eval(expr))."""
    right = repr(eval(expr, {}))
    for w in wrong:
        assert w != right, (qid, 'distractor equals the answer', w)
    q = _base(qid, unit, diff, prompt, expl, tags, show=expr, code=True, hint=hint)
    q['type'] = 'mcq'
    q['options'], q['answerIndex'] = _place(qid, right, wrong)
    _add(q)

def E(qid, unit, diff, snippet, error, wrong, expl, prompt='What happens when this runs?', hint=None, tags=()):
    """Question whose answer is an exception: verify it really raises `error`."""
    try:
        exec(textwrap.dedent(snippet), {})
    except Exception as e:
        assert type(e).__name__ == error, (qid, type(e).__name__)
    else:
        raise AssertionError((qid, 'did not raise'))
    q = _base(qid, unit, diff, prompt, expl, tags, show=textwrap.dedent(snippet).strip('\n'), code=True, hint=hint)
    q['type'] = 'mcq'
    q['options'], q['answerIndex'] = _place(qid, f'{error}', wrong)
    _add(q)
