function(doc) {
  if (doc.path) {
    emit(doc.path.concat([doc._id]), doc);
  }
}
