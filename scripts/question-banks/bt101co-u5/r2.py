from lib import *

# ───────── Round 2 · Rapid fire (short, 15 seconds) ─────────
# Unit 1
Q('r-pycache', 1, 'easy', 'Where does Python keep the bytecode it compiles for you?', 'In the __pycache__ folder',
  ['In a bin folder', 'Inside the .py file itself', 'In the Windows registry'],
  'Compiled .pyc files are written to __pycache__ next to your source, so the next import starts faster.')
TF('r-gc', 1, 'easy', 'Python frees unused memory automatically, so you never call free() yourself.', True,
   'Python counts references and runs a garbage collector, so memory is handled for you.')
Q('r-styles', 1, 'easy', 'Python supports which programming styles?', 'Procedural, object-oriented and functional',
  ['Only object-oriented', 'Only procedural', 'Only functional'],
  'It is a multi-paradigm language, so you can mix functions, classes and functional tools such as lambda.')
# Unit 2
Q('r-input-type', 2, 'easy', 'input() always returns a value of type:', 'str', ['int', 'float', 'bool'],
  'Even when the user types digits, you get a string. Wrap it in int() or float() to calculate.')
X('r-int', 2, 'easy', 'int("42") + 1', ["'421'", 'Error', '42'], 'int("42") is the number 42, so adding 1 gives 43.')
X('r-type', 2, 'easy', 'type(3.0)', ["<class 'int'>", "<class 'str'>", "<class 'double'>"],
  'A number with a decimal point is a float, even when the decimal part is zero. Python has no type called double.', prompt='What does this give?')
Q('r-ident', 2, 'easy', 'Which is a valid variable name?', '_total2', ['2total', 'my-var', 'class'],
  'Names cannot start with a digit, cannot contain a hyphen and cannot be a keyword such as class.')
TF('r-quotes', 2, 'easy', 'In Python, "hello" and \'hello\' are the same string.', True,
   'Single and double quotes make identical strings. Pick whichever lets you avoid escaping.')
# Unit 3
X('r-floor', 3, 'easy', '17 // 5', ['3.4', '4', '2'], '// is floor division: 17 divided by 5 is 3.4, and rounded down it is 3.')
X('r-pow', 3, 'easy', '2 ** 5', ['10', '25', '7'], '** raises to a power: 2 × 2 × 2 × 2 × 2 = 32.')
X('r-mod', 3, 'easy', '20 % 6', ['3', '4', '0'], '20 = 3 × 6 + 2, so the remainder is 2.')
X('r-xor', 3, 'easy', '5 ^ 3', ['8', '2', '15'], '5 is 101 and 3 is 011. XOR gives 1 where the bits differ: 110, which is 6.')
X('r-cmp', 3, 'easy', '3 != 4 and 2 > 1', ['False', '1', '4'], '3 != 4 is True and 2 > 1 is True, so the whole expression is True.')
# Unit 4
Q('r-elif', 4, 'easy', 'Which keyword means "else if" in Python?', 'elif', ['else if', 'elseif', 'elsif'],
  'It is spelled elif, one word.')
Q('r-colon', 4, 'easy', 'A header line such as if, while, for or def ends with:', 'A colon', ['A semicolon', 'A full stop', 'A closing brace'],
  'The colon opens an indented block, which Python uses instead of braces.')
C('r-range', 4, 'easy', 'print(list(range(3, 12, 4)))', ['[3, 7]', '[3, 7, 11, 15]', '[4, 8, 12]'],
  'It starts at 3 and adds 4 while below 12: 3, 7, 11.', prompt='What does this print?')
Q('r-continue', 4, 'easy', 'Which statement skips the rest of the loop body and moves to the next iteration?', 'continue',
  ['break', 'pass', 'return'], 'break leaves the loop altogether, pass does nothing, and continue goes straight to the next round.')
TF('r-while-true', 4, 'easy', 'A while True loop runs forever unless something inside it breaks out.', True,
   'The condition is always true, so only break, return or an exception can end it.')
C('r-for-str', 4, 'easy', '''
for ch in "abc":
    print(ch.upper(), end="")
''', ['abc', 'cba', 'Abc'], 'A for loop on a string visits each character in order, and upper() turns each into a capital: ABC.',
  prompt='What does this print?')
# Unit 5 · functions
Q('r-def', 5, 'easy', 'Which keyword starts a function definition?', 'def', ['func', 'function', 'define'],
  'def name(parameters): followed by an indented body.')
Q('r-none', 5, 'easy', 'A function with no return statement gives back:', 'None', ['0', 'An empty string', 'Nothing; calling it is an error'],
  'Falling off the end of a function returns the special value None.')
