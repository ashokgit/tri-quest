from lib import *

# ───────── Round 3 · Hard (trace the code, 2 minutes, lifelines) ─────────
C('h-compound-chain', 3, 'hard', '''
x = 10
x //= 3
x **= 2
x %= 5
print(x)
''', ['1', '0', '9'],
  'Step by step: 10 // 3 = 3, then 3 ** 2 = 9, then 9 % 5 = 4.',
  hint='Apply the three operators one line at a time, and keep the new value of x each time.')
C('h-floor-neg', 3, 'hard', 'print(-17 // 5, -17 % 5)', ['-3 -2', '-4 -3', '-3 2'],
  'Floor division rounds towards minus infinity: -17 // 5 is -4. Then -17 = (-4 × 5) + 3, so the remainder is 3.',
  hint='The pair must satisfy a == (a // b) * b + a % b, and // rounds down, not towards zero.')
C('h-pow-assoc', 3, 'hard', 'print(2 ** 3 ** 2, (2 ** 3) ** 2)', ['64 64', '512 512', '64 512'],
  '** is right-associative: 2 ** (3 ** 2) = 2 ** 9 = 512, while (2 ** 3) ** 2 = 8 ** 2 = 64.',
  hint='Only one operator in Python groups from the right. Which one?')
C('h-shortcircuit', 3, 'hard', 'print(0 or 7, 3 and 0, 3 or 5, 8 and 4)', ['7 3 3 8', '7 0 5 4', '0 0 3 4'],
  'or returns the first truthy operand and and returns the first falsy one (or the last operand if all are truthy): 7, 0, 3, 4.',
  hint='Neither or nor and gives True or False. Each one hands back one of its operands.')
C('h-chain', 3, 'hard', 'print(1 < 2 < 3, 3 > 2 > 2, True + True + 1)', ['True True 3', 'True False 2', 'False False 3'],
  '1 < 2 < 3 means 1 < 2 and 2 < 3, so True. 3 > 2 > 2 needs 2 > 2, so False. True counts as 1, so the sum is 3.',
  hint='A chain is a shorthand for several comparisons joined by and. True behaves like 1 in arithmetic.')
C('h-bitwise', 3, 'hard', '''
a, b = 12, 10
print(a & b, a | b, a ^ b, ~a)
''', ['8 14 6 -12', '8 14 4 -13', '2 14 6 -13'],
  '12 = 1100 and 10 = 1010. AND = 1000 (8), OR = 1110 (14), XOR = 0110 (6), and ~12 = -(12 + 1) = -13.',
  hint='Write both numbers in binary, line them up, and remember ~n is -(n + 1).')
C('h-shift-neg', 3, 'hard', '''
n = 5
print(n << 2, n >> 1, -n >> 1)
''', ['20 2 -2', '10 2 -3', '20 3 -3'],
  'n << 2 multiplies by 4 (20). n >> 1 floors 2.5 to 2. -5 >> 1 floors -2.5 to -3, because shifts round down.',
  hint='A right shift divides by 2 and rounds down, even for negative numbers.')
C('h-precedence', 3, 'hard', 'print(10 - 2 ** 3 // 3 % 4)', ['9', '10', '5'],
  '** first: 2 ** 3 = 8. Then // and % have equal rank and go left to right: 8 // 3 = 2, then 2 % 4 = 2. Finally 10 - 2 = 8.',
  hint='Order of work: **, then // and % from left to right, and subtraction last.')
C('h-float-eq', 3, 'hard', 'print(0.1 + 0.2 == 0.3, round(0.1 + 0.2, 1) == 0.3)', ['True True', 'True False', 'False False'],
  'Floats are stored in binary, so 0.1 + 0.2 is really 0.30000000000000004. Rounding to one place gives 0.3 again.',
  hint='Think about how a computer stores 0.1 in binary. Is the sum exactly 0.3?')
