function(doc) {
  if (doc.type === "list") {
    emit([doc.name, doc.version], {title: doc.title});
  }
};
