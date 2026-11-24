from lib import *

# ───────── Round 2 · Rapid fire (short, easy, 15 seconds) ─────────
# Unit 1
Q('r-guido', 1, 'easy', 'Who created Python?', 'Guido van Rossum', ['James Gosling', 'Dennis Ritchie', 'Bjarne Stroustrup'],
  'Guido van Rossum, who began the language in the late 1980s. Gosling made Java, Ritchie made C and Stroustrup made C++.')
Q('r-interpreted', 1, 'easy', 'Python is best described as:', 'A high-level, interpreted language',
  ['A low-level assembly language', 'A markup language', 'A database language'],
  'High-level means close to human language, and interpreted means it runs through an interpreter rather than being compiled by you first.')
Q('r-ext', 1, 'easy', 'A Python source file normally ends with:', '.py', ['.pt', '.python', '.pyc'],
  '.py is the source file. A .pyc file is the compiled bytecode that Python creates automatically.')
Q('r-prompt', 1, 'easy', 'The prompt of the interactive Python shell is:', '>>>', ['$', '>', '#'],
  'You type a statement after >>> and Python runs it straight away.')
TF('r-case', 1, 'easy', 'Python is case sensitive: total and Total are two different names.', True,
   'Yes. Upper and lower case letters make different identifiers, so Total is a separate variable from total.')
Q('r-version', 1, 'easy', 'Which command shows the installed Python version?', 'python --version',
  ['python -show', 'python what', 'python --list'],
  'On some systems the command is python3 --version.')
Q('r-help', 1, 'easy', 'Which call shows the documentation of the print function in the shell?', 'help(print)',
  ['doc(print)', 'show(print)', 'print.help'],
  'help() opens the built-in documentation of any function, module or type.')
TF('r-compile', 1, 'easy', 'You must compile a .py file to an executable before you can run it.', False,
   'No, you run it directly with python file.py. Python compiles to bytecode behind the scenes.')
Q('r-pep8', 1, 'easy', 'PEP 8 is:', 'The Python style guide', ['A Python version', 'A built-in module', 'An online compiler'],
  'PEP stands for Python Enhancement Proposal. PEP 8 describes how to lay out and name things in readable code.')
Q('r-docstring', 1, 'easy', 'A docstring is written between:', 'Triple quotes', ['Hash signs', 'Square brackets', 'Slashes and stars'],
  'A triple-quoted string at the top of a file, class or function documents it. A hash starts an ordinary comment.')
Q('r-comment', 1, 'easy', 'A single-line comment in Python begins with:', '#', ['//', '--', '/*'],
  'Everything after # on a line is ignored by Python.')
Q('r-docs', 1, 'easy', 'The official Python documentation lives at:', 'docs.python.org', ['pythonhelp.com', 'learnpython.net', 'python.guide'],
  'docs.python.org has the language reference, the library reference and the tutorial.')

# Unit 2
Q('r-type-str', 2, 'easy', "type('7') is:", 'str', ['int', 'float', 'bool'],
  'Quote marks make it text, whatever is inside them.')
Q('r-float', 2, 'easy', 'Which of these is a float?', '3.0', ['3', '"3.0"', 'True'],
  'A number with a decimal point is a float. "3.0" in quotes is a string.')
X('r-len', 2, 'easy', 'len("Python")', ['5', '7', '"Python"'], 'len counts characters. P-y-t-h-o-n is six.')
X('r-repeat', 2, 'easy', '"Hi" * 3', ["'Hi3'", "'HiHiHi' + 'Hi'", '6'],
  'Multiplying a string repeats it.', prompt='What does this give?')
X('r-concat', 2, 'easy', '"5" + "3"', ['8', "'8'", 'TypeError'],
  '+ joins two strings end to end. It does not add them.')
TF('r-bool0', 2, 'easy', 'bool(0) is False.', True, 'Zero, an empty string and an empty list are all falsy. Everything else is truthy.')
X('r-int-add', 2, 'easy', 'int("42") + 8', ["'428'", '42', 'TypeError'], 'int("42") becomes the number 42 first, so + adds.')
X('r-str-pct', 2, 'easy', 'str(100) + "%"', ["'100'", '100', '"%100"'], 'str() converts 100 to text, then + joins the two strings.')
Q('r-name', 2, 'easy', 'Which is a valid variable name?', 'total_marks', ['2marks', 'total marks', 'class'],
  'No digit at the start, no spaces and no keyword.')
TF('r-declare', 2, 'easy', 'In Python you must declare a variable\'s type before using it.', False,
   'No. A variable is created when you assign to it, and its type comes from the value.')
Q('r-dynamic', 2, 'easy', 'x = 5 followed by x = "five" is allowed because Python is:', 'Dynamically typed',
  ['Statically typed', 'Case insensitive', 'Compiled'], 'A name can be rebound to a value of any type at any time.')
X('r-chr', 2, 'easy', 'chr(65)', ['65', "'a'", "'0'"], 'chr converts a character code to a character. 65 is A in ASCII.')
X('r-ord', 2, 'easy', "ord('a')", ['65', '1', '96'], 'ord gives the code of a character. Lowercase a is 97 (capital A is 65).')
C('r-sep', 2, 'easy', 'print("A", "B", sep="")', ['A B', 'A,B', 'AB '], 'sep="" removes the space that print normally puts between values.')
C('r-end', 2, 'easy', '''
print("Hello", end=" ")
print("World")
''', ['Hello then World', 'HelloWorld', 'World then Hello'], 'end=" " finishes the first print with a space instead of a newline, so both land on one line.')
X('r-round', 2, 'easy', 'round(3.7)', ['3', '3.7', '3.0'], 'round gives the nearest whole number, as an int.')
X('r-abs', 2, 'easy', 'abs(-7)', ['-7', '0', '7.0'], 'abs removes the sign.')
X('r-max', 2, 'easy', 'max(3, 9, 4)', ['3', '4', '16'], 'max returns the largest value.')
X('r-bool-type', 2, 'easy', 'type(True)', ["<class 'int'>", "<class 'str'>", "<class 'NoneType'>"], 'True and False are of type bool.')
Q('r-input', 2, 'easy', 'input() always returns a value of type:', 'str', ['int', 'float', 'It depends on what is typed'],
  'Even if the user types 25, you get the string "25". Convert it with int() or float().')

