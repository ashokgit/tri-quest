from lib import *

# ───────── Round 1 · Turn by turn (medium; Unit 5 carries the weight) ─────────
# Unit 1
Q('u-py3', 1, 'medium', 'Which statement about Python 3 is true?', 'It is not fully backward compatible with Python 2',
  ['It runs every Python 2 program unchanged', 'It was released before Python 2', 'It replaced the interpreter with a compiler'],
  'Python 3.0 (2008) fixed design flaws, such as making print a function and / true division, and broke compatibility with Python 2 on purpose.')
Q('u-docstring', 1, 'medium', 'A docstring is written:', 'As a string literal at the start of a function, class or module',
  ['After a # sign at the end of a line', 'Inside an assert statement', 'Between two backticks'],
  'Triple-quoted text on the first line of a function becomes its __doc__, which help() prints. A # comment is thrown away.')
# Unit 2
C('u-fmt', 2, 'medium', '''
x = 3.14159
print(f"{x:.2f}")
''', ['3.1', '3.14159', '0.31'],
  'In an f-string, :.2f formats a float with two digits after the point, rounding as needed: 3.14.',
  hint='The number after the dot is how many decimals to keep.')
C('u-sepend', 2, 'medium', 'print("a", "b", "c", sep="-", end="!")', ['a b c!', 'a-b-c', 'a-b-c-!'],
  'sep goes between the items and end goes after the last one, replacing the usual newline.',
  hint='sep is placed between items, end is placed once at the very end.')
Q('u-input-add', 2, 'medium', 'The user types 12 when asked. After x = input(), what is x + x?', "'1212', because x is a string",
  ['24, because 12 + 12 is 24', 'A TypeError', '12'],
  'input() always returns a string, so + joins the two strings. Use int(input()) to do arithmetic.')
C('u-eval', 2, 'medium', 'print(eval("3 * 4 + 2"))', ['3 * 4 + 2', '20', '12'],
  'eval() reads a string as a Python expression and returns its value: 3 * 4 + 2 = 14.',
  hint='eval does not print the text, it works it out.')
# Unit 3
X('u-prec', 3, 'medium', '2 + 3 * 4 ** 2', ['80', '400', '98'],
  '** first: 4 ** 2 = 16, then 3 * 16 = 48, then 2 + 48 = 50.', hint='Power first, then multiply, then add.')
X('u-negmod', 3, 'medium', '-7 % 3', ['-1', '1', '-2'],
  'The result of % takes the sign of the divisor. -7 = (-3 × 3) + 2, so the remainder is 2.',
  hint='-7 // 3 is -3 because it rounds down. What is left over?')
C('u-compound', 3, 'medium', '''
a = 5
a *= 2 + 3
print(a)
''', ['13', '10', '15'],
  'The whole right side is worked out first: 2 + 3 = 5. Then a = a * 5 = 25.',
  hint='a *= expr means a = a * (expr).')
X('u-bool', 3, 'medium', 'not 0 or 1 and 0', ['False', '1', '0'],
  'not binds tightest: not 0 is True, and True or anything is True. Python never even needs to look at the and.',
  hint='Order: not, then and, then or.')
# Unit 4
C('u-while', 4, 'medium', '''
i, s = 1, 0
while i <= 5:
    s += i
    i += 2
print(s)
''', ['15', '6', '8'],
  'i takes the values 1, 3 and 5, so s = 1 + 3 + 5 = 9.', hint='i goes up in steps of 2.')
C('u-range3', 4, 'medium', '''
for i in range(2, 10, 3):
    print(i, end=" ")
''', ['2 5 8 11', '3 6 9', '2 4 6 8'],
  'range(2, 10, 3) starts at 2 and adds 3 while below 10: 2, 5, 8.', hint='The stop value is never reached.')
