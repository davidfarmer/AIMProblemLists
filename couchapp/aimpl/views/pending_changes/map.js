function(doc) {
  // "original_id" refers to the object that this doc has changed *or*, if the
  // type is different, it means it's an addition.  Deletions are like an edit
  // but with _deleted=true.  Maybe additions should be handled differently.
  if (doc.pending) {
    emit([doc.path[doc.path.length-1]], null); // may want to order by date/time
  }
  // So we can have something like:
  // [section intro]
  // [list of edits to section intro]
  // [list of *additions* to section intro]
  // [list of problems]
  // [list of *changes* to problems (inline)]
  // [list of *deletions* to problems (inline)]
}