C('h-bankers', 2, 'hard', 'print(round(2.5), round(3.5), round(-2.5))', ['3 4 -3', '3 3 -2', '2 3 -2'],
  'Python rounds exact halves to the nearest even number: 2.5 → 2, 3.5 → 4, -2.5 → -2.',
  hint='When a number is exactly halfway, Python does not always round up.')
C('h-swap', 2, 'hard', '''
a, b, c = 1, 2, 3
a, b, c = c, a, b
print(a, b, c)
''', ['3 2 1', '2 3 1', '1 2 3'],
  'The right side is evaluated first as (3, 1, 2), then unpacked into a, b, c. So a = 3, b = 1, c = 2.',
  hint='Evaluate the whole right-hand tuple before assigning anything.')
C('h-convert', 2, 'hard', 'print(int(7.9) + int("2"), float("1.5") * 2, str(3) + "4")', ['10 3.0 7', '9 3 34', '9 3.0 7'],
  'int(7.9) truncates to 7, so 7 + 2 = 9. float("1.5") * 2 = 3.0, and str(3) + "4" joins two strings into "34".',
  hint='int() chops the decimal part, and + on two strings joins them.')
C('h-slice', 2, 'hard', '''
s = "Python"
print(s[1:4], s[-1], s * 2 == s + s)
''', ['Pyth n True', 'ytho n True', 'yth n False'],
  's[1:4] takes indices 1, 2 and 3: "yth". s[-1] is the last character, "n". s * 2 and s + s are both "PythonPython".',
  hint='A slice stops before its end index, and index -1 counts from the end.')
C('h-eval', 2, 'hard', '''
x = 4
print(eval("x * 2 + 1"), eval("'ab' * 2"))
''', ['9 ab2', '5 abab', '8 abab'],
  'eval runs its string as an expression using the current variables: 4 * 2 + 1 = 9, and \'ab\' * 2 = \'abab\'.',
  hint='eval treats the text as if you had typed it as code.')
C('h-is-eq', 2, 'hard', '''
a = [1, 2]
b = [1, 2]
c = a
print(a == b, a is b, a is c)
''', ['True True True', 'False False True', 'True False False'],
  '== compares contents (equal). "is" compares identity: b is a separate list, but c is another name for the same list as a.',
  hint='Only one list was created for a and c to share, and b is a fresh copy.')
C('h-continue-sum', 4, 'hard', '''
total = 0
for i in range(1, 8):
    if i % 3 == 0:
        continue
    total += i
print(total)
''', ['28', '22', '16'],
  'The numbers 3 and 6 are skipped. 1 + 2 + 4 + 5 + 7 = 19.',
  hint='List the numbers range(1, 8) gives, cross out the multiples of 3, then add the rest.')
C('h-while-break', 4, 'hard', '''
i = 0
while True:
    i += 3
    if i % 2 == 0 and i > 8:
        break
print(i)
''', ['6', '9', '8'],
  'i goes 3, 6, 9, 12. Six is even but not above 8, and 9 is not even. At 12 both conditions hold, so the loop breaks with i = 12.',
  hint='Both parts of the condition must be true at once. Write out the values of i.')
C('h-nested-count', 4, 'hard', '''
count = 0
for i in range(1, 4):
    for j in range(i):
        count += 1
print(count)
''', ['3', '9', '4'],
  'The inner loop runs i times: 1, then 2, then 3. That adds up to 6.',
  hint='How many times does the inner loop run for each value of i?')
C('h-none-return', 4, 'hard', '''
def f(x):
    if x > 0:
        return "pos"

print(f(1), f(-1))
''', ['pos neg', 'pos', 'pos Error'],
  'When x is not positive, no return runs, so the function returns None. print shows None as the word None.',
  hint='What does Python return from a function when no return statement is reached?')
C('h-print-return', 4, 'hard', '''
def add(a, b):
    print(a + b)

r = add(2, 3)
print(r)
''', ['5 then 5', 'None then 5', '5'],
  'add prints 5 itself but returns nothing, so r is None and the second print shows None.',
  hint='print shows a value, return hands it back. Which of these did add do?')
