function(doc) {
  if (doc.type === "list" && doc.version == null) {
    emit(doc.name, {title: doc.title});
  }
};