TF('r-call-first', 5, 'easy', 'You can call a function on a line that runs before its def line.', False,
   'The name does not exist until the def statement has run, so an early call raises NameError.')
Q('r-param', 5, 'easy', 'In def f(x), x is a ___. In f(5), 5 is an ___.', 'parameter; argument',
  ['argument; parameter', 'variable; function', 'constant; variable'],
  'A parameter is the name in the definition. An argument is the value passed in the call.')
Q('r-lambda-kw', 5, 'easy', 'Which keyword creates an anonymous (unnamed) function?', 'lambda', ['anon', 'def', 'func'],
  'lambda x: x + 1 is a function with no name, written as one expression.')
TF('r-lambda-expr', 5, 'easy', 'The body of a lambda can only be a single expression.', True,
   'No statements are allowed inside a lambda. It returns the value of that one expression.')
Q('r-recursive', 5, 'easy', 'A recursive function is one that:', 'Calls itself', ['Has no parameters', 'Has no return', 'Is defined inside a loop'],
  'Each call works on a smaller version of the problem until a base case stops it.')
Q('r-base', 5, 'easy', 'Every recursive function needs:', 'A base case that stops the recursion',
  ['A global variable', 'A loop inside it', 'A lambda inside it'], 'Without a base case the function calls itself until Python gives up.')
E('r-recerr', 5, 'easy', '''
def f(n):
    return f(n + 1)
f(0)
''', 'RecursionError', ['StackFull', 'MemoryError', 'OverflowError'],
  'There is no base case, so Python stops at its recursion limit (about 1000 calls) with a RecursionError.')
TF('r-global-read', 5, 'easy', 'A function can read a global variable without using the global keyword.', True,
   'The global keyword is needed only when the function assigns to the name.')
Q('r-global-kw', 5, 'easy', 'To assign to a global variable inside a function you use:', 'global', ['public', 'extern', 'static'],
  'global x tells Python that x in this function means the module-level x.')
# Unit 5 · lists
Q('r-brackets', 5, 'easy', 'A list is written with:', 'Square brackets []', ['Round brackets ()', 'Curly braces {}', 'Angle brackets <>'],
  'Round brackets make a tuple and curly braces make a set or dictionary.')
TF('r-mutable', 5, 'easy', 'A list can be changed after it is created.', True, 'Lists are mutable: you can assign to items, append, remove and sort.')
X('r-len', 5, 'easy', 'len([1, [2, 3], 4])', ['4', '5', '2'], 'The inner list counts as one item, so there are three items.')
X('r-idx', 5, 'easy', '[10, 20, 30][-1]', ['10', '20', 'IndexError'], '-1 is the last index, so the answer is 30.')
X('r-slice', 5, 'easy', '[1, 2, 3, 4, 5][1:3]', ['[1, 2, 3]', '[2, 3, 4]', '[1, 2]'], 'Indexes 1 and 2 are included. Index 3 is where the slice stops.')
X('r-rev', 5, 'easy', '[1, 2, 3][::-1]', ['[1, 2, 3]', '[2, 1]', '[3, 2]'], 'A step of -1 walks the list backwards, giving a reversed copy.')
X('r-sum', 5, 'easy', 'sum([2, 4, 6])', ['10', '24', '246'], '2 + 4 + 6 = 12.')
X('r-concat', 5, 'easy', '[1, 2] + [3]', ['[1, 2, [3]]', '[4]', '[1, 2, 3, 3]'], '+ joins two lists into a new list.')
X('r-mult', 5, 'easy', '[0] * 3', ['[0, 3]', '[0]', '0'], '* repeats the list: three zeros.')
Q('r-append', 5, 'easy', 'Which method adds one item at the end of a list?', 'append()', ['add()', 'push()', 'insert_end()'],
  'L.append(x) puts x at the end. Lists have no push or add method.')
Q('r-sort', 5, 'easy', 'Which list method sorts the list itself, in place?', 'sort()', ['sorted()', 'order()', 'arrange()'],
  'sort() changes the list. sorted() is a built-in function that returns a new sorted list.')
X('r-in', 5, 'easy', '3 in [1, 2, 3]', ['False', '1', 'IndexError'], 'in tests membership: 3 is one of the items.')
X('r-count', 5, 'easy', '[1, 2, 2, 3, 2].count(2)', ['2', '5', '4'], 'The value 2 appears three times.')
X('r-index', 5, 'easy', '[5, 6, 7].index(7)', ['3', '7', '1'], 'index() returns the position of the first match: 7 is at index 2.')
