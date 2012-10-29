var http = require("http"),
    url = require("url"),
    bcrypt = require("bcrypt"),
    crypto = require("crypto"),
    child_process = require("child_process"),
    fs = require("fs"),
    path = require("path"),
    querystring = require("querystring"),
    mime = require("mime");

mime.define({ "font/opentype": ["otf"] });

var express = require("express"),
    connect = require("connect"),
    async = require("async"),
    _ = require("./static/media/underscore"),
    handlebars = require("hbs"),
    utils = require("./static/media/utils"),
    couchdb = require("./lib/couchdb"),
    permissions = require("./lib/permissions"),
    auth = require("./auth");

function compile(src) {
  return handlebars.compile(src);
}

var SECRET = require("./secrets").SECRET;

var MACROS = [
  "\\newcommand{\\Cat}{{\\rm Cat}}",
  "\\newcommand{\\A}{\\mathcal A}",
  "\\newcommand{\\freestar}{ \\framebox[7pt]{$\\star$} }",
  "\\newcommand{\\C}{\\mathbb C}",
  "\\newcommand{\\F}{\\mathbb F}",
  "\\newcommand{\\N}{\\mathbb N}",
  "\\newcommand{\\Q}{\\mathbb Q}",
  "\\newcommand{\\R}{\\mathbb R}",
  "\\newcommand{\\Z}{\\mathbb Z}",
  "\\newcommand{\\abs}[1]{\\lvert #1\\rvert}",
  "\\newcommand{\\A}{\\mathbb A}",
  "\\newcommand{\\P}{\\mathbb P}"
];
var MACROS_HTML = MACROS.map(function(m) { return "\\(" + m + "\\)"; }).join("\n");

var sys = require("util");

var db = new couchdb.CouchDB("aimpldb");

var templates = {
  latex: _.template(fs.readFileSync("views/latex.ejs", "utf8")),
  list: {
    edit: fs.readFileSync("views/list/edit.hbs", "utf8"),
    view: fs.readFileSync("views/list/view.hbs", "utf8"),
    view_item: fs.readFileSync("views/list/view_item.hbs", "utf8")
  },
  section: {
    edit: fs.readFileSync("views/section/edit.hbs", "utf8"),
    view: fs.readFileSync("views/section/view.hbs", "utf8"),
    view_item: fs.readFileSync("views/section/view_item.hbs", "utf8")
  },
  problem: {
    edit: fs.readFileSync("views/problem/edit.hbs", "utf8"),
    view: fs.readFileSync("views/problem/view.hbs", "utf8")
  },
  remark: {
    edit: fs.readFileSync("views/remark/edit.hbs", "utf8"),
    view: fs.readFileSync("views/remark/view.hbs", "utf8")
  },
  bib: {
    edit: fs.readFileSync("views/bib/edit.hbs", "utf8"),
    view: fs.readFileSync("views/bib/view.hbs", "utf8"),
    view_item: fs.readFileSync("views/bib/view_item.hbs", "utf8")
  },
  citeAs: compile(fs.readFileSync("views/cite.hbs", "utf8"))
};

/**
 * /api/<id>/sections/<id>/problems/<id>/remarks/<id>
 */

var app = module.exports = express.createServer();
auth = auth.setup(app, db, SECRET);
app.configure(function() {
  //app.enable("strict routing");
  app.set("view engine", "hbs");
  app.use(express.logger());
  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
  app.use(connect.cookieParser());
  app.use(connect.bodyParser());
  app.use(auth.cookieParser);
  app.use(express.static(__dirname + "/static", { maxAge: 1000 * 60 * 60 }));
  app.use(express.errorHandler({ dumpExceptions: true }));
});

app.configure("development", function() {
  app.use(express.errorHandler({ dumpExceptions: true }));
});

var getList = require("./api").setup(app, db);
var apiSave = require("./api").setup(app, db);

var showLogin = function(res) {
  res.writeHead(302, {Location: "/#login"});
  res.end();
}

/**
 * Retrieves a bibliography mapping.
 */
