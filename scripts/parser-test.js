var fs = require('fs'),
    sys = require('sys');
    parser = require('./couchapp/aimpl/_attachments/parser');

var data = fs.readFileSync('resources/sample/braidgroupsX.tex');
var o = parser.parse(data);
sys.puts(JSON.stringify(o, null, 2));
