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
var getPermissions = function(userCtx, obj) {
  var hasRole = function(role) {
    return userCtx.roles.indexOf(role) !== -1;
  }
  var isUser = userCtx.name !== null;
  var all = {edit: true, add: true, del: true};
  var perms = {
    problem: {},
    section: {},
    bibliography: {},
    remark: {},
    comment: {}
  };
  var list_id = obj ?
        obj.type === 'list' ? obj._id : obj.list_id
        : null;
  /*if (hasRole('admin') || hasRole('_admin')) {
    perms.problem = all;
    perms.section = all;
    perms.section = all;
  }*/
  // TODO: set editor, priv to false if list_id is undefined
  var admin = hasRole('admin') || hasRole('_admin'),
      editor = admin || hasRole('editor-' + list_id),
      priv = editor || hasRole('priv-' + list_id),
      reg = priv || userCtx.name != null,
      anon = reg || true;
  // TODO: view permission should depend on doc.is_private ideally
  perms.problemList = {edit: editor, add: admin, 'delete': admin, addComment: false, archive: editor, view: priv};
  if (list_id) {
    perms.editProblemList    = perms.addProblemList || hasRole('editor-' + list_id);
    perms.archiveProblemList = perms.editProblemList;
    perms.addSection         = perms.editProblemList || hasRole('priv-' + list_id);
    perms.viewPrivateProblemList = perms.addSection;
    perms.editSection        = perms.addSection;
    perms.editBibliography   = perms.editSection;
    perms.addProblem         = isUser;
    perms.editProblem        = perms.addProblem;
    perms.addRemark          = perms.editProblem;
    perms.addComment         = false;
    perms.bibliography = {add: priv, edit: priv, 'delete': priv};
    perms.section =      {addComment: false};
    perms.problem =      {addComment: false, edit: priv, approve: editor};
    perms.remark =       {add: true};
  }
  perms.json = toJSON(perms);
  return perms;
};

var showLogin = function(context) {
  send(Handlebars.compile(templates.layout.head)(context));
  send(Handlebars.compile(templates.login)(context));
  return Handlebars.compile(templates.layout.footer)(context);
}