var bib = function(version, pl) {
  db.view("bib", {
    startkey: [version, pl, 1],
    endkey: [version, pl, 1, {}],
    success: function(resp) {
      var bibitems = {};
      _.each(resp.rows, function(row, i) {
        var key = row.key[2];
        bibitems[key] = i + 1;
      });
      var path = "";
      if (typeof sec_num === "undefined" && typeof isBib === "undefined") {
        path = pl_id + "/";
      }
      $("a.cite").each(function() {
        var keys = $(this).text().split(/\s*,\s*/g);
        var links = [];
        _.each(keys, function(key) {
          var i = bibitems[key];
          if (i) {
            var id = "#cite-" + i;
            links.push('<a href="' + path + 'bib' + id + '">' + i + '</a>');
          } else {
            links.push('<span title="Unknown reference: ' + escapeHTML(this) + '">?</span>');
          }
        });
        $(this).replaceWith(links.join(", "));
      });
    }
  });
}

var menu = function(name, path, cb) {
  db.view("tree", {
    startkey: path,
    endkey: path.concat([{}]),
    group_level: path.length + 1
  }, function(err, view) {
    if (!view.rows) return cb("no rows");
    var lis = view.rows.map(function(row, i) {
      if (row.value.type != "section") return "";
      return '<li><a href="/' + name + '/' + (i+1) + '">' + utils.escapeLaTeX(row.value.title) + '</a></li>'
    }).join("");
    cb(null, lis);
  });
};

var archives = function(pattern, cb) {
  _.each(["/:pl" + pattern, "/:pl/archives/:version" + pattern], function(pattern) {
    app.get(pattern, function(req, res, next) {
      var path = url.parse(req.url).pathname;
      if (path.substr(path.length - 1) !== "/") {
        res.redirect(301, path + "/");
      } else {
        getList(req.params.pl, req.params.version || null, function(err, pl) {
          if (err) return next();
          cb(pl, req, res, next);
        });
      }
    });
  });
};


// Tree paths: [<pl>, <version>, <0>, <secnum>, <problem number>, <remark number>]
//             [                 <1>, <bibnum>]
//
// Pending edits simply have `parent_id` linking to the parent object, no path
// needed although I guess they could be used as long as they're kept up to
// date. 
// Idea: use [false, ...] to denote unapproved changes?

auth.apps();

app.get("/", function(req, res) {
  db.view("pls_current", {
    include_docs: true
  }, function(err, data) {
    var pls = _.sortBy(_.select(data.rows, function(row) {
      var doc = row.doc,
          perms = permissions.getPermissions(req.userCtx, doc);
      if (doc.pending)
        return;
      if (doc.is_private)
        return perms.list.view;
      return true;
    }).map(function(d) { return d.doc; }), function(o) { return o.order });
    var allData = {};
    _.each(pls, function(pl) {
      allData[pl._id] = pl;
    });
    pls = pls.map(function(doc) {
      return utils.processLaTeX(doc);
    });
    var categories = _.sortBy(_.map(_.groupBy(pls, function(d) {
      return d.category || "Other";
    }), function(v, k) {
      return {name: k, pls: v.sort(function(a, b) { return a.order - b.order; })};
    }), function(d) { return d.name == "Other" ? "\uffff" : d.name; });
    var n = Math.ceil(categories.length / 2);
    var categories0 = categories.slice(0, n), categories1 = categories.slice(n);
    var currentPath = [];
    var listTemplates = {
      edit: templates.list.edit,
      view_item: templates.list.view_item
    };
    var perms = permissions.getPermissions(req.userCtx);

    res.render("index", {
      layout: "views/layout.hbs",
        title: "AIM Problem Lists",
        bodyclass: "index",
        perms: perms,
        perms_json: JSON.stringify(perms),
        userCtx: req.userCtx,
        templates: {
          list: JSON.stringify(listTemplates)
        },
        categories0: categories0,
        categories1: categories1,
        data: JSON.stringify(allData)
    });
  });
});

function order(o) {
  return o.order;
}

