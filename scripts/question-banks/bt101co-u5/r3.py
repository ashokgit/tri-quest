from lib import *

# ───────── Round 3 · Trace the code (hard, 2 minutes, lifelines) ─────────
C('h-mutdefault', 5, 'hard', '''
def add(x, L=[]):
    L.append(x)
    return L
print(add(1), add(2))
''', ['[1] [2]', '[1] [1, 2]', '[1, 2] [2]'],
  'The default list is created once, when def runs, and every call that leaves L out shares it. Both results are that same list, now [1, 2].',
  hint='How many times is the default value [] created?')
C('h-late-lambda', 5, 'hard', '''
fs = [lambda: i for i in range(3)]
print([f() for f in fs])
''', ['[0, 1, 2]', '[3, 3, 3]', '[0, 0, 0]'],
  'Each lambda looks up i when it is called, not when it was made. By then the loop has finished and i is 2.',
  hint='When is the name i looked up: when the lambda is made, or when it is called?')
C('h-rec-after', 5, 'hard', '''
def f(n):
    if n > 0:
        f(n - 1)
    print(n, end=" ")
f(3)
''', ['3 2 1 0', '3 2 1', '1 2 3'],
  'The print comes after the recursive call, so the deepest call (n = 0) prints first: 0 1 2 3.',
  hint='Which call finishes first, f(3) or f(0)?')
C('h-rec-before', 5, 'hard', '''
def f(n):
    if n > 0:
        print(n, end=" ")
        f(n - 1)
f(3)
''', ['1 2 3', '3 2 1 0', '0 1 2 3'],
  'Here the print comes before the recursive call, so the numbers appear on the way down: 3 2 1. When n is 0 nothing prints.',
  hint='Does 0 get printed? Look at the if.')
C('h-scope', 5, 'hard', '''
x = "global"
def f():
    x = "local"
    def g():
        return x
    return g()
print(f(), x)
''', ['global global', 'local local', 'global local'],
  'g looks for x in the enclosing function first and finds "local". The module-level x is never changed.',
  hint='Python searches local, then enclosing, then global.')
C('h-param-int', 5, 'hard', '''
def add(n):
    n += 1
    return n
n = 5
add(n)
print(n, add(n))
''', ['6 6', '5 5', '6 7'],
  'Integers cannot be changed in place. Inside add, n is a separate local name, so the global n stays 5. add(n) returns 6.',
  hint='Is an int mutable? Does the outer n change?')
C('h-param-list', 5, 'hard', '''
def grow(L):
    L.append(len(L))
x = [1]
grow(x)
grow(x)
print(x)
''', ['[1]', '[1, 0, 1]', '[1, 1, 1]'],
  'A list passed to a function is the same object, so append changes it. First len is 1, then 2: [1, 1, 2].',
  hint='The function receives the list itself, not a copy.')
C('h-param-rebind', 5, 'hard', '''
def reset(L):
    L = []
    L.append(9)
a = [1]
reset(a)
print(a)
''', ['[9]', '[]', '[1, 9]'],
  'L = [] makes the local name L point at a new list. The append changes that new list only, so a is still [1].',
  hint='Assigning to the parameter name does not touch the caller\'s list.')
C('h-slice-assign', 5, 'hard', '''
L = [1, 2, 3, 4, 5]
L[1:3] = [9]
print(L)
''', ['[1, 9, 3, 4, 5]', '[1, 9, 9, 4, 5]', '[9, 4, 5]'],
  'Assigning to a slice replaces those items with the new ones. Indexes 1 and 2 (2 and 3) become a single 9.',
  hint='Two items go out, one comes in.')
C('h-slice-neg', 5, 'hard', '''
L = list(range(10))
print(L[-3:], L[:-7], L[8:2:-3])
''', ['[7, 8, 9] [0, 1, 2] [8, 5, 2]', '[7, 8] [0, 1, 2] [8, 5]', '[7, 8, 9] [0, 1, 2, 3] [8, 5]'],
  'L[-3:] is the last three. L[:-7] stops before the 7th from the end, giving 0, 1, 2. L[8:2:-3] goes 8, 5 and stops before 2.',
  hint='A negative step walks backwards, and the stop index is still excluded.')
C('h-nested-copy', 5, 'hard', '''
a = [[1, 2], [3]]
b = a[:]
b[0].append(9)
b.append([4])
print(len(a), a[0])
''', ['3 [1, 2]', '2 [1, 2]', '3 [1, 2, 9]'],
  'a[:] copies only the outer list, so the inner lists are shared. b[0].append(9) shows up in a[0], but b.append([4]) changes b alone.',
  hint='Which parts of the list does a slice copy?')
C('h-grid', 5, 'hard', '''
g = [[0] * 2] * 2
g[0][0] = 1
print(g)
''', ['[[1, 0], [0, 0]]', '[[1, 1], [0, 0]]', '[[0, 0], [1, 0]]'],
  'The outer * 2 repeats a reference to the same inner list, so both rows are one list. Changing it shows up in both.',
  hint='Are the two rows two lists, or one list shown twice?')
C('h-sortkey', 5, 'hard', '''
words = ["pear", "fig", "banana", "kiwi"]
words.sort(key=lambda w: len(w))
print(words)
''', ["['fig', 'kiwi', 'pear', 'banana']", "['banana', 'pear', 'kiwi', 'fig']", "['pear', 'fig', 'banana', 'kiwi']"],
  'The lambda gives each word\'s length as the sort key. fig (3) comes first, then pear and kiwi (4, in their original order, since sort is stable), then banana (6).',
  hint='Sort by length, and equal lengths keep their original order.')
