/* description: Parses TeX code. */

/* lexical grammar */

%lex

PROBLEM                         ('problem'|'conjecture'|'rhequivalence')
PROB                            ('prob'|'rhequiv')
PROBLEM_NUMBER                  ("["\d+("."\d+)?"]")?

%%
"%".*                                   {return 'COMMENT'}
"\\begin{"{PROB}"}"{PROBLEM_NUMBER}     {return 'BEGIN_PROB'}
"\\end{"{PROB}"}"                       {return 'END_PROB'}
"\\begin{"{PROBLEM}"}"{PROBLEM_NUMBER}  {return 'BEGIN_PROBLEM'}
"\\end{"{PROBLEM}"}"                    {return 'END_PROBLEM'}
"\\begin{document}"                     {return 'BEGIN_DOCUMENT'}
"\\end{document}"                       {return 'END_DOCUMENT'}
"\\begin{problemblock}"                 {return 'BEGIN_PROBLEM_BLOCK'}
"\\end{problemblock}"                   {return 'END_PROBLEM_BLOCK'}
"\\begin{remark}"                       {return 'BEGIN_REMARK'}
"\\end{remark}"                         {return 'END_REMARK'}
"\\begin{thebibliography}"              {return 'BEGIN_BIBLIOGRAPHY'}
"\\end{thebibliography}"                {return 'END_BIBLIOGRAPHY'}
"\\author"                              {return 'AUTHOR'}
"\\bibitem"                             {return 'BIBITEM'}
"\\by"                                  {return 'BY'}
"\\label"                               {return 'LABEL'}
"\\maketitle"                           {return 'MAKETITLE'}
"\\name"                                {return 'NAME'}
"\\plversion"                           {return 'VERSION'}
"\\remark""*"?                          {return 'REMARK'}
"\\section"                             {return 'SECTION'}
"\\title"                               {return 'TITLE'}
"\\urlstub"                             {return 'URLSTUB'}
"{"                                     {return 'OPEN_BRACE'}
"}"                                     {return 'CLOSE_BRACE'}
"\\"[^\s{}]*                            {return '\\'}
\s+                                     {return 'WHITESPACE'}
[^{}\\\%]+                              {return 'TEX'}
<<EOF>>                                 {return 'EOF'}

/lex

%start file
