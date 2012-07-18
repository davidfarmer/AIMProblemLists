/* description: Parses TeX code and converts to HTML. */

/* lexical grammar */

%lex

%%
"%".*                                   {return 'COMMENT'}
"\\begin{center}"                       {return 'BEGIN_CENTER'}
"\\end{center}"                         {return 'END_CENTER'}
"\\begin{tabular}"                      {return 'BEGIN_TABULAR'}
"\\end{tabular}"                        {return 'END_TABULAR'}
"\\item"                                {return 'ITEM'}
"{"                                     {return 'OPEN_BRACE'}
"}"                                     {return 'CLOSE_BRACE'}
"$"                                     {return '$'}
"&"                                     {return '&'}
"\\"[^\s{}]*                            {return 'COMMAND'}
\s+                                     {return 'WHITESPACE'}
[^{}\\\%\$\&]+                          {return 'TEX'}
<<EOF>>                                 {return 'EOF'}

/lex

%start file

%% /* language grammar */

file
  : argument EOF
    { /* require('sys').puts(JSON.stringify($1.join(''), null, 2)); */ return $1.join(''); }
  ;

command_fn
  : COMMAND
    {{
      $$ = function(arg) {
        var cmd = $1.substr(1);
        var c = {
          'i': 'ı'
        }[cmd];
        var a = c ? [c] : [$1];
        if (cmd === 'emph') {
          return ['<em>', arg.join('').trim(), '</em>'];
        } else {
          a.concat(arg);
        }
        return a;
      }
    }}
  ;

command
  : OPEN_BRACE command_fn argument CLOSE_BRACE
    { $$ = $command_fn($argument); }
  | command_fn OPEN_BRACE argument CLOSE_BRACE
    { $$ = $command_fn($argument); }
  | OPEN_BRACE argument CLOSE_BRACE
    { $$ = $argument; }
  | BEGIN_CENTER argument END_CENTER
    { $$ = ['<div style="text-align: center">']; $$.push.apply($$, $argument); $$.push('</div>'); }
  | BEGIN_ENUMERATE item_list END_ENUMERATE
    { $$ = $item_list; }
  | BEGIN_ITEMIZE item_list END_ITEMIZE
    { $$ = $item_list; }
  | table
  | "$" math "$"
    { $$ = [$1]; $$.push.apply($$, $math); $$.push($3); }
  ;

item_list
  : item_list ITEM tex
    { $$ = $1.concat($tex); }
  |
    { $$ = []; }
  ;

argument
  : argument command
    { $$ = $argument.concat($command); }
  | argument tex
    { $$ = $argument.concat($tex); }
  |
    { $$ = []; }
  ;

tex
  : tex tex_item
    { $$ = $tex; $$.push($tex_item); }
  |
    { $$ = []; }
  ;

tex_item
  : WHITESPACE
  | TEX
  |
  ;

math
  : math math_item
    { $$ = $math; $$.push($math_item); }
  |
    { $$ = []; }
  ;

math_item
  : tex_item
  | OPEN_BRACE
  | CLOSE_BRACE
  | COMMAND
  ;

table
  : BEGIN_TABULAR table_body END_TABULAR
    {
      $$ = ['<table><tr>'];
      $$.push($table_body.join('</tr><tr>'));
      $$.push('</tr></table>');
    }
  ;

table_body
  : table_body table_row
    { $$ = $1; $$.push('<tr><td>' + $table_row.join('</td><td>') + '</td></tr>'); }
  |
    { $$ = []; }
  ;

whitespace
  : WHITESPACE
  |
  ;

table_row
  : table_row "&" tex
    { $$ = $table_row; $$.push($tex.join('')); }
  | tex
    { $$ = [$tex.join('')]; }
  ;