C('h-lambda-call', 5, 'hard', 'print((lambda a, b: a if a > b else b)(4, 9))', ['4', '13', '(4, 9)'],
  'The lambda returns the larger of its two arguments, and the brackets after it call it straight away: 9.',
  hint='Read it as a function that picks the bigger value.')
C('h-palin', 5, 'hard', '''
def pal(s):
    if len(s) < 2:
        return True
    return s[0] == s[-1] and pal(s[1:-1])
print(pal("level"), pal("lever"))
''', ['True True', 'False False', 'False True'],
  'It compares the first and last letters, then recurses on the middle. "level" matches all the way in. "lever" fails at l against r.',
  hint='Peel off the first and last characters each time.')
C('h-gcd', 5, 'hard', '''
def g(a, b):
    return a if b == 0 else g(b, a % b)
print(g(48, 18))
''', ['12', '3', '18'],
  'g(48, 18) → g(18, 12) → g(12, 6) → g(6, 0) → 6. This is Euclid\'s algorithm for the greatest common divisor.',
  hint='Each step swaps in the remainder.')
C('h-first-even', 5, 'hard', '''
def first_even(L):
    for x in L:
        if x % 2 == 0:
            return x
    return -1
print(first_even([3, 5, 8, 10]), first_even([1, 3]))
''', ['10 -1', '8 None', '3 -1'],
  'return leaves the function at the first even number, 8. For [1, 3] the loop ends without a match and -1 is returned.',
  hint='return stops the function immediately.')
C('h-eval-rep', 2, 'hard', 'print(eval("2+3" * 2))', ['10', '25', '56'],
  '"2+3" * 2 is the string "2+32+3". eval works that out as 2 + 32 + 3 = 37.',
  hint='Repeat the string first, then evaluate the longer text.')
C('h-nested-sum', 4, 'hard', '''
total = 0
for i in range(1, 4):
    for j in range(i):
        total += j
print(total)
''', ['6', '3', '5'],
  'i = 1 adds 0. i = 2 adds 0 + 1. i = 3 adds 0 + 1 + 2. In all 0 + 1 + 3 = 4.',
  hint='range(i) gives 0 up to i - 1.')
C('h-assert', 4, 'hard', '''
try:
    assert 2 + 2 == 5, "math"
except AssertionError as e:
    print("caught", e)
''', ['caught', 'math', 'Nothing is printed'],
  'The assertion is false, so it raises AssertionError carrying the message "math". The except block prints both.',
  hint='The text after the comma becomes the error message.')
C('h-prec-bool', 3, 'hard', 'print(not 3 > 2 or 4 < 1 and 5)', ['True', '5', '0'],
  'not 3 > 2 is False. 4 < 1 is False, so (False and 5) is False. False or False gives False.',
  hint='Comparisons first, then not, then and, then or.')
C('h-bit-prec', 3, 'hard', 'print(6 & 3 | 8 ^ 2)', ['11', '2', '14'],
  'The order is & then ^ then |. 6 & 3 = 2, 8 ^ 2 = 10, and 2 | 10 = 10.',
  hint='Bitwise AND binds tightest, then XOR, then OR.')
C('h-strops', 2, 'hard', '''
s = "ab"
s *= 2
s += "c"
print(s, len(s))
''', ['abc 3', 'ababc 4', 'ab2c 4'],
  's *= 2 gives "abab". s += "c" gives "ababc", which has five characters.',
  hint='*= on a string repeats it.')

# ───────── Tie-breakers (only if the groups are level after Round 3) ─────────
TB = dict(prompt='Tie-breaker: what does this print?', tags=['tiebreak'])
C('b-len-nested', 5, 'hard', 'print(len([1, [2, 3], []]))', ['4', '6', '2'],
  'The list has three items: 1, a list of two numbers, and an empty list. len counts the items, not what is inside them.',
  hint='Count the top-level items only.', **TB)
C('b-slice-out', 5, 'hard', 'print([1, 2, 3][5:])', ['IndexError', '[3]', 'None'],
  'A slice never raises an IndexError. Starting past the end simply gives an empty list.',
  hint='Slices are forgiving about their limits.', **TB)
C('b-lambda-twice', 5, 'hard', '''
f = lambda n: n * 2
print(f(f(3)))
''', ['6', '9', '36'], 'f(3) = 6, then f(6) = 12.', hint='Work from the inside out.', **TB)
C('b-pass-none', 5, 'hard', '''
def f():
    pass
print(f())
''', ['pass', '0', 'Error'], 'f does nothing and has no return, so the call gives None.',
  hint='What does a function return when it has no return?', **TB)
C('b-builtins-mix', 5, 'hard', 'print(sum([1, 2, 3]) * max([4, 5]) - min(7, 3))', ['25', '30', '57'],
  'sum is 6, max is 5, and min is 3. So 6 × 5 − 3 = 27.', hint='Work out each built-in first.', **TB)
C('b-pow2', 5, 'hard', '''
def f(n):
    return 1 if n == 0 else 2 * f(n - 1)
print(f(6))
''', ['12', '32', '128'], 'This computes 2 to the power n: f(6) = 2 ** 6 = 64.',
  hint='Each step doubles the result of the step below.', **TB)
