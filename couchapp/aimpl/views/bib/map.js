function(doc) {
  var r = /\\label{([^}]+)}/g;
  if (doc.type === "bib") {
    emit([doc.list_id, doc.pos, doc.title], {label: doc.title, number: doc.pos,
      url: "/" + encodeURIComponent(doc.list_id) + "/bib/#" + encodeURIComponent(doc.title)});
  } else if (doc.type === "problem") {
    var fields = ["intro", "body", "status"],
        pos = 1;
    fields.forEach(function(f) {
      var d = doc[f],
          m;
      while(m = r.exec(d)) {
        var label = m[1];
        emit([doc.list_id, pos, label], {label: label, number: doc.number, // + "." + pos,
          section: doc.path[doc.path.length - 1],
          url: "/" + encodeURIComponent(doc.list_id) + "//#" + encodeURIComponent(label)});
        pos++;
      }
      r.lastIndex = 0;
    });
  }
}
