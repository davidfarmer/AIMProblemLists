//
// 1. Tokenise LaTeX into lists of tokens:
//
// \begin{command}\foo{stuff}{morestuff}[stuff]\end{command}
//
// ->
//
// ['\begin', ['command'], ['\foo', ['stuff'], ['morestuff'], ['stuff']]
//
