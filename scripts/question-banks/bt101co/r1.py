from lib import *

# ───────── Round 1 · Turn by turn (concept + short traces, medium) ─────────
# Unit 1
Q('t-monty', 1, 'easy', 'Python is named after:', 'The comedy group Monty Python',
  ['A large snake', 'A Greek mythological figure', "Its creator's pet"],
  "Guido van Rossum named it after the TV show Monty Python's Flying Circus. The snake logo came later.")
Q('t-1991', 1, 'medium', 'Python was first released to the public in:', '1991',
  ['1972', '1985', '2000'],
  'Guido van Rossum started it in the late 1980s at CWI in the Netherlands, and version 0.9.0 came out in February 1991.')
Q('t-zen', 1, 'medium', 'Typing import this in the Python shell prints:', 'The Zen of Python, its guiding principles',
  ['A list of every installed module', 'The licence terms of Python', 'The version history of Python'],
  'It prints the Zen of Python, written by Tim Peters: "Beautiful is better than ugly", "Readability counts" and so on.')
Q('t-dir', 1, 'medium', 'Which call lists the names (attributes and methods) available inside a type or module?', 'dir()',
  ['help()', 'type()', 'len()'],
  'dir(str) lists the methods of str. help(str) would instead print their documentation.')
Q('t-bytecode', 1, 'medium', 'How does the standard Python interpreter (CPython) run your .py file?',
  'Compiled to bytecode, then run by a virtual machine',
  ['Translated straight to machine code, like C', 'Read and run one character at a time', 'Linked into an .exe before every run'],
  'CPython compiles source to bytecode (the .pyc files in __pycache__) and a virtual machine executes it. You never run a separate compile or link step.')
Q('t-print-fn', 1, 'easy', 'In Python 3, print is:', 'A built-in function',
  ['A reserved keyword', 'An operator', 'A statement with no brackets'],
  'print("hi") is a function call. Python 2 had a print statement, which is one of the changes in Python 3.')
Q('t-vs-c', 1, 'medium', 'Compared with C, which is true of Python?', 'Blocks are marked by indentation, not braces',
  ['Every statement ends with a semicolon', 'Every variable needs a declared type', 'A program must be compiled to an .exe first'],
  'Indentation is part of Python\'s syntax, so no braces are needed. Variables take their type from the value they hold.')
Q('t-idle', 1, 'medium', 'IDLE, the editor that comes with Python, is named after:', 'Eric Idle of Monty Python',
  ['The English word for waiting around', 'A Dutch software company', "The Python logo's designer"],
  'A tribute to Eric Idle of Monty Python, in keeping with the name of the language.')

# Unit 2
Q('t-ident', 2, 'medium', 'Which of these is NOT a valid Python identifier?', '2nd_place',
  ['_count', 'Total1', 'roll_no'],
  'An identifier cannot start with a digit. It may start with a letter or an underscore and then contain letters, digits and underscores.')
Q('t-keyword', 2, 'medium', 'Which of these is a Python keyword?', 'pass',
  ['print', 'input', 'len'],
  'print, input and len are built-in functions that you could even reassign. pass is a reserved keyword.')
C('t-dyn', 2, 'medium', '''
x = 10
x = "ten"
print(type(x))
''', ["<class 'int'>", "<class 'float'>", 'TypeError'],
  'Python is dynamically typed: a name has no fixed type, it just refers to whatever value it was last given.')
X('t-bool-false', 2, 'medium', 'bool("False")', ['False', 'ValueError', 'None'],
  'Any non-empty string is truthy, whatever it says. Only "" (the empty string) gives False.')
E('t-int-str', 2, 'medium', "int('3.5')", 'ValueError', ['3', '4', '3.5'],
  "int() will not parse a string that has a decimal point. int(float('3.5')) works, and so does int(3.5) directly.",
  prompt='What happens when this runs?')
C('t-sep-end', 2, 'medium', 'print(1, 2, 3, sep="-", end="!")', ['1 2 3!', '1-2-3', '1-2-3\\n!'],
  'sep goes between the values and end goes after the last one. end replaces the usual newline.')
Q('t-eval-risk', 2, 'medium', 'Why is eval(input()) risky in a real program?',
  'It runs whatever expression the user types',
  ['It always returns a string', 'It cannot read numbers', 'It is much slower than int()'],
  'eval runs text as Python code, so a malicious user could run anything. Prefer int() or float() for numbers.')
Q('t-bigint', 2, 'medium', 'Why can Python print 2 ** 1000 exactly, with every digit?',
  'Python integers have arbitrary precision',
  ['Python quietly converts it to a float', 'Python stores it as a string', 'Python rounds it to 32 bits'],
  'An int grows as large as memory allows, so there is no overflow as in C. A float would lose the lower digits.')
