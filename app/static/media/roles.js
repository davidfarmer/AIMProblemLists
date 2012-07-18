var saveRoles = function(cb) {
  $.ajax({
    url: '/api/' + pl_id + '/roles',
    type: 'POST',
    contentType: 'application/json;charset=utf-8',
    data: JSON.stringify(userRoles),
    success: cb
  });
}

$(function() {
  var roles = ['admin', 'editor', 'priv'];
  var roleNames = {
    admin: 'Administrator',
    editor: 'Editor',
    priv: 'Privileged user'
  };

  var $userTable = $('#user-table');
  var $userSelect = $('#user-select');
  var $roleSelect = $('#role-select');
  _.each(roles.slice(1), function(role) {
    $('<option/>').attr('value', role).text(roleNames[role]).appendTo($roleSelect);
  });

  var $remove = $('<input type="button" class="remove" value="Remove"/>');

  var addUserRow = function(user, role) {
    var $tr = $('<tr/>').appendTo($userTable);
    $('<td/>').text(user.name).appendTo($tr);
    $('<td/>').text(roleNames[role]).appendTo($tr);
    $remove.clone().click(function() {
      if (userRoles[user.id]) delete userRoles[user.id];
      saveRoles(function() {
        $tr.remove();
      });
    }).appendTo($tr);
  }

  var usersById = {};

  /* Get a list of all users */
  _.each(users, function(user) {
    usersById[user.id] = user;
    $('<option/>')
      .attr('value', user.id)
      .text(user.name)
      .appendTo($userSelect);
  });

  // select all users with roles for this list i.e. editor-<id> and priv-<id>
  // -or- if current user is admin, then have a special page to select all admins

  $('input.add').click(function() {
    var id = $userSelect.val();
    var role = $roleSelect.val();
    $userSelect.find('option[value="' + id + '"]').remove();
    userRoles[id] = role;
    saveRoles(function() {
      addUserRow(usersById[id], role);
    });
  });

  _.each(userRoles, function(role, id) {
    addUserRow(usersById[id] || {id: id, name: "Unknown"}, role);
  });
});
