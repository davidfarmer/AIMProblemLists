/**
 * LaTeX parser and converter for saving data to a CouchDB database.
 */
(function(exports) {
  if (typeof (String.prototype.trim) === "undefined") {
    // From http://stackoverflow.com/questions/1418050/string-strip-for-javascript/1418059#1418059
    String.prototype.trim = function() {
      return String(this).replace(/^\s+|\s+$/g, '');
    };
  }
  RegExp.escape = function(text) {
    // From http://simonwillison.net/2006/Jan/20/escape/#p-6
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  };

  var nest = function(name, tex) {
    var rname = RegExp.escape('\\begin{'+name+'}') + '([\\s\\S]*?)' + RegExp.escape('\\end{'+name+'}') + '([\\s\\S]*)';
    var r = new RegExp(rname);
    var m = tex.match(r);
    if (m) {
      return [m[1], m[2] || null];
    }
    return null;
  }

  var title = function(tex) {
    var m = tex.match(/^\\title\{(.*)\}/m);
    return m ? m[1] : null;
  }

  var version = function(tex) {
    var m = tex.match(/^\\plversion{(.*)}/m);
    return m ? m[1] : '1.0';
  }

  var urlstub = function(tex) {
    var m = tex.match(/^\\urlstub{(.*)}/m);
    return m ? m[1] : null;
  }

  var author = function(tex) {
    var m = tex.match(/^\\author{(.*)}/m);
    return m ? m[1] : null;
  }

  var intro = function(tex) {
    var sections = split('section', tex, false);
    var front = sections.shift();
    return split('maketitle', front, false).pop();
  }

  var sections = function(tex) {
    var sections = split('section', tex, true);
    sections.shift();
    return sections.map(section);
  }

  var bibliography = function(tex) {
    var a = nest('thebibliography', tex);
    if (a) {
      var items = [];
      var parts = split('bibitem', a[0]);
      parts.shift();
      for (var i=0; i<parts.length; i++) {
        var m = parts[i].match(/^\{([^\}]+)\}\s*([\s\S]+)/);
        if (m) {
          items.push({ref: m[1], content: m[2]})
        }
      }
      return items;
    }
    return [];
  }

  var section = function(tex) {
    var r = new RegExp('^\\s*\\\\begin{(problemblock|prob|rhequiv)}', 'm');
    var parts = tex.split(r);
    var s = {
      title: field('section', tex),
      author: field('by', tex),
      problemblocks: problemblocks(tex)
    };
    var m = parts[0].split(new RegExp(RegExp.escape('\\section{' + s.title + '}'), 'm'));
    if (m.length > 1) {
      s.intro = m[1];
    }
    return s;
  }

  var problemblocks = function(tex) {
    var blocks = [];
    var beg = next_tag("begin", tex);
    var parts = [];
    if (/^(prob(lem)?|rhequiv(alence)?|conjecture|rhapproach)$/.test(beg)) {
      parts = nest(beg, tex)
      var probtag = beg
      if (/^rhequiv(alence)?$/.test(probtag)) {
        probtag = "RH Equivalence";
      }
      blocks.push(simpleproblemblock(parts[0], probtag))
    } else if (beg && tex.length > 1) {
      parts = nest("problemblock", tex);
      if (parts) {
        var pb = problemblock(parts[0])
        if (pb) {
          blocks.push(pb);
        }
      }
    }
    if (parts && parts[1]) {
      blocks.push.apply(blocks, problemblocks(parts[1]))
    }
    return blocks;
  }

  var problemblock = function(text) {
    if (!text) return null;
    var m = text.match(/([\s\S]*)\\begin\{(problem|rhequivalence|conjecture|rhapproach)\}(?:\[([^\]]+)\])?/m);
    var probtag = "Problem";
    var intro, name, probnum = '';
    if (m) {
      intro = m[1];
      name = m[2];
      probnum = m[3];
      probtag = name;
      if (probtag == "rhequivalence") {
        probtag = "RH Equivalence";
      }
    } else {
      intro = text;
      name = "problem";
    }
    var x = {};
    var m = intro.match(/\\name\{([^\}]+)\}/);
    if (m) {
      x.name = m[1];
      intro = intro.replace(/\\name\{[^\}]+\}/, "");
    }
    var probs = list(name, text);
    x.intro = intro;
    x.problems = parse_probs(probs);
    x.probtag = probtag;
    x.probnum = probnum;
    x.distremark = '';
    var comments = list("remark", text)
    var parts = nest("distinguishedremark", text)
    if (parts) {
      distremark = parts[0];
      if (distremark) {
        x.distremark = distremark;
      }
    }
    var r = new RegExp("\\\\end\\{" + RegExp.escape(name) + "\\}((?:[\\s\\S](?!\\\\begin\\{remark\\}))*)", 'm');
    var m = text.match(r);
    if (m) {
      x.distremark += m[1].trim();
    }
    x.comments = comments.map(function(c) { return {remark: remove_field("by", c), by: field("by", c)}});
    return x;
  }

  var parse_probs = function(probs) {
    var r = [];
    for (var i=0; i<probs.length; i++) {
      var prob = probs[i];
      r.push({
        body: remove_field("by", prob).replace(/\s*\[[^\]]+\]/, ""),
        by: field("by", prob) // Nitin: to be consistent this needs to be author or the authors need to become \by
      });
    }
    return r;
  }

  var simpleproblemblock = function(text, probtag) {
    return {
      problems: parse_probs([text]),
      probtag: probtag
    }
  }

  var list = function(name, tex) {
    var items = [];
    while (tex) {
      var parts = nest(name, tex);
      if (!parts) break;
      var block = parts[0];
      var tex = parts[1];
      if (block) {
        items.push(block);
      }
    }
    return items;
  }

  var next_tag = function(tname, tex) {
    var r = new RegExp("\\\\" + RegExp.escape(tname) + "\\{(.*)\\}");
    var m = tex.match(r);
    return m ? m[1] : null;
  }

  var remove_field = function(name, tex) {
    if (!tex) return null;
    var r = new RegExp('\\\\' + RegExp.escape(name) + '\\{(.*?)\\}');
    return tex.replace(r, '');
  }

  var field = function(name, tex) {
    if (!tex) return null;
    var r = new RegExp('\\\\' + RegExp.escape(name) + '\\{');
    var m = tex.split(r);
    if (m.length > 1) {
      var s = m[1], count = 1, i;
      for (i=0; i<s.length && count > 0; i++) {
        var c = s[i];
        if (c === '{') {
          count++;
        } else if (c === '}') {
          count--;
        }
      }
      return s.substring(0, i-1);
    }
    return null;
  }

  var split = function(name, tex, keep) {
    if (!tex) return null;
    var r = new RegExp('^\\s*' + RegExp.escape('\\' + name), 'm');
    var splitted = tex.split(r);
    return keep ? splitted.map(function(st) { return '\\' + name + st }) : splitted;
  }

  exports.parse = function(s) {
    var parts = nest('document', s);
    var doc = parts[0];
    var obj = {
      intro: intro(doc),
      title: title(doc),
      sections: sections(doc),
      name: urlstub(doc),
      author: author(doc).replace(/^Edited by /i, ''),
      version: version(doc),
      bibliography: bibliography(doc)
    };
    return obj;
  }

  exports.parseSection = function(s) {
    return sections(s);
  };

  exports.convertSection = function(list, doc, i, section_ids, docs) {
    var sid = $.couch.newUUID();
    section_ids[i] = sid;
    var problem_ids = [];
    $.each(doc.problemblocks || [], function(j) {
      var pid = $.couch.newUUID();
      problem_ids.push(pid);
      docs.push({
        type: 'pblock',
        _id: pid,
        list_id: list._id,
        list_name: list.name,
        list_pos: i,
        section_id: sid,
        sec_pos: j,
        name: this.name,
        problem_tag: this.probtag + ' ' + this.probnum,
        remarks: this.comments || [],
        distremark: this.distremark,
        problem: this.problems.length ? this.problems[0] : {},
        intro: this.intro
      });
    });
    docs.push({
      type: 'section',
      _id: sid,
      list_id: list._id,
      list_name: list.name,
      pl_title: list.title,
      list_pos: i+1,
      title: doc.title,
      intro: doc.intro || '',
      author: doc.author,
      pblock_ids: problem_ids
    });
  };

  exports.convert = function(doc, db, cb) {
    // Prime UUID cache
    $.couch.newUUID(100);
    // Convert a doc into AIMPL docs
    var section_ids = [];
    var list = {
      type: 'list',
      _id: doc.name,
      version: doc.version,
      title: doc.title,
      intro: doc.intro,
      name: doc.name,
      author: doc.author
    };
    var sections = function() {
      var section_ids = [];
      var docs = [];
      $.each(doc.sections || [], function(i) {
        exports.convertSection(list, this, i, section_ids, docs);
      });
      db.bulkSave({docs: docs}, {
        success: function() {}
      });
      return section_ids;
    }
    var bibliography = function() {
      var docs = [];
      $.each(doc.bibliography || [], function(i) {
        var bid = $.couch.newUUID();
        docs.push({
          type: 'bibitem',
          _id: bid,
          list_id: list._id,
          list_name: list.name,
          list_pos: i,
          content: this.content,
          ref: this.ref
        });
      });
      db.bulkSave({docs: docs}, {
        success: function() {}
      });
    }
    var make_revision = function(list, cb) {
      docid = list['_id'] + "/v" + list['version'];
      db.copyDoc(list, {
        success: function() {
          db.openDoc(docid, {
            success: function(new_list) {
              new_list['name'] = docid;
              section_ids = sections(new_list);
              new_list["section_ids"] = section_ids;
              db.saveDoc(new_list, {
                success: cb
              });
            },
            error: cb
          });
        }
      }, {
        beforeSend: function(req) {
          req.setRequestHeader('Destination', docid); 
        }
      });
    }
    list.section_ids = sections();
    bibliography();
    db.openDoc(doc.name, {
      success: function(oldDoc) {
        var sections = [];
        if (oldDoc.section_ids && oldDoc.section_ids.length > 0) {
          sections = db.allDocs({
            keys: oldDoc.section_ids || [],
            include_docs: true,
            success: function(resp) {
              var pblock_ids = [];
              var docs = [];
              $.each(resp.rows, function() {
                if (!this.doc) return;
                docs.push({_id: this.doc._id, _rev: this.doc._rev, _deleted: true});
                if (this.doc.pblock_ids && this.doc.pblock_ids.length > 0) {
                  pblock_ids.push.apply(pblock_ids, this.doc.pblock_ids);
                }
              });
              db.allDocs({
                keys: pblock_ids,
                include_docs: true,
                success: function(resp) {
                  $.each(resp.rows, function() {
                    if (!this.doc) return;
                    docs.push({_id: this.doc._id, _rev: this.doc._rev, _deleted: true});
                  });
                  if (docs.length > 0) {
                    var docs2 = [], hasBeen = {};
                    $.each(docs, function() {
                      if (!hasBeen[this._id]) {
                        docs2.push(this);
                        hasBeen[this._id] = true;
                      }
                    });
                    db.bulkSave({docs: docs2}, {
                      success: function() {
                        cb();
                      }
                    });
                  }
                }
              });
            }
          });
        }
        list._rev = oldDoc._rev;
        db.saveDoc(list, {
          success: function() {
            if (oldDoc["version"] != doc["version"]) {
              db.view("aimpl/remarks", {
                success: function(resp) {
                  $.each(resp.rows, function(remark) {
                    docs.push({_id: remark.id, _rev: remark.value._rev, _deleted: true});
                  });
                  make_revision(list, cb)
                }
              });
            } else cb();
          }
        });
      },
      error: function() {
        db.saveDoc(list, {
          success: function() {
            make_revision(list, cb);
          }
        });
      }
    });
  };

exports.main = function commonjsMain(args) {
    if (!args[1])
        throw new Error('Usage: '+args[0]+' FILE');
    if (typeof process !== 'undefined') {
        var source = require('fs').readFileSync(require('path').join(process.cwd(), args[1]), "utf8");
    } else {
        var cwd = require("file").path(require("file").cwd());
        var source = cwd.join(args[1]).read({charset: "utf-8"});
    }
    var sys = require('sys');
    sys.puts( JSON.stringify(exports.parse(source), null, 2) );
}
if (typeof require !== 'undefined' && require.main === module) {
  exports.main(typeof process !== 'undefined' ? process.argv.slice(1) : require("system").args);
}

})(typeof exports !== 'undefined' ? exports : (this.AIMPL_PARSER = {}));
