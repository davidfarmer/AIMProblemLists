/**
 * Map roles to actual permissions.
 *
 * This will mainly rely on checking whether the user is a problem list editor
 * (role editor-<pl_id>) or privileged user (role priv-<pl_id>).
 * 
 * If we ever need more fine-grained permissions i.e. on a per-problem or
 * remark basis, we will potentially have to push this information into the
 * objects themselves that need editing, to prevent the userCtx object from
 * becoming too unwieldy.
 */
(function(exports) {
  exports.getPermissions = function(userCtx, obj) {
    if (obj && obj.version) {
      return {list: {}, bib: {}, section: {}, problem: {}, remark: {}};
    }
    userCtx = userCtx || {name: null, roles: []};
    if (obj && obj.roles) userCtx.roles = userCtx.roles.concat(obj.roles);
    var hasRole = function(role) {
      return userCtx.roles.indexOf(role) !== -1 || (obj ? (obj.roles || {}) : {})[userCtx.id] === role;
    }
    var isUser = userCtx.name !== null;
    var all = {edit: true, add: true, del: true};
    var perms = {
      problem: {},
      section: {},
      bib: {},
      remark: {},
      comment: {}
    };
    var list_id = obj ?
          obj.type === "list" ? obj._id : obj.list_id
          : null;
    // TODO: set editor, priv to false if list_id is undefined
    var admin = hasRole("admin") || hasRole("_admin"),
        editor = admin || hasRole("editor"),
        priv = editor || hasRole("priv"),
        reg = priv || userCtx.name != null,
        anon = reg || true;
    // TODO: view permission should depend on doc.is_private ideally
    perms.list =         {edit: editor, add: admin, "delete": admin, addComment: false, archive: editor, view: priv, approve: editor};
    perms.bib =          {add: priv, edit: priv, "delete": priv, approve: editor};
    perms.section =      {add: editor, edit: editor, "delete": editor, addComment: false, approve: editor};
    perms.problem =      {add: priv, edit: priv, "delete": editor, approve: editor, addComment: false};
    perms.remark =       {add: true, edit: editor, "delete": editor, approve: editor};
    return perms;
  };

  var showLogin = function(context) {
    send(Handlebars.compile(templates.layout.head)(context));
    send(Handlebars.compile(templates.login)(context));
    return Handlebars.compile(templates.layout.footer)(context);
  }
})(exports);