app.post("/:pl/bib.json", function(req, res, next) {
  getList(req.params.pl, null, function(err, pl) {
    if (err) return next();
    var keys = {};
    req.body.forEach(function(d) {
      var parts = d.split("/");
      if (parts.length > 1) keys[d] = 1;
      else keys[req.params.pl + "/" + d] = 1;
    });
    var sections = _.select(pl.children, function(o) { return o.type === "section" && !o.pending; });
    sections = _.sortBy(sections, order);
    db.view("bib", {}, function(err, view) {
      if (err || !view.rows) return next();
      var references = {};
      view.rows.forEach(function(d) {
        var sec_num = "";
        if (d.value.section) {
          sec_num = _.indexOf(sections.map(function(d) { return d._id; }), d.value.section) + 1;
        }
        if ((d.key[0] + "/" + d.key[2]) in keys) {
          references[(d.key[0] + "/" + d.key[2])] = {
            url: d.value.url.replace("//", "/" + sec_num + "/"),
            pos: sec_num + d.value.number
          };
        }
      })
      res.send(references);
    });
  });
});

archives("", function(pl, req, res, next) {
  var path = pl.path.concat(pl._id);
    var data = pl.children;
    var perms = permissions.getPermissions(req.userCtx, pl);
    if (pl.pending && !perms.list.approve ||
        pl.is_private && !perms.list.view) {
      return showLogin(res);
    }
    var allData = {};
    allData[pl._id] = _.clone(pl);
    delete allData[pl._id].children;
    delete allData[pl._id].versions;
    var sections = [];
    _.each(_.select(pl.children, function(o) { return o.type === "section" }), function(o) {
      if (o.pending && !perms.section.approve) return;
      if (!o.pending) sections.push(utils.processLaTeX(o));
      allData[o._id] = o;
    });
    sections = _.sortBy(sections, order);
    _.each(sections, function(o, i) {
      o.list_pos = i + 1;
      if (!o.title) o.title = "No title";
    });
    var url = "http://aimpl.org/" + pl.name;
    var sectionTemplates = {
      edit: templates.section.edit,
      view_item: templates.section.view_item
    };
    var viewTemplate = compile(templates.list.view);
    var menu = pl.menu;
    pl = utils.processLaTeX(pl);
    pl.menu = menu;
    var authors = [];
    _.each(pl.roles || {}, function(v, k) {
      var username = k.split(":");
      if (v === "editor" && username.length > 1 && username[1].length > 1) {
        authors.push('<span class="by-id">' + utils.escapeHTML(k) + '</span>');
      }
    });
    authors = authors.length ? authors.slice(0, -1).join(", ") +
          (authors.length > 2 ? "," : "") +
          (authors.length > 1 ? " and " + authors[authors.length-1] : authors[0])
        : null;
    res.render("toc", {
      layout: "views/layout.hbs",
      MACROS: MACROS_HTML,
      title: pl.title,
      perms: perms,
      perms_json: JSON.stringify(perms),
      userCtx: req.userCtx,
      breadcrumbs: [
        {url: "/", title: "AIM Problem Lists"},
        {title: pl.title}],
      menu: menu,
      citeAs: templates.citeAs({
        title: pl.title,
        url: url
      }),
      templates: {
        list: JSON.stringify(templates.list),
        section: JSON.stringify(sectionTemplates)
      },
      pl: pl,
      pl_render: viewTemplate(_.extend({authors: authors}, pl)),
      sections: sections,
      data: JSON.stringify(allData)
    });
});

