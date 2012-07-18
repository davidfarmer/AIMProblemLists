/* Jison generated parser */
var latextohtml = (function(){
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"file":3,"argument":4,"EOF":5,"command_fn":6,"COMMAND":7,"command":8,"OPEN_BRACE":9,"CLOSE_BRACE":10,"BEGIN_CENTER":11,"END_CENTER":12,"BEGIN_ENUMERATE":13,"item_list":14,"END_ENUMERATE":15,"BEGIN_ITEMIZE":16,"END_ITEMIZE":17,"table":18,"$":19,"math":20,"ITEM":21,"tex":22,"tex_item":23,"WHITESPACE":24,"TEX":25,"math_item":26,"BEGIN_TABULAR":27,"table_body":28,"END_TABULAR":29,"table_row":30,"whitespace":31,"&":32,"$accept":0,"$end":1},
terminals_: {"2":"error","5":"EOF","7":"COMMAND","9":"OPEN_BRACE","10":"CLOSE_BRACE","11":"BEGIN_CENTER","12":"END_CENTER","13":"BEGIN_ENUMERATE","15":"END_ENUMERATE","16":"BEGIN_ITEMIZE","17":"END_ITEMIZE","19":"$","21":"ITEM","24":"WHITESPACE","25":"TEX","27":"BEGIN_TABULAR","29":"END_TABULAR","32":"&"},
productions_: [0,[3,2],[6,1],[8,4],[8,4],[8,1],[8,3],[8,3],[8,3],[8,3],[8,1],[8,3],[14,3],[14,0],[4,2],[4,2],[4,0],[22,2],[22,0],[23,1],[23,1],[23,0],[20,2],[20,0],[26,1],[26,1],[26,1],[26,1],[18,3],[28,2],[28,0],[31,1],[31,0],[30,3],[30,1]],
performAction: function anonymous(yytext,yyleng,yylineno,yy) {

var $$ = arguments[5],$0=arguments[5].length;
switch(arguments[4]) {
case 1: require('sys').puts(JSON.stringify($$[$0-2+1-1], null, 2)); return $$[$0-2+1-1].join(''); 
break;
case 2:
      this.$ = function(arg) {
        var cmd = $$[$0-1+1-1].substr(1);
        var c = {
          'i': 'ı'
        }[cmd];
        var a = c ? [c] : [$$[$0-1+1-1]];
        if (cmd === 'emph') {
          return ['<em>', arg.join('').trim(), '</em>'];
        } else {
          a.concat(arg);
        }
        return a;
      }
    
break;
case 3: this.$ = $$[$0-4+2-1]($$[$0-4+3-1]); 
break;
case 4: this.$ = $$[$0-4+1-1]($$[$0-4+3-1]); 
break;
case 6: this.$ = $$[$0-3+2-1]; 
break;
case 7: this.$ = ['<div style="text-align: center">']; this.$.push.apply(this.$, $$[$0-3+2-1]); this.$.push('</div>'); 
break;
case 8: this.$ = $$[$0-3+2-1]; 
break;
case 9: this.$ = $$[$0-3+2-1]; 
break;
case 11: this.$ = [$$[$0-3+1-1]]; this.$.push.apply(this.$, $$[$0-3+2-1]); this.$.push($$[$0-3+3-1]); 
break;
case 12: this.$ = $$[$0-3+1-1].concat($$[$0-3+3-1]); 
break;
case 13: this.$ = []; 
break;
case 14: this.$ = $$[$0-2+1-1].concat($$[$0-2+2-1]); 
break;
case 15: this.$ = $$[$0-2+1-1].concat($$[$0-2+2-1]); 
break;
case 16: this.$ = []; 
break;
case 17: this.$ = $$[$0-2+1-1]; this.$.push($$[$0-2+2-1]); 
break;
case 18: this.$ = []; 
break;
case 22: this.$ = $$[$0-2+1-1]; this.$.push($$[$0-2+2-1]); 
break;
case 23: this.$ = []; 
break;
case 28:
      this.$ = ['<table><tr>'];
      this.$.push($$[$0-3+2-1].join('</tr><tr>'));
      this.$.push('</tr></table>');
    
break;
case 29: this.$ = $$[$0-2+1-1]; this.$.push('<tr><td>' + $$[$0-2+2-1].join('</td><td>') + '</td></tr>'); 
break;
case 30: this.$ = []; 
break;
case 33: this.$ = $$[$0-3+1-1]; this.$.push($$[$0-3+3-1].join('')); 
break;
case 34: this.$ = [$$[$0-1+1-1].join('')]; 
break;
}
},
table: [{"3":1,"4":2,"5":[2,16],"7":[2,16],"9":[2,16],"11":[2,16],"13":[2,16],"16":[2,16],"19":[2,16],"24":[2,16],"25":[2,16],"27":[2,16]},{"1":[3]},{"5":[1,3],"6":7,"7":[1,13],"8":4,"9":[1,6],"11":[1,8],"13":[1,9],"16":[1,10],"18":11,"19":[1,12],"22":5,"24":[2,18],"25":[2,18],"27":[1,14]},{"1":[2,1]},{"5":[2,14],"7":[2,14],"9":[2,14],"10":[2,14],"11":[2,14],"12":[2,14],"13":[2,14],"16":[2,14],"19":[2,14],"24":[2,14],"25":[2,14],"27":[2,14]},{"5":[2,15],"7":[2,15],"9":[2,15],"10":[2,15],"11":[2,15],"12":[2,15],"13":[2,15],"16":[2,15],"19":[2,15],"23":15,"24":[1,16],"25":[1,17],"27":[2,15]},{"4":19,"6":18,"7":[1,13],"9":[2,16],"10":[2,16],"11":[2,16],"13":[2,16],"16":[2,16],"19":[2,16],"24":[2,16],"25":[2,16],"27":[2,16]},{"5":[2,5],"7":[2,5],"9":[1,20],"10":[2,5],"11":[2,5],"12":[2,5],"13":[2,5],"16":[2,5],"19":[2,5],"24":[2,5],"25":[2,5],"27":[2,5]},{"4":21,"7":[2,16],"9":[2,16],"11":[2,16],"12":[2,16],"13":[2,16],"16":[2,16],"19":[2,16],"24":[2,16],"25":[2,16],"27":[2,16]},{"14":22,"15":[2,13],"21":[2,13]},{"14":23,"17":[2,13],"21":[2,13]},{"5":[2,10],"7":[2,10],"9":[2,10],"10":[2,10],"11":[2,10],"12":[2,10],"13":[2,10],"16":[2,10],"19":[2,10],"24":[2,10],"25":[2,10],"27":[2,10]},{"7":[2,23],"9":[2,23],"10":[2,23],"19":[2,23],"20":24,"24":[2,23],"25":[2,23]},{"5":[2,2],"7":[2,2],"9":[2,2],"10":[2,2],"11":[2,2],"12":[2,2],"13":[2,2],"16":[2,2],"19":[2,2],"24":[2,2],"25":[2,2],"27":[2,2]},{"24":[2,30],"25":[2,30],"28":25,"29":[2,30],"32":[2,30]},{"5":[2,17],"7":[2,17],"9":[2,17],"10":[2,17],"11":[2,17],"12":[2,17],"13":[2,17],"15":[2,17],"16":[2,17],"17":[2,17],"19":[2,17],"21":[2,17],"24":[2,17],"25":[2,17],"27":[2,17],"29":[2,17],"32":[2,17]},{"5":[2,19],"7":[2,19],"9":[2,19],"10":[2,19],"11":[2,19],"12":[2,19],"13":[2,19],"15":[2,19],"16":[2,19],"17":[2,19],"19":[2,19],"21":[2,19],"24":[2,19],"25":[2,19],"27":[2,19],"29":[2,19],"32":[2,19]},{"5":[2,20],"7":[2,20],"9":[2,20],"10":[2,20],"11":[2,20],"12":[2,20],"13":[2,20],"15":[2,20],"16":[2,20],"17":[2,20],"19":[2,20],"21":[2,20],"24":[2,20],"25":[2,20],"27":[2,20],"29":[2,20],"32":[2,20]},{"4":26,"7":[2,16],"9":[2,16],"10":[2,16],"11":[2,16],"13":[2,16],"16":[2,16],"19":[2,16],"24":[2,16],"25":[2,16],"27":[2,16]},{"6":7,"7":[1,13],"8":4,"9":[1,6],"10":[1,27],"11":[1,8],"13":[1,9],"16":[1,10],"18":11,"19":[1,12],"22":5,"24":[2,18],"25":[2,18],"27":[1,14]},{"4":28,"7":[2,16],"9":[2,16],"10":[2,16],"11":[2,16],"13":[2,16],"16":[2,16],"19":[2,16],"24":[2,16],"25":[2,16],"27":[2,16]},{"6":7,"7":[1,13],"8":4,"9":[1,6],"11":[1,8],"12":[1,29],"13":[1,9],"16":[1,10],"18":11,"19":[1,12],"22":5,"24":[2,18],"25":[2,18],"27":[1,14]},{"15":[1,30],"21":[1,31]},{"17":[1,32],"21":[1,31]},{"7":[1,38],"9":[1,36],"10":[1,37],"19":[1,33],"23":35,"24":[1,16],"25":[1,17],"26":34},{"22":41,"24":[2,18],"25":[2,18],"29":[1,39],"30":40,"32":[2,18]},{"6":7,"7":[1,13],"8":4,"9":[1,6],"10":[1,42],"11":[1,8],"13":[1,9],"16":[1,10],"18":11,"19":[1,12],"22":5,"24":[2,18],"25":[2,18],"27":[1,14]},{"5":[2,6],"7":[2,6],"9":[2,6],"10":[2,6],"11":[2,6],"12":[2,6],"13":[2,6],"16":[2,6],"19":[2,6],"24":[2,6],"25":[2,6],"27":[2,6]},{"6":7,"7":[1,13],"8":4,"9":[1,6],"10":[1,43],"11":[1,8],"13":[1,9],"16":[1,10],"18":11,"19":[1,12],"22":5,"24":[2,18],"25":[2,18],"27":[1,14]},{"5":[2,7],"7":[2,7],"9":[2,7],"10":[2,7],"11":[2,7],"12":[2,7],"13":[2,7],"16":[2,7],"19":[2,7],"24":[2,7],"25":[2,7],"27":[2,7]},{"5":[2,8],"7":[2,8],"9":[2,8],"10":[2,8],"11":[2,8],"12":[2,8],"13":[2,8],"16":[2,8],"19":[2,8],"24":[2,8],"25":[2,8],"27":[2,8]},{"15":[2,18],"17":[2,18],"21":[2,18],"22":44,"24":[2,18],"25":[2,18]},{"5":[2,9],"7":[2,9],"9":[2,9],"10":[2,9],"11":[2,9],"12":[2,9],"13":[2,9],"16":[2,9],"19":[2,9],"24":[2,9],"25":[2,9],"27":[2,9]},{"5":[2,11],"7":[2,11],"9":[2,11],"10":[2,11],"11":[2,11],"12":[2,11],"13":[2,11],"16":[2,11],"19":[2,11],"24":[2,11],"25":[2,11],"27":[2,11]},{"7":[2,22],"9":[2,22],"10":[2,22],"19":[2,22],"24":[2,22],"25":[2,22]},{"7":[2,24],"9":[2,24],"10":[2,24],"19":[2,24],"24":[2,24],"25":[2,24]},{"7":[2,25],"9":[2,25],"10":[2,25],"19":[2,25],"24":[2,25],"25":[2,25]},{"7":[2,26],"9":[2,26],"10":[2,26],"19":[2,26],"24":[2,26],"25":[2,26]},{"7":[2,27],"9":[2,27],"10":[2,27],"19":[2,27],"24":[2,27],"25":[2,27]},{"5":[2,28],"7":[2,28],"9":[2,28],"10":[2,28],"11":[2,28],"12":[2,28],"13":[2,28],"16":[2,28],"19":[2,28],"24":[2,28],"25":[2,28],"27":[2,28]},{"24":[2,29],"25":[2,29],"29":[2,29],"32":[1,45]},{"23":15,"24":[1,16],"25":[1,17],"29":[2,34],"32":[2,34]},{"5":[2,3],"7":[2,3],"9":[2,3],"10":[2,3],"11":[2,3],"12":[2,3],"13":[2,3],"16":[2,3],"19":[2,3],"24":[2,3],"25":[2,3],"27":[2,3]},{"5":[2,4],"7":[2,4],"9":[2,4],"10":[2,4],"11":[2,4],"12":[2,4],"13":[2,4],"16":[2,4],"19":[2,4],"24":[2,4],"25":[2,4],"27":[2,4]},{"15":[2,12],"17":[2,12],"21":[2,12],"23":15,"24":[1,16],"25":[1,17]},{"22":46,"24":[2,18],"25":[2,18],"29":[2,18],"32":[2,18]},{"23":15,"24":[1,16],"25":[1,17],"29":[2,33],"32":[2,33]}],
defaultActions: {"3":[2,1]},
parseError: function parseError(str, hash) {
    throw new Error(str);
},
parse: function parse(input) {
    var self = this,
        stack = [0],
        vstack = [null], // semantic value stack
        table = this.table,
        yytext = '',
        yylineno = 0,
        yyleng = 0,
        shifts = 0,
        reductions = 0,
        recovering = 0,
        TERROR = 2,
        EOF = 1;

    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;

    var parseError = this.yy.parseError = typeof this.yy.parseError == 'function' ? this.yy.parseError : this.parseError;

    function popStack (n) {
        stack.length = stack.length - 2*n;
        vstack.length = vstack.length - n;
    }

    function checkRecover (st) {
        for (var p in table[st]) if (p == TERROR) {
            return true;
        }
        return false;
    }

    function lex() {
        var token;
        token = self.lexer.lex() || 1; // $end = 1
        // if token isn't its numeric value, convert
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }
        return token;
    };

    var symbol, preErrorSymbol, state, action, a, r, yyval={},p,len,newState, expected, recovered = false;
    while (true) {
        // retreive state number from top of stack
        state = stack[stack.length-1];

        // use default actions if available
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol == null)
                symbol = lex();
            // read action for current state and first input
            action = table[state] && table[state][symbol];
        }

        // handle parse error
        if (typeof action === 'undefined' || !action.length || !action[0]) {

            if (!recovering) {
                // Report error
                expected = [];
                for (p in table[state]) if (this.terminals_[p] && p > 2) {
                    expected.push("'"+this.terminals_[p]+"'");
                }
                if (this.lexer.showPosition) {
                    parseError.call(this, 'Parse error on line '+(yylineno+1)+":\n"+this.lexer.showPosition()+'\nExpecting '+expected.join(', '),
                        {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, expected: expected});
                } else {
                    parseError.call(this, 'Parse error on line '+(yylineno+1)+": Unexpected '"+(this.terminals_[symbol] || symbol)+"'",
                        {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, expected: expected});
                }
            }

            // just recovered from another error
            if (recovering == 3) {
                if (symbol == EOF) {
                    throw 'Parsing halted.'
                }

                // discard current lookahead and grab another
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                symbol = lex();
            }

            // try to recover from error
            while (1) {
                // check for error recovery rule in this state
                if (checkRecover(state)) {
                    break;
                }
                if (state == 0) {
                    throw 'Parsing halted.'
                }
                popStack(1);
                state = stack[stack.length-1];
            }
            
            preErrorSymbol = symbol; // save the lookahead token
            symbol = TERROR;         // insert generic error symbol as new lookahead
            state = stack[stack.length-1];
            action = table[state] && table[state][TERROR];
            recovering = 3; // allow 3 real symbols to be shifted before reporting a new error
        }

        // this shouldn't happen, unless resolve defaults are off
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: '+state+', token: '+symbol);
        }

        a = action; 

        switch (a[0]) {

            case 1: // shift
                shifts++;

                stack.push(symbol);
                vstack.push(this.lexer.yytext); // semantic values or junk only, no terminals
                stack.push(a[1]); // push state
                symbol = null;
                if (!preErrorSymbol) { // normal execution/no error
                    yyleng = this.lexer.yyleng;
                    yytext = this.lexer.yytext;
                    yylineno = this.lexer.yylineno;
                    if (recovering > 0)
                        recovering--;
                } else { // error just occurred, resume old lookahead f/ before error
                    symbol = preErrorSymbol;
                    preErrorSymbol = null;
                }
                break;

            case 2: // reduce
                reductions++;

                len = this.productions_[a[1]][1];

                // perform semantic action
                yyval.$ = vstack[vstack.length-len]; // default to $$ = $1
                r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, a[1], vstack);

                if (typeof r !== 'undefined') {
                    return r;
                }

                // pop off stack
                if (len) {
                    stack = stack.slice(0,-1*len*2);
                    vstack = vstack.slice(0, -1*len);
                }

                stack.push(this.productions_[a[1]][0]);    // push nonterminal (reduce)
                vstack.push(yyval.$);
                // goto new state = table[STATE][NONTERMINAL]
                newState = table[stack[stack.length-2]][stack[stack.length-1]];
                stack.push(newState);
                break;

            case 3: // accept

                this.reductionCount = reductions;
                this.shiftCount = shifts;
                return true;
        }

    }

    return true;
}};/* Jison generated lexer */
var lexer = (function(){var lexer = ({EOF:"",
parseError:function parseError(str, hash) {
        if (this.yy.parseError) {
            this.yy.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },
setInput:function (input) {
        this._input = input;
        this._more = this._less = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        return this;
    },
input:function () {
        var ch = this._input[0];
        this.yytext+=ch;
        this.yyleng++;
        this.match+=ch;
        this.matched+=ch;
        var lines = ch.match(/\n/);
        if (lines) this.yylineno++;
        this._input = this._input.slice(1);
        return ch;
    },
unput:function (ch) {
        this._input = ch + this._input;
        return this;
    },
more:function () {
        this._more = true;
        return this;
    },
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20)+(next.length > 20 ? '...':'')).replace(/\n/g, "");
    },
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c+"^";
    },
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) this.done = true;

        var token,
            match,
            lines;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        for (var i=0;i < this.rules.length; i++) {
            match = this._input.match(this.rules[i]);
            if (match) {
                lines = match[0].match(/\n/g);
                if (lines) this.yylineno += lines.length;
                this.yytext += match[0];
                this.match += match[0];
                this.matches = match;
                this.yyleng = this.yytext.length;
                this._more = false;
                this._input = this._input.slice(match[0].length);
                this.matched += match[0];
                token = this.performAction.call(this, this.yy, this, i);
                if (token) return token;
                else return;
            }
        }
        if (this._input == this.EOF) {
            return this.EOF;
        } else {
            this.parseError('Lexical error on line '+(this.yylineno+1)+'. Unrecognized text.\n'+this.showPosition(), 
                    {text: "", token: null, line: this.yylineno});
        }
    },