C('t-fstring', 2, 'medium', 'print(f"{7 / 3:.2f}")', ['2', '2.3', '2.333333'],
  '.2f means two digits after the decimal point, so 2.3333… prints as 2.33.')

# Unit 3
C('t-divmod', 3, 'medium', 'print(17 // 5, 17 % 5)', ['3.4 2', '3 3', '4 2'],
  '17 = 3 × 5 + 2, so // gives the quotient 3 and % gives the remainder 2.')
X('t-neg-floor', 3, 'medium', '-7 // 2', ['-3', '-3.5', '3'],
  '// floors towards minus infinity. -3.5 floors to -4, not -3.')
X('t-prec', 3, 'medium', '10 + 2 * 3 ** 2', ['108', '72', '34'],
  '** goes first (3² = 9), then × (2 × 9 = 18), then + (10 + 18).')
X('t-invert', 3, 'medium', '~5', ['-5', '6', '5'],
  '~n equals -(n + 1) in two\'s complement, so ~5 is -6.')
Q('t-odd', 3, 'medium', 'n & 1 gives 1 exactly when n is:', 'Odd',
  ['Even', 'Positive', 'A power of two'],
  'The lowest bit of a number is 1 for odd numbers and 0 for even numbers, so n & 1 reads that bit.')
C('t-shortcircuit', 3, 'medium', 'print(0 or "default")', ['0', 'True', 'False'],
  'or returns its first truthy operand. 0 is falsy, so the answer is the string "default".')
C('t-not', 3, 'medium', 'print(not 0, not "", not "a")', ['False False True', 'True False False', 'True True True'],
  'not turns any value into a Boolean opposite: 0 and "" are falsy so not gives True, while "a" is truthy so not gives False.')
C('t-compound', 3, 'medium', '''
x = 7
x *= 2
x -= 4
print(x)
''', ['3', '14', '24'],
  'x starts at 7, becomes 14 after *=, then 10 after -=.')

# Unit 4
C('t-range-list', 4, 'medium', 'print(list(range(2, 10, 3)))', ['[2, 5, 8, 11]', '[3, 6, 9]', '[2, 3, 4, 5, 6, 7, 8, 9]'],
  'range counts from 2 in steps of 3 and stops before 10. 11 is never reached.')
C('t-continue', 4, 'medium', '''
for i in range(6):
    if i % 2:
        continue
    print(i, end=" ")
''', ['1 3 5', '0 1 2 3 4 5', '0 2 4 6'],
  'continue skips the rest of the loop body whenever i is odd, so only the even numbers 0, 2 and 4 are printed.')
Q('t-noreturn', 4, 'medium', 'A function with no return statement returns:', 'None',
  ['0', 'An empty string', 'Nothing, so using its value is an error'],
  'Every Python function returns something. With no return, that something is the special value None.')
E('t-assert', 4, 'medium', "assert 5 < 3, 'bad'", 'AssertionError', ['ValueError', 'SyntaxError', 'Nothing, the message is ignored'],
  'When the condition is false, assert raises AssertionError and attaches the message after the comma.')
Q('t-break-continue', 4, 'medium', 'What is the difference between break and continue?',
  'break leaves the loop; continue skips to the next pass',
  ['break ends the program; continue pauses it', 'They do the same thing in a for loop', 'continue leaves the loop; break skips a pass'],
  'break ends the loop completely. continue only skips the rest of the current pass and carries on with the next one.')
C('t-first-true', 4, 'medium', '''
marks = 85
if marks >= 40:
    print("C")
elif marks >= 80:
    print("A")
else:
    print("F")
''', ['A', 'A then C', 'F'],
  'An if-elif chain runs only the first branch whose condition is true. 85 ≥ 40 is true, so the elif is never tested.')
C('t-while-sum', 4, 'medium', '''
n = 5
total = 0
while n > 0:
    total += n
    n -= 2
print(total)
''', ['15', '8', '5'],
  'n takes the values 5, 3, 1 and then -1 stops the loop, so total = 5 + 3 + 1 = 9.')
X('t-range-len', 4, 'medium', 'len(range(1, 10, 2))', ['4', '9', '10'],
  'range(1, 10, 2) produces 1, 3, 5, 7, 9. That is five numbers.', prompt='How many numbers does it produce?')
C('t-return-tuple', 4, 'medium', '''
def lo_hi(a, b):
    return min(a, b), max(a, b)

print(lo_hi(7, 3))
''', ['(7, 3)', '3', '[3, 7]'],
  'Returning two values with a comma packs them into one tuple, here (3, 7).')
