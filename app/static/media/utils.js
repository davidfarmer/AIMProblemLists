(function(exports) {
  if (typeof (String.prototype.trim) === "undefined") {
    // From http://stackoverflow.com/questions/1418050/string-strip-for-javascript/1418059#1418059
    String.prototype.trim = function() {
      return String(this).replace(/^\s+|\s+$/g, '');
    };
  }

  var DIACRITICS = {
    "`": '\u0300',
    "'": '\u0301',
    "^": '\u0302',
    "~": '\u0303',
    "=": '\u0304',
    "u": '\u0306',
    ".": '\u0307',
    '"': '\u0308',
    "r": '\u030A',
    "H": '\u030B',
    "v": '\u030B',
    "d": '\u0323',
    "c": '\u0327',
    "k": '\u0328'
  };

  exports.escapeHTML = function(s) {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  };

  exports.escapeLaTeX = function(s) {
    if (!s) {
      return s;
    }
    // First trim whitespace from beginning/end of string.
    s = s.replace(/^\s+|\s+$/g, "");
    var parts = s.split(/(\$\$(?:\\\$|[^\$]|\$[^\$])*\$\$|\$(?:\\\$|[^\$])*\$|\\\([^\)]*\\\)|\\\[[\s\S]*?\\\])/g);
    for (var i=0; i<parts.length; i++) {
      if (!(i&1)) {
        parts[i] = exports.escapeHTML(parts[i]
          .replace(/(\S|^)\\([`'^~=."])\s*?(?:{([^}])}|(\S))/g, function(str, s, type, s1, s2) {
            return s + (s1 || s2) + (DIACRITICS[type] || "");
          })
          .replace(/\\([urHvdck])\s*?(?:{([^}])}|(\S\s|$))/g, function(str, type, s1, s2) {
            return (s1 || s2) + (DIACRITICS[type] || "");
          })
          .replace(/``/g, '“')
          .replace(/''/g, '”')
          .replace(/`/g, '‘')
          .replace(/'/g, '’')
          .replace(/([^\\]|^)\\([&\$%#_{}~^ ])/g, '$1$2'))
          //
          .replace(/^%.*$/mg, '')
          .replace(/\\verb\*?(\S)([^\+]+)\1/g, '$2')
          .replace(/\\htmladdnormallink{([^}]+)}{([^}]+)}/g,'<a\ href=\"$2\">$1</a>')
          .replace(/\\htmladdimage{([^}]+)}{([^}]+)}/g,'<img src=\"$2\"></a>')
          .replace(/\\(?:emph|textit){([^}]+)}/g, '<em>$1</em>')
          .replace(/\\textbf{([^}]+)}/g, '<strong>$1</strong>')
          .replace(/\\texttt{([^}]+)}/g, '<code>$1</code>')
          .replace(/\\label\{([^}]+)\}/g, '<a name="$1" class="label"></a>')
          .replace(/\\(cite|(?:eq)?ref)\{([^}]+)\}/g, function(str, p1, p2) {
            return [
              p1 === 'eqref' ? '(' : p1 === 'cite' ? '[' : '',
              '<a href="#', p2,'" class="cite">', p2 ,'</a>',
              p1 === 'eqref' ? ')' : p1 === 'cite' ? ']' : ''
            ].join('');
          })
          .replace(/---/g, '—')
          .replace(/--/g, '–')
          .replace(/\\-/g, '\u00AD')
          .replace(/\\i(\s|$|})/g, 'ı$1')
          .replace(/\\ldots/g, '…')
          .replace(/(?!\\)~/g, '&nbsp;')
          .replace(/{\\tt\s+([^}]+)}/g, '<code>$1</code>')
          .replace(/{\\bf\s+([^}]+)}/g, '<strong>$1</strong>')
          .replace(/{\\it\s+([^}]+)}/g, '<em>$1</em>')
          .replace(/\\(Cat)/g, '$1') // XXX This is due to MathJax not processing macros outside math mode
          //.replace(/{\\rm\s+([^}]+)}/g, '$1') // Not sure if this used anywhere at the moment
          .replace(/{\\em(?:ph)?\s+([^}]+)}/g, '<em>$1</em>')
          //.replace(/((?:\s|^)[^\^\$\#\%\&\~\_{}]*)\{([^\{\}]*)\}/g, '$1$2')
          .replace(/\\(C|F|N|Q|R|Z)([^A-Za-z0-9])/g, '\\mathbb $1$2')
          .replace(/\\begin\{center\}([\s\S]*?)\\end\{center\}/g, '<div style="text-align: center">$1</div>')
          .replace(/\\textbackslash/g, '\\')
          .replace(/\r?\n\r?\n/g, '<br /><br />')
        ;
      }
    }
    var itemArg = /^\s*\[([^\]]*)\]/;
    return parts.join("")
      .replace(/\\begin\{enumerate\}[\s\S]*?\\item([\s\S]*?)\\end\{enumerate\}/g, function(str, p1) {
        return '<ol>' + p1.split(/\\item/g).map(function(d) {
          if (itemArg.test(d)) {
            return '<li style="list-style-type: none">' + d.replace(itemArg, "$1 ") + '</li>';
          }
          return '<li>' + d + '</li>';
        }).join('') + '</ol>';
      })
      .replace(/\\begin\{itemize\}\s*\\item([\s\S]*?)\\end\{itemize\}/g, function(str, p1) {
        return '<ul><li>' + p1.split(/\\item/g).join('</li><li>') + '</li></ul>';
      })
      .replace(/\\begin\{theorem\}\s*([\s\S]*?)\s*\\end\{theorem\}/g, function(str, p1) {
        return '<br><h5 class="theorem">Theorem.</h5> ' + p1;
      });
  };

  exports.processLaTeX = function(o) {
    if (!o) return o;
    var isArray = Object.prototype.toString.call(o) === '[object Array]';
    var out = isArray ? [] : {};
    for (var k in o) {
      if (typeof o[k] === 'object')
        out[k] = exports.processLaTeX(o[k]);
      else if (typeof o[k] === 'string') 
        out[k] = exports.escapeLaTeX(o[k]);
      else
        out[k] = o[k];
    }
    return out;
  }
})(typeof exports !== 'undefined' ? exports : window);
