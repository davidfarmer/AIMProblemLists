(function(exports) {
  var http = require('http'),
      querystring = require('querystring');
  var sys = require('util');

  var targetHost = '127.0.0.1', targetPort = 5984;

  var CouchDB = exports.CouchDB = function(name, credentials) {
    this.name = name;
    this.credentials = credentials;
  };

  CouchDB.prototype.saveDoc = function(doc, cb) {
    var path = '/' + encodeURIComponent(this.name);
    if (doc._id)
      path += '/' + encodeURIComponent(doc._id);
    var headers = {
      'Content-Type': 'application/json',
    };
    if (this.credentials)
      headers.Authorization = 'Basic ' + new Buffer(this.credentials).toString('base64');
    var req = http.request({
      method: doc._id ? 'PUT' : 'POST',
      path: path,
      host: targetHost,
      port: targetPort,
      headers: headers
    }, function(res) {
      var data = [];
      res.setEncoding('utf8');
      res.on('data', function(chunk) {
        data.push(chunk);
      });
      res.on('end', function() {
        data = data.join('');
        if (data) cb(null, JSON.parse(data));
      });
    });
    req.write(JSON.stringify(doc));
    req.end();
  };

  CouchDB.prototype.openDoc = function(id, cb) {
    var req = http.request({
      path: '/' + encodeURIComponent(this.name) + '/' + encodeURIComponent(id),
      host: targetHost,
      port: targetPort
    }, function(res) {
      var data = [];
      res.setEncoding('utf8');
      res.on('data', function(chunk) {
        data.push(chunk);
      });
      res.on('end', function() {
        data = data.join('');
        if (data) cb(null, JSON.parse(data));
      });
    });
    req.end();
  }

  CouchDB.prototype.view = function(name, params, cb) {
    for (var k in params) {
      params[k] = JSON.stringify(params[k]);
    }
    var qs = querystring.stringify(params);
    var url = /\//.test(name) ? name + '?' + qs :
      '/aimpldb/_design/aimpl/_view/' + name + '?' + qs;
    var req = http.request({
      method: 'GET',
      path: url,
      host: targetHost,
      port: targetPort
    }, function(res) {
      var data = [];
      res.setEncoding('utf8');
      res.on('data', function(chunk) {
        data.push(chunk);
      });
      res.on('end', function() {
        data = data.join('');
        if (data) cb(null, JSON.parse(data));
      });
    });
    req.end();
  };
})(exports);