archives("/bib", function(pl, req, res, next) {
  var path = pl.path.concat([pl._id]);
  var perms = permissions.getPermissions(req.userCtx, pl);
  if (pl.is_private && !perms.list.view) {
    return showLogin(res);
  }
  var allData = {};
  allData[pl._id] = pl;
  var render = compile(templates.bib.view_item);
  var items = _.select(pl.children, function(o) {
    return (o.type === "bibitem" || o.type === "bib" && !o.pending);
  }).map(function(o, i) {
    allData[o._id] = o;
    o.pos = i + 1;
    utils.processLaTeX(o);
    o.render = render(_.extend({perms: perms}, o));
    return o;
  });
  var url = "http://aimpl.org/" + pl.name;
  res.render("bib", {
    layout: "views/layout.hbs",
    title: pl.title,
    perms: perms,
    perms_json: JSON.stringify(perms),
    userCtx: req.userCtx,
    breadcrumbs: [
      {url: "/", title: "AIM Problem Lists"},
      {url: "../", title: pl.title},
      {title: "Bibliography"}],
    citeAs: templates.citeAs({
      title: pl.title,
      url: url
    }),
    menu: pl.menu,
    pl: pl,
    items: items,
    templates: {
      bib: JSON.stringify(templates.bib)
    },
    data: JSON.stringify(allData)
  });
});

archives("/pdf", function(pl, req, res, next) {
  refreshPDF(pl, function(err, path) {
    connect.middleware.static.send(req, res, next, {
      root: __dirname + "/pdfs",
      path: path
    });
  });
});

var excludePending = function(l) {
  return _.select(l, function(o) {
    return !o.value.pending;
  });
}

var renderLaTeX = function(pl, cb) {
  var path = pl.path.concat([pl._id]);
  db.view("tree", {
    startkey: path,
    endkey: path.concat([{}]),
    reduce: false
  }, function(err, data) {
    if (!data.rows || data.rows.length === 0) {
      return cb({error: "no data"});
    }
    var doc = data.rows[0].value;
    doc.sections = [];
    doc.bibitems = [];
    excludePending(data.rows.slice(1)).map(function(row) {
      switch (row.value.type) {
        case "section":
          if (doc.sections.length)
            doc.sections[doc.sections.length-1].problems = _.sortBy(
              doc.sections[doc.sections.length-1].problems, order);
          row.value.problems = [];
          doc.sections.push(row.value);
          break;
        case "remark":
          if (doc.sections.length) {
            var section = doc.sections[doc.sections.length-1];
            if (section.problems.length) {
              section.problems[section.problems.length-1].remarks.push(row.value);
            }
          }
          break;
        case "problem":
          row.value.remarks = [];
          if (doc.sections.length > 0)
            doc.sections[doc.sections.length-1].problems.push(row.value);
          break;
        case "bibitem":
          doc.bibitems.push(row.value);
          break;
      }
    });
    doc.sections = _.sortBy(doc.sections, order);
    cb(null, templates.latex({list: doc, MACROS: MACROS}));
  });
};

archives("/tex", function(pl, req, res, next) {
  res.contentType("application/x-tex");
  res.attachment(pl.name + ".tex");
  renderLaTeX(pl, function(err, latex) {
    res.send(latex);
  });
});

app.get("/:pl/roles", function(req, res, next) {
  async.parallel({
    pl: function(cb) {
      getList(req.params.pl, null, cb);
    },
    users: function(cb) {
      db.view("users", {}, cb);
    }
  }, function(err, results) {
    var pl = results.pl;
    var users = results.users.rows.map(function(row) {
      return {name: row.value.name, id: row.id};
    });
    var perms = permissions.getPermissions(req.userCtx, pl);
    res.render("roles", {
      layout: "views/layout.hbs",
      title: pl.title,
      pl: pl,
      menu: pl.menu,
      users: JSON.stringify(users),
      userRoles: JSON.stringify(pl.roles || {}),
      userCtx: req.userCtx,
      perms: perms,
      perms_json: JSON.stringify(perms)
    });
  });
});

