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

%% /* language grammar */

file
  : skip document skip EOF
    { /* require('sys').puts(JSON.stringify($2, null, 2)); */ return $2; }
  | section EOF
    { return $1; }
  ;

document
  : BEGIN_DOCUMENT pl_meta MAKETITLE skip section_list skip bibliography skip END_DOCUMENT
    {{ $$ = $2; $$.intro = $4.join(''); $$.sections = $5; $$.bibliography = $7; }}
  ;

pl_meta
  : skip pl_meta
    { $$ = $2; }
  | title pl_meta
    { $$ = $2; $$.title = $1; }
  | author pl_meta
    { $$ = $2; $$.author = $1; }
  | urlstub pl_meta
    { $$ = $2; $$.name = $1; }
  | version pl_meta
    { $$ = $2; $$.version = $1; }
  | skip
    {{ $$ = {}; }}
  ;

version
  : VERSION name
    { $$ = $2; }
  ;

urlstub
  : URLSTUB name
    { $$ = $2; }
  ;

title
  : TITLE name
    { $$ = $2; }
  ;

author
  : AUTHOR name
    { $$ = $2.replace(/^Edited by /i, ''); }
  ;

tex_braces
  : TEX tex_braces
    { $$ = [$1, $2.join('')]; }
  | WHITESPACE tex_braces
    { $$ = [$1, $2.join('')]; }
  | '\\' tex_braces
    { $$ = [$1, $2.join('')]; }
  | OPEN_BRACE tex_braces CLOSE_BRACE tex_braces
    { $$ = [$1, $2.join(''), $3, $4.join('')]; }
  |
    { $$ = []; }
  ;

name
  : OPEN_BRACE tex_braces CLOSE_BRACE
    { $$ = $2.join(''); }
  ;

section_list
  : section
    { $$ = [$1]; }
  | section_list section
    { $$ = $1; $1.push($2); }
  ;

section
  : SECTION name skip problem_block_list
    {{ $$ = {title: $2, intro: $skip.join(''), problemblocks: $problem_block_list}; }}
  ;

problem_block_list
  : problem_block_list problem_block skip
    { $$ = $1; $$.push($2); }
  |
    { $$ = []; }
  ;

problem_block
  : BEGIN_PROBLEM_BLOCK skip problem_block_name skip problem skip remark_list skip END_PROBLEM_BLOCK
    {{ $$ = {
         name: $problem_block_name || null,
         intro: $2.concat($4).join(''),
         problem: $problem,
         distremark: $6.join(''),
         comments: $7
       };
    }}
  | BEGIN_PROB by skip END_PROB
    {{ $$ = {
         name: "",
         "problem": {
           tag: $1.replace(/^\\begin\{(.+)\}.*$/, '$' + '1'),
           number: $1.replace(/.*\}\[(.+)\]/, '$' + '1'),
           body: $skip.join(''),
           by: $by
         }
       };
    }}
  ;

problem_block_name
  : NAME name
    { $$ = $2; }
  |
  ;

problem
  : BEGIN_PROBLEM label by skip END_PROBLEM
    {{ $$ = {"by": $by, "tag": $1.replace(/^\\begin\{(.+)\}.*$/, '$' + '1'), "number": $1.replace(/.*\}\[(.+)\]/, '$' + '1'), "body": $skip.join('')}; }}
  ;

remark_list
  : remark_list remark skip
    { $$ = $1; $$.push($2); }
  |
    { $$ = []; }
  ;

remark
  : BEGIN_REMARK by skip END_REMARK
    {{ $$ = {"by": $by, "remark": $skip.join('')}; }}
  | REMARK name
    {{ $$ = {remark: $name}; }}
  ;

label
  : whitespace LABEL whitespace name
    { $$ = $name; }
  | whitespace
    { $$ = ''; }
  ;

by
  : whitespace BY whitespace name
    { $$ = $name; }
  | whitespace
    { $$ = null; }
  ;

bibliography
  : BEGIN_BIBLIOGRAPHY skip bibitem_list END_BIBLIOGRAPHY
    { $$ = $3; }
  |
    { $$ = null; }
  ;

bibitem_list
  : bibitem_list BIBITEM name skip
    {{ $$ = $1; $$.push({"ref": $name, "content": $skip.join('')}); }}
  |
    { $$ = []; }
  ;

whitespace
  : WHITESPACE
  |
  ;

skip
  : skip skip_item
    { $$ = $1; $$.push($2); }
  |
    { $$ = []; }
  ;

skip_item
  : TEX
  | OPEN_BRACE
  | CLOSE_BRACE
  | WHITESPACE
  | '\\'
  | COMMENT
  | BY
  | LABEL
  |
  ;
