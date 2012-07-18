function(keys, values, rereduce) {
  var items = [];
  for (var i=0; i<values.length; i++) {
    var v = values[i];
    items.push([v.path, v]);
  }
  // Sort by path
  items.sort(function(a, b) {
    return a[0] < b[0] ?
      -1 : a[0] === b[0] ?
        0 : 1;
  });
  return items[0][1];
}
