/**
 * LaTeX converter for saving data to a CouchDB database.
 */
(function(exports) {
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
        version: list.version || null,
        list_name: list.name,
        list_pos: i,
        section_id: sid,
        sec_pos: j,
        name: this.name,
        problem_tag: this.problem.tag + ' ' + this.problem.number,
        remarks: this.comments || [],
        distremark: this.distremark,
        problem: this.problem,
        intro: this.intro
      });
    });
    docs.push({
      type: 'section',
      _id: sid,
      list_id: list._id,
      version: list.version || null,
      list_name: list.name,
      pl_title: list.title,
      list_pos: i+1,
      title: doc.title,
      intro: doc.intro || '',
      author: doc.author,
      pblock_ids: problem_ids
    });
  };

  var sections = function(db, doc, list) {
    var section_ids = [];
    var docs = [];
    $.each(doc.sections || [], function(i) {
      exports.convertSection(list, this, i, section_ids, docs);
    });
    db.bulkSave({docs: docs}, {
      success: function() {}
    });
    return section_ids;
  };

  var make_revision = exports.make_revision = function(db, list, cb) {
    // clone
    list._id = $.couch.newUUID(32);
    delete list._rev;
    list.version = list.version || "1.0";
    db.allDocs({
      keys: list.section_ids,
      include_docs: true,
      success: function(resp) {
        list.section_ids = [];
        $.each(resp.rows, function() {
          var section = this.doc;
          section._id = $.couch.newUUID(32);
          delete section._rev;
          section.version = list.version;
          list.section_ids.push(section._id);
          db.allDocs({
            keys: section.pblock_ids,
            include_docs: true,
            success: function(resp) {
              var docs = [section];
              section.pblock_ids = [];
              $.each(resp.rows, function() {
                var pblock = this.doc;
                pblock._id = $.couch.newUUID(32);
                delete pblock._rev;
                pblock.version = list.version;
                pblock.section_id = section._id;
                docs.push(pblock);
                section.pblock_ids.push(pblock._id);
              });
              db.bulkSave({docs: docs});
            }
          });
        });
        db.saveDoc(list, {success: cb});
      }
    });
  };

  var extendWithout = function(dst, src, exclude) {
    _.each(src, function(v, k) {
      if (_.include(exclude, k)) return;
      dst[k] = v;
    });
    return dst;
  };

  // Each node consists of [doc, children]
  // where children is a list of nodes
  // path is a list of ancestors
  var saveTree = function(nodes, save) {
    var docs = _.map(nodes, function(node) {
      var doc = node.doc;
      if (!doc.path) doc.path = [];
      return doc;
    });
    save(docs, function(err, results) {
      _.each(nodes, function(node, i) {
        var doc = node.doc,
            result = results[i];
        doc._id = result._id;
        doc._rev = result._rev;
        if (node.children.length == 0)
          return;
        _.each(node.children, function(child) {
          if (!child.doc.path) {
            child.doc.path = doc.path.slice();
            child.doc.path.push(doc._id);
          }
        });
        saveTree(node.children, save);
      });
    });
  };

  var addChild = function(node, doc) {
    var child = {doc: doc, children: []};
    node.children.push(child);
    return child;
  };

  var saveDocs = function(docs, cb) {
    $.ajax({
      url: '/api/queue',
      type: 'POST',
      data: JSON.stringify(docs),
      contentType: 'application/json',
      dataType: 'json',
      success: function(result) {
        cb(null, result);
      },
      error: function(err) {
        cb(err);
      }
    });
  };

  exports.convert = function(list, cb) {
    // Convert a single problem list object into multiple AIMPL docs
    // returns a list of docs to be saved

    var listDoc = extendWithout({
      path: [],
      parent_id: 'aimpl', // TODO replace this with the current category doc id
      type: 'list',
      version: null
    }, list, ['sections', 'bibliography']);

    var root = {doc: listDoc, children: []};

    _.each(list.sections, function(section, i) {
      var sectionDoc = extendWithout({
        type: 'section'
      }, section, []);
      var node = addChild(root, sectionDoc);
      _.each(section.problemblocks, function(problem, i) {
        var problemDoc = extendWithout({
          type: 'problem'
        }, problem, ['problem']);
        problemDoc.body = problem.body;
        addChild(node, problemDoc);
      });
    });

    _.each(list.bibliography, function(bibitem, i) {
      var bibDoc = extendWithout({
        type: 'bibitem',
        version: null
      }, bibitem, []);
      addChild(root, bibDoc);
    });

    var queued = 0;

    saveTree([root], function(docs, treecb) {
      queued++;
      saveDocs(docs, function(err, results) {
        treecb(err, results);
        queued--;
        if (queued === 0) {
          cb(root);
        }
      });
    });
  };
})(typeof exports !== 'undefined' ? exports : (this.AIMPL_PARSER = {}));
var converter = this.AIMPL_PARSER;
var parser = grammar;

$(function() {
  $('#upload-form input.upload').live('click', function() {
    try{
  $('#loading').jqm({
    modal: true
  });
    var form = $('#upload-form');
    var reader = new FileReader();
    var input = form.find('input[name=file]')[0];
    if (input.files.length == 0) {
      return false;
    }
    $('#loading').jqmShow();
    reader.onload = function(e) {
      var data = e.target.result;
      // parse file and show preview ready for saving
      if (form.hasClass('section')) {
        db.openDoc(pl_id, {
          success: function(list) {
            var doc = parser.parse(data);
            var docs = [list], i = parseInt(typeof sec_num !== 'undefined' ? sec_num : list.section_ids.length);
            converter.convertSection(list, doc[0], i, list.section_ids, docs);
            db.bulkSave({docs: docs}, {
              success: function() {
                $('#loading').jqmHide();
              }
            });
          },
          error: function() {
            alert('An error occurred while attempting to load this problem list, please try again.');
          }
        });
      } else {
        var doc = parser.parse(data);
        console.log(doc);
        converter.convert(doc, function() {
          $('#loading').jqmHide();
        });
      }
    };
    reader.readAsText(input.files[0]);
    }catch(e) { console.log(e)}
    return false;
  });
  $('a.showhide').click(function() {
    $(this).next().slideToggle();
  });
});