C('h-assert-caught', 4, 'hard', '''
try:
    assert 2 + 2 == 5, "math broke"
except AssertionError as e:
    print("caught:", e)
''', ['Nothing is printed', 'caught: AssertionError', 'caught: 4'],
  'The assertion fails and raises AssertionError("math broke"). The except block prints the message that was attached to it.',
  hint='The text after the comma in an assert is the exception\'s message.')
C('h-range-neg', 4, 'hard', 'print(list(range(10, 0, -3)))', ['[10, 7, 4, 1, -2]', '[7, 4, 1]', '[10, 7, 4]'],
  'It starts at 10 and subtracts 3 until it would pass 0: 10, 7, 4, 1.',
  hint='The stop value is never included, and the step is negative.')
C('h-loopvar', 4, 'hard', '''
for i in range(3):
    pass
print(i)
''', ['3', '0', 'NameError'],
  'The loop variable survives after the loop, holding the last value it was given: 2.',
  hint='Does the loop variable disappear when the loop ends?')
C('h-two-ifs', 4, 'hard', '''
x = 7
if x > 5:
    print("A")
if x > 3:
    print("B")
elif x > 1:
    print("C")
''', ['A then B then C', 'A', 'B'],
  'The first if is a separate statement and prints A. The second if-elif chain stops at its first true branch, x > 3, and prints B.',
  hint='How many separate if statements are there? An elif belongs only to the if just above it.')

# ───────── Tie-breakers (played only if the groups are level after Round 3) ─────────
C('b-floor-mod', 3, 'hard', 'print(7 // 2 * 2 + 7 % 2)', ['6', '8', '9'],
  '7 // 2 = 3, then 3 * 2 = 6, and 7 % 2 = 1. So 6 + 1 = 7.', prompt='Tie-breaker: what does this print?', tags=['tiebreak'],
  hint='Work from left to right at each level of precedence.')
C('b-truthy', 3, 'hard', 'print(bool([]), bool([0]), bool(""))', ['False False False', 'True True False', 'False True True'],
  'An empty list is falsy, but a list holding a 0 is not empty, so it is truthy. The empty string is falsy.',
  prompt='Tie-breaker: what does this print?', tags=['tiebreak'], hint='Truthiness depends on being empty, not on what is inside.')
C('b-str-cmp', 3, 'hard', 'print("ab" < "b", "Z" < "a")', ['False False', 'True False', 'False True'],
  'Strings compare character by character using their codes. "a" < "b" decides the first, and "Z" (90) is below "a" (97).',
  prompt='Tie-breaker: what does this print?', tags=['tiebreak'], hint='Compare first characters by code. Capital letters come before small ones.')
C('b-digits', 2, 'hard', 'print(len(str(2 ** 10)))', ['3', '10', '2'],
  '2 ** 10 is 1024. As a string it has four characters.', prompt='Tie-breaker: what does this print?', tags=['tiebreak'],
  hint='Work out the number first, then count its digits.')
C('b-types', 2, 'hard', 'print(type(5 // 2), type(5 / 2))', ["<class 'int'> <class 'int'>", "<class 'float'> <class 'float'>", "<class 'float'> <class 'int'>"],
  '// of two ints gives an int (2). / always gives a float (2.5).', prompt='Tie-breaker: what does this print?', tags=['tiebreak'],
  hint='One division floors, the other is always a float.')
C('b-bin', 3, 'hard', 'print(bin(10), int("101", 2))', ['1010 5', '0b1010 101', '0b101 10'],
  'bin(10) gives the string "0b1010". int("101", 2) reads 101 as a binary number, which is 5.',
  prompt='Tie-breaker: what does this print?', tags=['tiebreak'], hint='Remember the prefix bin() adds. The second argument of int() is the base.')