archives("/:secnum", function(pl, req, res, next) {
  var sections = _.select(pl.children, function(o) { return o.type === "section" && !o.pending; });
  sections = _.sortBy(sections, order);
  var secnum = parseInt(req.params.secnum),
      section = sections[secnum-1];
  _.each(sections, function(o, i) {
    o.list_pos = i + 1;
  });
  sections.splice(secnum - 1, 1);
  if (!section) return next();
  var path = pl.path.concat([pl._id, section._id]);
  async.parallel({
    section: function(cb) {
      db.view("tree", {
        startkey: path,
        endkey: path.concat([{}]),
        skip: 1,
        reduce: false
      }, cb);
    }
  }, function(err, results) {
    if (err) return next();
    var data = results.section;
    var perms = permissions.getPermissions(req.userCtx, pl);
    if (pl.is_private && !perms.list.view) {
      return showLogin(res);
    }
    var allData = {};
    allData[section._id] = section;
    var problems = [];
    _.each(excludePending(data.rows), function(row, num) {
      var r = row.value;
      allData[r._id] = r;
      r = utils.processLaTeX(r);
      switch (r.type) {
        case "problem":
          if (r.tag) {
            r.tag = {
              "problem": "Problem",
              "prob": "Problem",
              "rhequivalence": "RH Equivalence",
              "rhequiv": "RH Equivalence",
              "conjecture": "Conjecture"
            }[r.tag] || "Problem";
          } else {
            r.tag = "Problem";
          }
          r.number = "." + (r.number ? r.number.split(".")[1] : "1");
          r.by = r.by || null;
          r.by_id = !r.by_id || r.by_id == "custom" ? null : r.by_id;
          r.intro = r.intro || null;
          r.status = r.status || null;
          r.render = compile(templates.problem.view)(_.extend({perms: perms, sec_num: secnum}, r));
          r.remarks = [];
          problems.push(r);
          break;
        case "remark":
          if (problems.length) {
            r.by = r.by || null;
            r.by_id = !r.by_id || r.by_id == "custom" ? null : r.by_id;
            var render = compile(templates.remark.view)(_.extend({perms: perms}, r));
            problems[problems.length-1].remarks.push(
              {_id: r._id, by_id: r.by_id, by: r.by,
                render: render, order: r.order});
          }
          break;
      }
    });
    problems = _.sortBy(problems, order);
    _.each(problems, function(p) {
      p.remarks = _.sortBy(p.remarks, order);
    });
    var url = "http://aimpl.org/" + pl.name;
    res.render("section", {
      layout: "views/layout.hbs",
      MACROS: MACROS_HTML,
      pl: pl,
      title: pl.title,
      breadcrumbs: [
        {url: "/", title: "AIM Problem Lists"},
        {url: "../", title: utils.escapeLaTeX(pl.title)},
        {title: utils.escapeLaTeX(section.title)}],
      citeAs: templates.citeAs({
        title: pl.title,
        url: url
      }),
      menu: pl.menu,
      templates: {
        section: JSON.stringify(templates.section),
        problem: JSON.stringify({
          edit: templates.problem.edit,
          view: templates.problem.view,
          view_item: templates.problem.view
        }),
        remark: JSON.stringify({
          edit: templates.remark.edit,
          view: templates.remark.view,
          view_item: templates.remark.view
        })
      },
      perms: perms,
      perms_json: JSON.stringify(perms),
      userCtx: req.userCtx,
      sec: utils.processLaTeX(section),
      sec_num: secnum,
      problems: problems,
      sections: sections,
      data: JSON.stringify(allData)
    });
  });
});

/*
app.get("/users", function(req, res, next) {
  view("/_users/_all_docs", {
    //startkey: [null, req.params.pl, 0, parseInt(req.params.secnum)],
    //endkey: [null, req.params.pl, 0, parseInt(req.params.secnum), {}],
    include_docs: true
  }, function(data) {
  });
});
*/

app.put("/api/users/:id", function(req, res, next) {
  openDoc({db: "_users", id: "org.couchdb.user:" + req.params.id}, function(err, data) {
    data.roles = req.body.roles;
    saveDoc(path, data, function(err, data) {
      res.send("{}");
    });
  });
});