# Unit 3
X('r-floordiv', 3, 'easy', '7 // 2', ['3.5', '4', '2'], '// is floor division: the whole-number part of the quotient.')
X('r-mod', 3, 'easy', '7 % 2', ['3', '0', '3.5'], '% gives the remainder after division. 7 = 3 × 2 + 1.')
X('r-pow', 3, 'easy', '2 ** 5', ['10', '25', '7'], '** raises to a power: 2 × 2 × 2 × 2 × 2.')
X('r-true-div', 3, 'easy', '10 / 4', ['2', '2.0', '3'], 'In Python 3, / always gives a float.')
TF('r-eq-float', 3, 'easy', '5 == 5.0 is True.', True, 'Equality compares values, and 5 and 5.0 are the same number.')
X('r-not', 3, 'easy', 'not True', ['True', '0', "'False'"], 'not flips a Boolean.')
X('r-and', 3, 'easy', 'True and False', ['True', '1', '0'], 'and is true only when both sides are true.')
X('r-or', 3, 'easy', '4 > 3 or 1 > 2', ['False', '4', '3'], 'or is true when at least one side is true, and 4 > 3 is true.')
X('r-neq', 3, 'easy', '3 != 3', ['True', '0', 'None'], '!= means not equal, and 3 is equal to 3, so the result is False.')
C('r-aug', 3, 'easy', '''
x = 5
x += 3
print(x)
''', ['53', '3', '5'], 'x += 3 is shorthand for x = x + 3.')
X('r-and-bit', 3, 'easy', '5 & 3', ['8', '15', '2'], '5 is 101 and 3 is 011 in binary. Bitwise AND keeps only the bits set in both: 001.')
X('r-or-bit', 3, 'easy', '5 | 3', ['1', '6', '8'], 'Bitwise OR keeps a bit if it is set in either one: 101 | 011 = 111.')
X('r-shift', 3, 'easy', '1 << 3', ['3', '4', '13'], 'Each left shift doubles the number: 1 → 2 → 4 → 8.')
X('r-prec1', 3, 'easy', '10 - 2 * 3', ['24', '16', '-4'], 'Multiplication comes before subtraction: 10 − 6.')
X('r-prec2', 3, 'easy', '(10 - 2) * 3', ['4', '16', '30'], 'Brackets first: 8 × 3.')
Q('r-pow-op', 3, 'easy', 'Which operator raises a number to a power?', '**', ['^', '//', '%'],
  'In Python, ^ is bitwise XOR, not a power.')

# Unit 4
C('r-range-print', 4, 'easy', '''
for i in range(3):
    print(i, end=" ")
''', ['1 2 3', '0 1 2 3', '3 2 1'], 'range(3) gives 0, 1, 2. It stops before 3.')
X('r-range-list', 4, 'easy', 'list(range(1, 6))', ['[1, 2, 3, 4, 5, 6]', '[0, 1, 2, 3, 4, 5]', '[1, 6]'], 'range(1, 6) starts at 1 and stops before 6.')
Q('r-break', 4, 'easy', 'Which keyword leaves a loop immediately?', 'break', ['stop', 'exit', 'continue'],
  'continue only skips to the next iteration.')
Q('r-continue', 4, 'easy', 'Which keyword skips to the next iteration of a loop?', 'continue', ['pass', 'break', 'next'],
  'pass does nothing at all, and break leaves the loop.')
Q('r-pass', 4, 'easy', 'Which statement does nothing and acts as a placeholder?', 'pass', ['continue', 'break', 'skip'],
  'Python needs at least one statement in a block, and pass fills that gap.')
Q('r-def', 4, 'easy', 'Which keyword defines a function?', 'def', ['func', 'function', 'define'], 'def name(parameters): starts a function definition.')
TF('r-indent', 4, 'easy', 'Indentation decides which statements belong to a block.', True, 'It is part of the syntax. There are no braces to mark blocks.')
TF('r-eq-assign', 4, 'easy', '"if x = 5:" is a correct way to test whether x equals 5.', False,
   '= assigns and is a syntax error in a condition. Use == to compare.')
Q('r-elif', 4, 'easy', 'Which keyword adds a second condition after if?', 'elif', ['elseif', 'else if', 'then'], 'elif is short for else if.')
Q('r-return', 4, 'easy', 'What does return do inside a function?', 'Sends a value back and ends the function',
  ['Prints a value on screen', 'Restarts the function', 'Ends the whole program'],
  'return hands a value back to the caller and leaves the function immediately.')
Q('r-assert-err', 4, 'easy', 'When an assert condition is false, Python raises:', 'AssertionError', ['ValueError', 'TypeError', 'NameError'],
  'It is used to check that something you believe is true really is.')
Q('r-while', 4, 'easy', 'A while loop keeps repeating:', 'As long as its condition is true', ['Exactly ten times', 'Once for every character', 'Until break is typed'],
  'The condition is checked before every pass.')
