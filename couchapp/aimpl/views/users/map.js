function(doc) {
  if (doc.type === 'user') {
    emit(doc.name, {name: doc.name, password: doc.password, roles: doc.roles});
  }
}
