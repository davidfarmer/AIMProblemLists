<div>
  <div style="display: none">
    <%= MACROS %>
  </div>

  <% if (perms.section.edit) { %><p><a class="edit" data-id="<%= section._id %>" data-type="section" href="#">Edit section</a><% } %>
  {{#perms/problem/add}}<p><a class="edit" data-id="{{ sec/_id }}" data-type="problem" href="#">Add new problem</a></p>{{/perms/problem/add}}
  {{#perms/section/addComment}}<p class="comments"><a class="addcomment" href="#">Add comment</a></p>{{/perms/section/addComment}}
  <div class="content-main editable" data-id="{{ sec/_id }}" data-type="section">
    <div class="render">
      <h2 class="section-title">{{sec_num}}. {{sec/title}}</h2>
      {{{ sec/intro }}}
    </div>
    <ul class="pending-changes"></ul>

    <ol class="{{#perms/section/edit}}sortable {{/perms/section/edit}}nonumbers children">
      {{#problems}}
        <li data-id="{{_id}}" class="problem">
          {{#../perms/problem/edit}}<a data-id="{{_id}}" data-type="problem" class="edit" href="#">Edit this problem</a>{{/../perms/problem/edit}}
          <div class="comments">
            {{#../perms/problem/addComment}}<a class="addcomment" href="#">Add comment</a>{{/../perms/problem/addComment}}
          </div>
          <div class="probc content-main editable" data-id="{{_id}}" data-type="problem">
            <div class="render">
              {{{ render }}}
            </div>
            <div style="clear: right"></div>

            {{#../perms/remark/add}}<a class="edit" data-id="{{_id}}" data-type="remark" href="#">Add remark</a>{{/../perms/remark/add}}
            <div class="content-main editable children">
              {{#remarks}}
                {{{ this }}}
              {{/remarks}}
            </div>
            <ul class="pending-additions"></ul>
            <ul class="pending-changes"></ul>
            <div style="clear: right"></div>
          </div>
        </li>
      {{/problems}}
    </ol>
    <ul class="pending-additions"></ul>
  </div>
  {{#perms/problem/add}}<p><a class="edit" data-id="{{ sec/_id }}" data-type="problem" href="#">Add new problem</a></p>{{/perms/problem/add}}
  <div id="problem-new"></div>
  <p>Cite this as: <em>{{{ citeAs }}}</em></p>
</div>
<script>
  var pl_id = "{{ sec/list_id }}";
  var pl_name = "{{ sec/list_name }}";
  var sec_num = "{{ sec_num }}";
  var sec_id = "{{ sec/_id }}";
  
  var matches = window.location.toString().match(/^[^#]*(#.+)$/);
  if (!matches) {
    var current_location = window.location.pathname.split("/");
    var probtag = current_location[current_location.length-1];
    if (probtag.split(".").length > 1) {
      window.location = window.location.toString() + "#" + probtag;
    }
  }
  var templates = typeof templates !== 'undefined' ? templates : {};
  templates.section = {{{ templates/section }}};
  templates.problem = {{{ templates/problem }}};
  templates.remark = {{{ templates/remark }}};
  var allData = {{{ data }}};
</script>
