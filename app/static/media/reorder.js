$(function() {
  function log() {
    if (typeof console !== "undefined") console.log(arguments);
  }
  $('.sortable').sortable({
    disabled: true,
    items: 'li',
    connectWith: ['.category'],
    handle: '.render:first',
    update: function(event, ui) {
      var data = [];
      var that = this;
      log(event.target);
      $(event.target).children().each(function() {
        data.push($(this).data('id'));
      });
      setOrder(data, function() {
        alert('Order saved');
        var category = $(event.target).data("category");
        var id = ui.item.data("id");
        var doc = allData[id];
        if (category !== doc.category) {
          doc.category = category;
          var url = '/api/queue/';
          $.ajax({
            url: url,
            type: 'POST',
            data: JSON.stringify(doc),
            dataType: 'json',
            contentType: 'application/json',
            success: function(data) {
              doc._rev = data._rev;
              alert("Category saved.");
            }
          });
        }
      });
    }
  });
  $("a.reorder").click(function() {
    if ($(this).data("on")) {
      $(this)
          .data("on", false)
          .text("Enable reordering");
      $(".sortable")
          .sortable("disable")
          .css('cursor', null);
    } else {
      $(this)
          .data("on", true)
          .text("Disable reordering");
      $(".sortable")
          .sortable("enable")
          .css('cursor', 'move');
    }
    return false;
  });
});

function setOrder(data, cb) {
  // Perform renumbering.
  var docs = [];
  var archived = [];
  _.each(data, function(d, i) {
    var doc = allData[d];
    if (!doc) return;
    doc.order = i;
    docs.push(doc);
    if (doc.archived) archived.push(doc);
  });
  archived = _.sortBy(archived, function(d) { return d.number; });
  var indexes = [];
  for (var i=0; i<docs.length; i++) {
    if (docs[i].archived) {
      docs[i] = archived.shift();
      indexes.push(i);
    }
  }
  var lastIndex = -1;
  var lastNumber = 0;
  _.each(indexes, function(i) {
    var n = getNumber(docs[i]);
    var f = (n - lastNumber) / (i - lastIndex);
    f = Math.min(1, Math.max(
      Math.pow(10, Math.floor(Math.log(f) / Math.LN10)),
      Math.pow(10, Math.floor(Math.log(f * 2) / Math.LN10)) / 2,
      Math.pow(10, Math.floor(Math.log(f * 5) / Math.LN10)) / 5
    ));
    var p = Math.ceil(Math.log(i - lastIndex) / Math.LN10) + 1;
    for (var j=lastIndex+1; j<i; j++) {
      docs[j].number = "." + digits(lastNumber += f, p);
    }
    lastIndex = i;
    lastNumber = n;
  });
  var i = docs.length;
  var n = 10;
  var f = (n - lastNumber) / (i - lastIndex);
  f = Math.min(1, Math.max(
    Math.pow(10, Math.floor(Math.log(f) / Math.LN10)),
    Math.pow(10, Math.floor(Math.log(f * 2) / Math.LN10)) / 2,
    Math.pow(10, Math.floor(Math.log(f * 5) / Math.LN10)) / 5
  ));
  var p = 2;
  for (var j=lastIndex+1; j<i; j++) {
    docs[j].number = "." + digits(lastNumber += f, p);
  }
  if (docs[0].type == "section") renderMenu();
  _.each(docs, function(d) {
    var $target = $('[data-id="' + d._id + '"]');
    if ($target.find("span.pos").text(d.order + 1).size() > 0) {
      $target.find("a").each(function() {
        $(this).attr("href", $(this).attr("href").replace(/^\d+\/$/, (d.order + 1) + "/"));
      });
    }
    $target.find("span.number").text((typeof sec_num !== "undefined" ? sec_num : "") + d.number);
  });
  function getNumber(d) {
    return d.number ? parseInt(d.number.split(".")[1]) : 1;
  }
  function pow2(n) {
    return Math.pow(2, Math.ceil(Math.log(n) / Math.LN2));
  }
  function digits(x, p) {
    if (p) x = x.toPrecision(x < 1 ? p - 1 : p);
    return String(x).replace(".", "").replace(/0+$/, "");
  }
  $.ajax({
    url: '/api/queue/0',
    type: 'POST',
    dataType: 'json',
    contentType: 'application/json',
    data: JSON.stringify(docs),
    success: function(resp) {
      _.each(resp, function(row, i) {
        docs[i]._rev = row._rev;
      });
      if (cb) cb();
    }
  });
}
