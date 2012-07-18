import tex_to_json
from jtex_to_couch import *

import os
from couchdb import Database
try:
    import json
except ImportError:
    import simplejson as json

db = Database("http://127.0.0.1:5986/aimpl")

fixture_path = os.path.join(os.path.dirname(__file__), "../resources/examples/")

for file in os.listdir(fixture_path):
    if not file.endswith('.tex'):
        continue
    print "pls:", file
    data = open(os.path.join(fixture_path, file)).read().decode('utf-8')
    parsed = tex_to_json.parse_aimpl(data)
    ttc = JTexToCouch(db, parsed)
    pl = ttc.create_list()