var refreshPDF = function(pl, cb) {
  var pdfDirectory = __dirname + "/pdfs";
  renderLaTeX(pl, function(err, data) {
    if (err) return cb(err);
    // Write to .tex file
    var texFilename = pl._id + ".tex", pdfFilename = pl._id + ".pdf";
    fs.writeFile(path.join(pdfDirectory, texFilename), data, function(err) {
      var pdflatex = child_process.spawn("pdflatex", [
        "-interaction", "nonstopmode", texFilename
      ], {cwd: pdfDirectory});
      pdflatex.on('exit', function(code) {
        cb(null, pdfFilename);
      });
    });
  });
}

// Mass add a group of people and make them editors/privileged users
app.get("/_addusers", function(req, res) {
  res.render("addusers", {
    layout: "views/addusers.hbs",
    title: "AIM Problem Lists",
    userCtx: req.userCtx,
  });
});

// get uploaded file, parse the file for users and permissions,
// add new users, and give users permissions for specific problem list
app.post("/_addusers", function(req, res) {
  // get and rename file
  fs.rename(req.files.datafile.path, "/tmp/newusers", function(err) {
    if (err) {
      fs.unlink("/tmp/newusers");
      fs.rename(req.files.datafile.path, "/tmp/newusers");
    }
  });

  fs.readFile("/tmp/newusers", "utf8", function(err, data) {
    if (err) {
      res.render("addusers", {
        layout: "views/addusers.hbs",
        title: "AIM Problem Lists",
        userCtx: req.userCtx,
        error: "Could not open file. " + err,
      });
    } else {
      // Parse the file using newlines and semicolons
      var lines = data.split("\n");
      var new_users = new Array();
     
      // data layout: Name;email;pw;problemList;privilege
      for (var i=0; i<lines.length-1; i++) {
        var splt = lines[i].split(";");
        new_users[i] = {
          name: splt[0],
          email: splt[1],
          pw: splt[2],
          problst: splt[3],
          priv: splt[4]
        };
      }
      
      // array for messages from add_user and give_perms
      var addUserMsg = [];
      var givePermMsg = [];

      // Add users to database, async
      function add_user(elem, cb) {
          bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(elem["pw"], salt, function(err, hash) {
              var email = elem["email"],
                user = {
                _id: "org.aimpl.user:" + email,
                type: "user",
                name: email,
                screen_name: elem["name"] || "Anonymous",
                password: hash
              };
              db.saveDoc(user, function(err, results) {
                if (results.error) {
                  addUserMsg.push(user["name"] + " is already registered.");
                  cb(null);
                }
                else {addUserMsg.push("Added " + user["name"]); cb(null);}
              });
            });
          }); 
      }

      // Give the users privileges requested
      // put in dictionary['org.aimpl.user:email@addr.com'] = 'editor'
      // the end is editor, priv, or admin
      function give_perms(elem, cb) {
        getList(elem["problst"], null, function(err, pl) {
          db.openDoc(pl._id, function(err, doc) {
            if (err) cb(msg + '\n' + "Error getting the Problem List: " + elem["problst"] + " Error: " + err);
            else {
              var user_id = "org.aimpl.user:" + elem["email"];
              doc.roles[user_id] = elem["priv"];
              db.saveDoc(doc, function(err, results) {
                if (err) cb(err);
                else {
                  givePermMsg.push(user_id + " now has permissions: " + elem["priv"] + " on problem list: " + elem["problst"]);
                  cb(null);
                }
              });
            }
          });
        });
      }

      // complete add_user and give_perms in series
      async.forEachSeries(new_users, add_user, function(err, msg) {
        if (err) console.log(err);
        else {
          async.forEachSeries(new_users, give_perms, function(err, msg) {
            if (err) {
              res.render("addusers", {
                layout: "views/addusers.hbs",
                title: "AIM Problem Lists",
                error: "Could not give permissions.",
              });
            }
            else {
              res.render("addusers", {
                layout: "views/addusers.hbs",
                title: "AIM Problem Lists",
                addTitle: "New Users:",
                addUser: addUserMsg,
                giveTitle: "Set Permissions:",
                givePerm: givePermMsg,
              });
            }
          });
        }
      });
    }
  });
  
});

if (!module.parent) {
  app.listen(8888, "127.0.0.1");
}
