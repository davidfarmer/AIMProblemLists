import re, sys

ex = re.compile('|'.join(( r'\\[a-zA-Z]+',
r'\\.',
r'\$\$',
r'[a-zA-Z0-9]+',
r'[ ]+',
r'%[^\n]*',
r'.' )),
re.DOTALL)

for line in open(sys.argv[1]):
    for token in ex.findall(line):
        if token == '\n':
            token = '(newline)'
        print '[' + token + ']'