lex:function () {
        var r = this.next();
        if (typeof r !== 'undefined') {
            return r;
        } else {
            return this.lex();
        }
    }});
lexer.performAction = function anonymous(yy,yy_) {

switch(arguments[2]) {
case 0:return 'COMMENT'
break;
case 1:return 11
break;
case 2:return 12
break;
case 3:return 27
break;
case 4:return 29
break;
case 5:return 21
break;
case 6:return 9
break;
case 7:return 10
break;
case 8:return 19
break;
case 9:return 32
break;
case 10:return 7
break;
case 11:return 24
break;
case 12:return 25
break;
case 13:return 5
break;
}
};
lexer.rules = [/^%.*/,/^\\begin\{center\}/,/^\\end\{center\}/,/^\\begin\{tabular\}/,/^\\end\{tabular\}/,/^\\item\b/,/^\{/,/^\}/,/^\$/,/^&/,/^\\[^\s{}]*/,/^\s+/,/^[^{}\\\%\$\&]+/,/^$/];return lexer;})()
parser.lexer = lexer;
return parser;
})();
if (typeof require !== 'undefined') {
exports.parser = latextohtml;
exports.parse = function () { return latextohtml.parse.apply(latextohtml, arguments); }
exports.main = function commonjsMain(args) {
    if (!args[1])
        throw new Error('Usage: '+args[0]+' FILE');
    if (typeof process !== 'undefined') {
        var source = require('fs').readFileSync(require('path').join(process.cwd(), args[1]), "utf8");
    } else {
        var cwd = require("file").path(require("file").cwd());
        var source = cwd.join(args[1]).read({charset: "utf-8"});
    }
    return exports.parser.parse(source);
}
if (require.main === module) {
  exports.main(typeof process !== 'undefined' ? process.argv.slice(1) : require("system").args);
}
}