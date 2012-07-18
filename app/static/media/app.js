(function(exports) {
  // Placeholder as we move to data-binding as a basis for re-rendering.
  function renderMenu() {
    var sections = [];
    // Retrieve latest section data.
    for (var id in allData) {
      var doc = allData[id];
      if (doc.type !== "section") continue;
      sections.push(doc);
    }
    sections = _.sortBy(sections, function(d) { return d.order; });
    var $list = $("ol.sectionlist").empty();
    _.each(sections, function(o, index) {
      if (o.type != 'section' || o.pending) return '';
      $list.append('<li><a href="' + (++index) + '/">' + escapeLaTeX(o.title || "No title") + '</a>');
    });
  }

  function renderMath(target) {
    if (typeof MathJax === 'undefined') return;
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, target]);
    citations();
    refreshNames(target);
  }

  function trim(s) {
    return s.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
  }

  function refreshNames(target) {
    var names = [];
    $('span.by-id', target).each(function() {
      var $el = $(this);
      names.push(function(cb) {
        fetchName($el.text(), $el, cb);
      });
    });
    async.parallel(names, function(err, result) {
      // Sort alphabetically by last name...
      result.sort(function(a, b) { return a.split(" ").pop() < b.split(" ").pop() ? -1 : 1; });
      d3.select("h3.editors").selectAll(".by-id").text(function(d, i) { return result[i]; });
    });
  }

  function log() {
    if (typeof console !== 'undefined' && console.log)
      console.log(arguments);
  }

  function render(doc, template, $target) {
    doc = processLaTeX(doc);
    doc = _.defaults({perms: perms}, doc);
    if (doc.type === "problem") {
      doc.by = doc.by || null;
      doc.by_id = (!doc.by_id || doc.by_id == "custom") ? null : doc.by_id;
      doc.sec_num = sec_num;
      if (doc.tag) {
        doc.tag = {
          'problem': 'Problem',
          'prob': 'Problem',
          'rhequivalence': 'RH Equivalence',
          'rhequiv': 'RH Equivalence',
          'conjecture': 'Conjecture'
        }[doc.tag] || 'Problem';
      } else {
        doc.tag = 'Problem';
      }
    }
    $target.append(compileTemplate(template)(doc));
    renderMath($target[0]);
  }

  function approveReject(model, type, el, isAdd) {
    var id = _.last(model.attributes.path);
    var url = '/api/queue/' + model.id + '/' + type;
    if (isAdd) {
      model.attributes.order = $('.editable[data-id="' + id + '"] .children').eq(0).find("li").size() + 1;
      model.attributes.list_pos = model.attributes.order;
    }
    $.ajax({
      url: url,
      type: 'POST',
      data: JSON.stringify(model.attributes),
      dataType: 'json',
      contentType: 'application/json',
      success: function(data) {
        model.attributes._rev = data._rev;
        model.collection.remove(model);
        if (type === 'approve') {
          if (!isAdd) model.attributes._id = id;
          var $target = !isAdd
            ? $('.editable[data-id="' + id + '"] .render').eq(0).empty()
            : $('<li/>').attr("data-id", model.id).attr("class", model.attributes.type).appendTo($('.editable[data-id="' + id + '"] .children').eq(0));
          delete model.attributes.pending;
          allData[isAdd ? model.id : id] = model.attributes;
          // Reset numbers
          if (model.attributes.type === "section") {
            renderMenu();
          }
          if (model.attributes.type === "problem") {
            var data = [];
            $target.parents(".sortable").eq(0).children('li').each(function() {
              data.push($(this).data('id'));
            });
            setOrder(data);
            if (isAdd) {
              $target.append('<div class="probc editable" data-id="'+model.id+'" data-type="' + model.attributes.type + '"><div class="render"></div><div style="clear: right"></div> <div class="children"> </div> <ul class="pending-additions"></ul> <ul class="pending-changes"></ul> <div style="clear: right"></div> </div>');
              var el = $('.editable', $target);
              var queue = changes[model.id] = new ChangeList();
              queue.url = '/api/queue/' + model.id;
              var view = new ChangeListView(queue);
              view.type = model.attributes.type;
              view.el = el;
              $target = $target.find(".render");
            }
            render(model.attributes, templates[model.attributes.type][isAdd ? "view_item" : "view"], $target);
          } else {
            if (isAdd) {
              var queue = changes[model.id] = new ChangeList();
              queue.url = '/api/queue/' + model.id;
              var view = new ChangeListView(queue);
              view.type = model.attributes.type;
              $target.append('<div class="probc editable" data-id="'+model.id+'" data-type="' + model.attributes.type + '"><div class="render"></div><ul class="pending-changes"></ul></div>');
              view.el = $target.find(".editable");
              $target = $target.find(".render");
            }
            render(model.attributes, templates[model.attributes.type][isAdd ? "view_item" : "view"], $target);
          }
        }
      }
    });
  }

  function remove(id, cb) {
    var url = '/api/delete/' + id;
    $.ajax({
      url: url,
      type: 'POST',
      data: "{}",
      dataType: 'json',
      contentType: 'application/json',
      success: function(data) {
        cb(data);
      }
    });
  }

  var Change = Backbone.Model.extend({
    idAttribute: '_id',
    initialize: function() {
      _.bindAll(this, 'approve', 'reject');
    },
    approve: function(el, isAdd) {
      approveReject(this, 'approve', el, isAdd);
    },
    reject: function(el, isAdd) {
      approveReject(this, 'reject', el, isAdd);
    }
  });

  var ChangeList = Backbone.Collection.extend({
    model: Change
  });

  var ChangeView = Backbone.View.extend({
    tagName: 'li',
    initialize: function() {
      _.bindAll(this, 'render', 'destroy');
      this.model.bind('remove', this.destroy);
      this.model.bind('all', this.render);
    },
    render: function() {
      var view = this;
      var model = this.model;
      var canApprove = perms[model.attributes.type].approve;
      if (canApprove || this.model.attributes.userId == userId) {
        var $target = $(this.el).empty();
        render(model.attributes, templates[model.attributes.type][view.isAdd ? "view_item" : "view"], $target);
        if (canApprove) {
          var $approve = $('<input type="button" value="Accept">')
            .click(function() {
              model.approve($(view.el).parents('.editable'), view.isAdd);
            });
          var $reject = $('<input type="button" value="Reject">')
            .click(function() {
              model.reject($(view.el).parents('.editable'), view.isAdd);
            });
          var $edit = $('<input type="button" value="Edit">')
            .click(function() {
              var path = model.attributes.path;
              var data = _.clone(model.attributes);
              delete data._id;
              var obj = new Change(data);
              showEdit($(this), obj, path[path.length - 1], model.attributes.type, function() {
                model.reject($(view.el).parents('.editable'), view.isAdd);
                obj.approve($(view.el).parents('.editable'), view.isAdd);
              });
            });
          var $who = $("<span/>");
          var $buttons = $('<div/>').append($approve).append($reject).append($edit).append("&nbsp;&nbsp;&nbsp;").append($who);
          if (model.attributes.userId) fetchName(model.attributes.userId, $who);
          $target.append($buttons);
        }
      } else {
        $(view.el).empty().append('<div class="embargo">Thank you for your contribution, it will be reviewed by an editor before appearing in the public version.</div>');
      }
      return this;
    },
    destroy: function() {
      $(this.el).empty().remove();
    }
  });

  function fetchName(id, el, cb) {
    $.ajax({
      url: "/api/screen-name/" + id,
      success: function(name) {
        el.text(name || "Anonymous");
        if (cb) cb(null, trim(name || "Anonymous"));
      }
    });
  }

  var ChangeListView = Backbone.View.extend({
    tagName: 'ul',
    className: 'pending-changes',
    initialize: function(changes) {
      this.changes = changes;
      _.bindAll(this, 'addOne', 'addAll', 'render');
      changes.bind('add', this.addOne);
      changes.bind('refresh', this.addAll);
      changes.bind('all', this.render);
      changes.fetch();
    },
    addOne: function(change) {
      var view = new ChangeView({model: change});
      view.isAdd = this.type !== change.attributes.type;
      $(this.el).children(view.isAdd ? '.pending-additions' : '.pending-changes').append(view.render().el);
    },
    addAll: function() {
      this.changes.each(this.addOne);
    }
  });

  var changes = {};

  $(function() {
    $('.editable').each(function() {
      var el = $(this), id = el.data('id'), type = el.data('type');
      var queue = changes[id] = new ChangeList();
      queue.url = '/api/queue/' + id;
      var view = new ChangeListView(queue);
      view.type = type;
      view.el = $(this);
    });
    refreshNames();
  });

  // Some abstractions
  var compileTemplate = Handlebars.compile;

  function toAttrs(f) {
    var o = {};
    _.each(f.filter(".blur").serializeArray(), function(i) {
      o[i.name] = "";
    });
    _.each(f.not(".blur").serializeArray(), function(i) {
      o[i.name] = i.value;
    });
    _.each(f.filter('[type=checkbox]'), function(i) {
      i = $(i);
      if (!i.is(':checked')) o[i.attr('name')] = false;
    });
    return o;
  }

  function renderEditForm(data, type, cb) {
    if (data.by == "") data.by = null;
    if (data.by_id == "") data.by_id = null;
    data.tag_select = {conjecture: data.tag === "conjecture"};
    if (type === "problem") {
      data.sec_num = sec_num;
      data.number = data.number ? "." + data.number.split(".")[1] : null;
    }
    var t = compileTemplate(templates[type].edit);
    var form = $(t(data));
    form.find('input.save').click(function() {
      var attrs = toAttrs(form.find('*:input'));
      if (attrs.by && attrs.by.length === 32) {
        $.ajax({
          url: "http://www.jasondavies.com/peopledevdb/_design/aimpeople/_show/doc/" + attrs.by,
          success: function(doc) {
            attrs.by_name = doc ? doc.name : null;
            cb(attrs);
          },
          dataType: 'jsonp'
        });
      } else cb(attrs);
    });
    form.find("*:input").hint();
    return form;
  }

  function getData(id, type) {
    var data = allData[id] || {path: [], type: 'list'}; // Latter shouldn't happen
    if (data.type !== type) {
      return {type: type, path: data.path.concat([id]), pending: true, list_id: typeof pl_id !== "undefined" ? pl_id : null};
    }
    data = _.clone(data);
    data.pending = true;
    data.path = data.path.concat([id]);
    if (data._id) delete data._id;
    return data;
  }

  function showEdit(el, obj, id, type, cb) {
    var el0 = el;
    var form = renderEditForm(_.extend(_.clone(obj.attributes), {userId: userId}), type, function(data) {
      changes[id].add(obj);
      obj.save(data, {
        success: function(resp) {
          allData[resp.id] = _.extend(obj.attributes, data);
          form.remove();
          if (cb) cb();
        }
      });
    });
    if (el.parents('.edit-delete').size()) el = el.parents('.edit-delete').parent();
    else {
      if (type == "section") el = $("#section-form");
      else if (type == "list") el = $("#edit-form");
      else el = $("#new-form");
    }
    if (type === "remark") el = el.parent();
    el.after(form);
  }

  $(function() {
    $('a.edit').live("click", function() {
      var el = $(this),
          id = el.data('id'),
          type = el.data('type');
      var obj = new Change(getData(id, type));
      showEdit(el, obj, id, type);
      return false;
    });

    $('a.delete').live("click", function() {
      var el = $(this),
          id = el.data('id'),
          type = el.data('type');
      if (confirm("Are you sure you want to delete this " + type + "?")) {
        remove(id, function() {
          delete allData[id];
          var parent = el.parents(".sortable").eq(0);
          var item = el.parent().parent().remove();
          var data = [];
          parent.find('li').each(function() {
            data.push($(this).data('id'));
          });
          setOrder(data);
        });
      }
      return false;
    });

    $('a.archiveproblemlist').click(function() {
      var version = window.prompt('Please enter a version number.');
      $.ajax({
        url: '/api/archive/' + pl_id + '/' + version,
        type: 'POST',
        success: function() {
          location.href = ['', pl_id, 'archives', version].join('/');
        }
      });
      return false;
    });

    $('input.cancel-edit').live('click', function() {
      $(this).parents('div.edit').remove();
    });

    // If editor, show: 1. unapproved changes to problems/remarks and 2. new
    // problems/remarks by unprivileged users
    // Do by problem list first, may want to filter by section
    // Making an unapproved change must by definition create a new doc
    // The main places we need this are:
    // 1. Problem list detail (edits to problem list intro, authors etc.)
    // 2. Section detail (edits to: section intro, individual problems, remarks)
    // 3. Bibliography detail (edits to individual bibitems)
    //
    // Making any edit (even for privileged users) involves manually copying an
    // existing doc (can't use COPY due to race condition) and populating the
    // changed fields.  The copy will also *not* have an "approved" flag until an
    // editor approves the change. Approving a change should overwrite the
    // original doc so as to preserve the ID, and delete the pending change.
    // We can then either retrieve a full list of all unapproved changes *or*
    // retrieve pending changes inline with each section
  });

  // Move admin links to left-hand side.
  if ($("#admin").text().replace(/\s+/g, "")) {
    $('#admin').appendTo("#nav").show();
  }

  // Auto-scroll admin.
  /*
  $(function() {  
    var $nav = $("#nav");
    if (!$nav.size()) return;

    var offset = $nav.offset().top;

    var $window = $(window).scroll(function() { 
      var scrollTop = $window.scrollTop();
      if (offset<scrollTop+20) {
        $nav.addClass('fixed')
            .css("top", "12px")
            .css("left", -($window.scrollLeft() - 8) + "px");
      } else {
        $nav.removeClass('fixed').css('top', 0);
      }
    });
  });
  */

  // Citations
  function citations() {
    var mr_re = /^MR(\d+)$/,
        arxiv_re = /^arXiv:(.+)$/i;
    var references = {};
    $("a.cite").each(function() {
      references[$(this).text()] = 1;
    });
    // Lookup
    $.ajax({
      url: ["", pl_id, "bib.json"].join("/"),
      type: "POST",
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(d3.keys(references)),
      success: function(references) {
        $("a.cite").each(function() {
          var t = $(this).text();
          var ref = references[t] || references[pl_id + "/" + t];
          if (!ref) {
            // Try matching MR.
            ref = t.match(mr_re);
            if (ref) ref = {url: "http://www.ams.org/mathscinet-getitem?mr=" + ref[1], pos: t};
          }
          if (!ref) {
            // Try matching arXiv.
            ref = t.match(arxiv_re);
            if (ref) ref = {url: "http://front.math.ucdavis.edu/" + ref[1], pos: t};
          }
          if (!ref) return;
          $(this).attr("href", ref.url).text(ref.pos);
        });
      }
    });
  }

  // Moves a problem to a section.
  function moveProblem(id, sectionId, cb) {
    var url = '/api/queue/' + id,
        docs = [];
    // Find the problem and its children.
    for (var k in allData) {
      var doc = allData[k],
          i = _.indexOf(doc.path, id) - 1;
      if (doc._id === id) i = doc.path.length - 1;
      if (i >= 0) {
        doc.path[i] = sectionId;
        docs.push(doc);
      }
    }
    $.ajax({
      url: url,
      type: 'POST',
      data: JSON.stringify(docs),
      dataType: 'json',
      contentType: 'application/json',
      success: function(data) {
        alert("Moved successfully.");
        cb();
      }
    });
  }

  citations();

  $('a.move').boxy({
    hideShrink: false,
    closeable: true,
    closeText: "cancel",
    afterShow: function() {
      var id = $(this.options.actuator).data("id"),
          boxy = this.boxy;
      $('#move a')
          .unbind('click')
          .click(function() {
            moveProblem(id, $(this).data("id"), function() {
              boxy.hide();
              $('li[data-id="' + id + '"]').remove();
            });
            return false;
          });
    }
  });

  exports.render = render;
  exports.renderMenu = renderMenu;
})(typeof exports !== 'undefined' ? exports : window);