C('u-nested-break', 4, 'medium', '''
for i in range(3):
    for j in range(3):
        if j == i:
            break
        print(i, j)
''', ['0 0 then 1 1 then 2 2', '1 0 then 2 0', '0 1 then 0 2 then 1 2'],
  'break leaves only the inner loop. i = 0: breaks at once. i = 1: prints 1 0, then breaks. i = 2: prints 2 0 and 2 1.',
  hint='break only stops the loop it sits in.')
Q('u-pass', 4, 'medium', 'What does the pass statement do?', 'Nothing; it is a placeholder where a statement is needed',
  ['Skips to the next loop iteration', 'Exits the loop', 'Ends the program'],
  'pass lets you write an empty block, for example def todo(): pass, without a syntax error.')
C('u-elif', 4, 'medium', '''
marks = 72
if marks >= 90:
    print("A")
elif marks >= 60:
    print("B")
elif marks >= 40:
    print("C")
else:
    print("F")
''', ['A', 'C', 'B then C'],
  'The chain stops at the first true test. 72 >= 90 is false, 72 >= 60 is true, so only B is printed.',
  hint='Only one branch of an if-elif-else chain ever runs.')
# Unit 5 · functions
C('u-default', 5, 'medium', '''
def greet(name, msg="Hello"):
    print(msg, name)
greet("Sita")
greet("Ram", "Hi")
''', ['Hello Sita then Hello Ram', 'Sita Hello then Ram Hi', 'Hello Sita then Ram Hi'],
  'msg falls back to "Hello" when no second argument is given. The second call overrides it with "Hi".',
  hint='A default is used only when the caller leaves that argument out.')
C('u-keyword', 5, 'medium', '''
def power(base, exp):
    return base ** exp
print(power(exp=2, base=5))
''', ['10', '32', '7'],
  'Keyword arguments are matched by name, not position: base = 5 and exp = 2, so 5 ** 2 = 25.',
  hint='Match the names, not the order.')
C('u-global-shadow', 5, 'medium', '''
x = 10
def f():
    x = 20
f()
print(x)
''', ['20', '30', 'Error'],
  'Assigning inside f creates a new local x. The global x is untouched, so it still prints 10.',
  hint='Does assigning in a function change a global without the global keyword?')
C('u-global-kw', 5, 'medium', '''
x = 1
def f():
    global x
    x += 5
f()
print(x)
''', ['1', '5', '51'],
  'The global keyword makes x inside f mean the global one, so f changes it from 1 to 6.',
  hint='What does the global keyword change about the name x?')
E('u-unbound', 5, 'medium', '''
x = 1
def f():
    x += 1
f()
''', 'UnboundLocalError', ['NameError', 'SyntaxError', 'TypeError'],
  'Because f assigns to x, Python treats x as local throughout f. Reading it for x += 1 before it has a value is an UnboundLocalError.',
  hint='An assignment anywhere in a function makes that name local to the whole function.')
C('u-fact', 5, 'medium', '''
def fact(n):
    return 1 if n <= 1 else n * fact(n - 1)
print(fact(5))
''', ['24', '720', '15'],
  'fact(5) = 5 × 4 × 3 × 2 × 1 = 120.', hint='Multiply every whole number from 5 down to 1.')
C('u-fib', 5, 'medium', '''
def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)
print(fib(7))
''', ['21', '8', '34'],
  'The sequence runs 0, 1, 1, 2, 3, 5, 8, 13, so fib(7) is 13.', hint='fib(0) = 0, fib(1) = 1, and each next one is the sum of the two before.')
C('u-sumrec', 5, 'medium', '''
def s(n):
    if n == 0:
        return 0
    return n + s(n - 1)
print(s(4))
''', ['24', '4', '6'],
  's(4) = 4 + 3 + 2 + 1 + 0 = 10.', hint='Add the numbers 4, 3, 2, 1 and the base case.')
C('u-lambda', 5, 'medium', '''
sq = lambda x: x * x
print(sq(7))
''', ['14', '77', '7'],
  'A lambda is a small unnamed function. sq(7) returns 7 * 7 = 49.', hint='Multiplication, not addition.')
