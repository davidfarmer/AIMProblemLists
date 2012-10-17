var async = require("async"),
    _ = require("./static/media/underscore"),
    permissions = require("./lib/permissions"),
    utils = require("./static/media/utils");

exports.setup = function(app, db) {
  function getMenu(pl) {
    var root = ["", pl.name];
    if (pl.version) root.push("archives", pl.version);
    root.push("");
    root = root.join("/");
    var index = 0;
    return pl.children.map(function(o, i) {
      if (o.type != "section" || o.pending) return "";
      return '<li><a href="' + root + (++index) + '/">' + utils.escapeLaTeX(o.title || "No title") + '</a>';
    }).join("");
  }

  function getList(pl, version, cb) {
    // Retrieve problem list with specified name and version
    db.view("pls", {
      startkey: [pl],
      endkey: [pl, {}],
      include_docs: true
    }, function(err, data) {
      if (err) return cb(err);
      var docs = _.pluck(data.rows, "doc");
      _.each(docs, function(d) {
        if (d.version == version) d.active = true;
      });
      var pl = _.detect(docs, function(d) {
        return d.active;
      });
      if (!pl) return cb("not found");
      pl = _.clone(pl);
      pl.versions = docs; 
      var path = pl.path.concat([pl._id]);
      // Retrieve immediate children of problem list, for convenience
      db.view("tree", {
        startkey: path,
        endkey: path.concat([{}]),
        skip: 0,
        group_level: path.length + 1
      }, function(err, data) {
        pl.children = _.pluck(data.rows, "value");
        pl.children = _.sortBy(pl.children, function(d) { return d.order; });
        pl.menu = getMenu(pl);
        cb(null, pl);
      });
    });
  }

  function apiSave(doc, res) {
    db.saveDoc(doc, function(err, result) {
      res.send({
        _id: result.id,
        _rev: result.rev
      });
    });
  }

  // TODO use bulk save API.
  function apiBulkSave(docs, res) {
    async.parallel(docs.map(function(doc) {
      return function(cb) {
        db.saveDoc(doc, cb);
      };
    }), function(err, results) {
      res.send(results.map(function(result) {
        return {
          _id: result.id,
          _rev: result.rev
        };
      }));
    });
  }

  function getPermissions(req, doc) {
    return permissions.getPermissions(req.userCtx, doc);
  }

  // Show pending changes for a particular object
  // These may be of the same type i.e. edits or a different type i.e. additional
  // children that need approving
  app.get("/api/queue/:parentId?", function(req, res, next) {
    var parentId = req.params.parentId || null;
    function showPendingChanges(userCtx, perms) {
      db.view("pending_changes", {
        startkey: [parentId],
        endkey: [parentId, {}],
        include_docs: true
      }, function(err, data) {
        res.send(_.filter(_.pluck(data.rows, "doc"), function(doc) {
          var typePermissions = perms[doc.type];
          return (typePermissions && typePermissions.approve) || (userCtx && userCtx.id === doc.userId);
        }));
      });
    }
    if (parentId) {
      db.openDoc(parentId, function(err, doc) {
        // Get list
        if (doc.path && doc.path.length > 1) {
          db.openDoc(doc.path[1], function(err, doc) {
            var perms = getPermissions(req, doc);
            showPendingChanges(req.userCtx, perms);
          });
        } else 
          showPendingChanges(req.userCtx, getPermissions(req));
      });
    } else {
      showPendingChanges(req.userCtx, getPermissions(req));
    }
  });

  function getPath(doc) {
    switch(doc.type) {
      case "section":
        return parentDoc.path.concat([sectionCount + 1])
    }
  }

  app.post("/api/delete/:id", function(req, res, next) {
    db.openDoc(req.params.id, function(err, doc) {
      var perms = getPermissions(req, doc);
      if ((perms[type] || {})["delete"]) {
        apiSave({_id: doc._id, _rev: doc._rev, _deleted: true}, res);
      }
    });
  });

  app.post("/api/queue/:parentId?", function(req, res, next) {
    db.openDoc(req.params.parentId, function(err, parent) {
      var doc = req.body;
      if (_.isArray(doc)) {
        if (doc.reduce(function(a, doc) {
          var perms = getPermissions(req, doc);
          return a && perms[doc.type][doc.type === parent.type ? "edit" : "add"];
        }, true)) {
          apiBulkSave(doc, res);
        }
      } else {
        var perms = getPermissions(req, doc);
        if (perms[doc.type][doc.type === parent.type ? "edit" : "add"]) {
          apiSave(doc, res);
        }
      }
    });
  });

  function deleteSubtree(path, cb) {
    db.view("tree_pending", {
      startkey: path,
      endkey: path.concat([{}]),
      reduce: false,
      include_docs: true
    }, function(err, results) {
      async.parallel(
        _.map(results.rows, function(row) {
          return function(cb) {
            db.saveDoc({
              _id: row.id,
              _rev: row.doc._rev,
              _deleted: true
            }, cb);
          };
        }),
        cb
      );
    });
  }

  app.post("/api/queue/:id/approve", function(req, res, next) {
    var doc = req.body;
    if (doc.path.length) {
      db.openDoc(_.last(doc.path), function(err, parentDoc) {
        var perms = getPermissions(req, parentDoc);
        approve(perms, doc, parentDoc);
      });
    } else {
      approve(getPermissions(req), doc);
    }
    function approve(perms, doc, parentDoc) {
      if (parentDoc && parentDoc.type === doc.type) { // TODO unify pblock and problem
        // Edit
        var deleteDoc = {
          _id: doc._id,
          _rev: doc._rev,
          _deleted: true
        };
        delete doc._id;
        delete doc._rev;
        delete doc.pending;
        delete doc.path;
        _.extend(parentDoc, doc);
        // Overwrite parent doc
        db.saveDoc(parentDoc, function(err, result) {
          // Delete pending doc
          apiSave(deleteDoc, res);
        });
      } else {
        // Addition
        delete doc.pending;
        apiSave(doc, res);
      }
    }
  });

  app.post("/api/queue/:id/reject", function(req, res, next) {
    db.openDoc(req.params.id, function(err, doc) {
      var perms = getPermissions(req);
      if (perms[doc.type].approve) {
        deleteSubtree(doc.path.concat([doc._id]), function(err, result) {
          res.send(result);
        });
      }
    });
  });

  function tree(node, nextPath) {
    var path = nextPath();

    var path = paths.shift();
    node.path = path;
    node.children = tree(function() {
      var path = nextPath();
      _.isEqual(childPath.slice(path))
      return [];
    });
  }
  
  // modify the roles for a problem list
  app.post("/api/:pl/roles", function(req, res, next) {
    getList(req.params.pl, null, function(err, pl) {
      // TODO: better way of getting id
      db.openDoc(pl._id, function(err, doc) {
        var perms = getPermissions(req, doc);
        if (!perms.list.edit) return next();
        doc.roles = req.body;
        apiSave(doc, res);
      });
    });
  });

  app.get("/api/screen-name/:id", function(req, res, next) {
    db.openDoc(req.params.id, function(err, doc) {
      res.send(doc.screen_name || doc.name || "");
    });
  });

  app.post("/api/archive/:pl/:version", function(req, res, next) {
    getList(req.params.pl, null, function(err, pl) {
      var perms = getPermissions(req, pl);
      if (err || !perms.list.archive) return next();
      var path = pl.path.concat([pl._id]);
      db.view("tree_pending", {
        startkey: path,
        endkey: path.concat([{}]),
        reduce: false,
        include_docs: true
      }, function(err, results) {
        if (err) return next();
        var nodes = {}, root = results.rows[0].id;
        _.each(results.rows, function(row) {
          if (row.doc.pending) return;
          var node = nodes[row.id] = {doc: row.doc, children: []};
          if (row.doc.path.length) {
            var parentNode = nodes[_.last(row.doc.path)];
            if (parentNode) parentNode.children.push(row.id);
          }
        });
        nodes[root].doc.version = req.params.version;
        var count = results.rows.length * 2;
        cloneNode(root, []);
        function cloneNode(id, path) {
          var node = nodes[id], doc = node.doc;
          if (doc.version && !/^0/.test(doc.version)) {
            var version = doc.version;
            delete doc.version;
            doc.archived = true;
            // Saved the "current" doc with archived flag.
            db.saveDoc(doc, function(err, data) {
              complete();
            });
            doc.version = version;
          }
          delete doc._id;
          delete doc._rev;
          doc.path = path;
          db.saveDoc(doc, function(err, data) {
            path = path.concat([data.id]);
            _.each(node.children, function(child) {
              cloneNode(child, path);
            });
            complete();
          });
        }
        function complete() {
          count--;
          if (count === 0) res.end();
        }
      });
    });
  });

  return getList;
}