C('u-lambda2', 5, 'medium', '''
add = lambda a, b=2: a + b
print(add(3), add(3, 4))
''', ['5 5', '3 4', '5 12'],
  'Lambdas take defaults too. add(3) uses b = 2 and gives 5. add(3, 4) gives 7.', hint='Does the second call use the default?')
# Unit 5 · lists
C('u-index', 5, 'medium', '''
L = [10, 20, 30, 40, 50]
print(L[1], L[-2], L[len(L) - 1])
''', ['10 40 50', '20 30 50', '20 40 40'],
  'L[1] is 20. L[-2] is the second from the end, 40. len(L) - 1 = 4, and L[4] is 50.',
  hint='Negative indexes count from the end: -1 is the last item.')
C('u-slice', 5, 'medium', '''
L = [0, 1, 2, 3, 4, 5, 6, 7]
print(L[2:6], L[::3])
''', ['[2, 3, 4, 5, 6] [0, 3, 6]', '[2, 3, 4, 5] [0, 3]', '[3, 4, 5, 6] [0, 3, 6]'],
  'L[2:6] takes indexes 2 to 5. L[::3] takes every third item from the start: indexes 0, 3 and 6.',
  hint='The slice stops before its end index.')
C('u-append-extend', 5, 'medium', '''
a = [1, 2]
a.append([3, 4])
b = [1, 2]
b.extend([3, 4])
print(len(a), len(b))
''', ['4 4', '3 3', '4 3'],
  'append adds its argument as one item, so a is [1, 2, [3, 4]], length 3. extend adds each item, so b is [1, 2, 3, 4], length 4.',
  hint='One adds a single item, the other adds each item of the list.')
C('u-sort-ret', 5, 'medium', '''
L = [3, 1, 2]
r = L.sort()
print(r, L)
''', ['[1, 2, 3] [1, 2, 3]', 'None [3, 1, 2]', '[1, 2, 3] None'],
  'list.sort() sorts in place and returns None. So r is None, and L is now [1, 2, 3].',
  hint='What does an in-place method hand back?')
C('u-alias', 5, 'medium', '''
a = [1, 2, 3]
b = a
b.append(4)
c = a[:]
c.append(5)
print(a, c)
''', ['[1, 2, 3] [1, 2, 3, 5]', '[1, 2, 3, 4, 5] [1, 2, 3, 4, 5]', '[1, 2, 3] [1, 2, 3, 4, 5]'],
  'b = a makes a second name for the same list, so a also grows to [1, 2, 3, 4]. a[:] is a copy, so c grows on its own.',
  hint='Assignment does not copy a list. A full slice does.')
C('u-builtins', 5, 'medium', '''
n = [4, 9, 2, 7]
print(len(n), max(n), min(n), sum(n))
''', ['4 9 2 21', '4 7 2 22', '3 9 2 22'],
  'There are 4 items, the largest is 9, the smallest is 2, and 4 + 9 + 2 + 7 = 22.', hint='Add them up carefully.')
C('u-pop', 5, 'medium', '''
L = [5, 6, 7, 8]
x = L.pop()
y = L.pop(0)
print(x, y, L)
''', ['5 8 [6, 7]', '8 5 [5, 6, 7]', '8 6 [5, 7]'],
  'pop() removes and returns the last item, 8. pop(0) removes the first of what remains, 5. That leaves [6, 7].',
  hint='pop() with no argument takes the last item.')
C('u-return-multi', 5, 'medium', '''
def mm(a, b):
    return a + b, a * b
s, p = mm(3, 4)
print(s, p)
''', ['(7, 12) None', '7 7', '12 7'],
  'return a + b, a * b hands back the tuple (7, 12), which is unpacked into s and p.',
  hint='Two values after return make one tuple.')
C('u-args', 5, 'medium', '''
def total(*nums):
    return sum(nums)
print(total(1, 2, 3), total())
''', ['6 None', '3 0', '1 0'],
  '*nums collects any number of arguments into a tuple. With none given, sum of an empty tuple is 0.',
  hint='What is the sum of nothing?')
