#!/usr/bin/python

import os
import subprocess
import time
import sys
import urllib
import uuid
try:
    import simplejson as json
except ImportError:
    import json
from couchdbkit import Database, Consumer
from couchdbkit.resource import ResourceNotFound

def generate_pdf(db):
    def f(line):
        for pl in db.view('aimpl/pls'):
            pl_name = pl['id']
            tex = db.server.res.get(urllib.quote('/'.join([db.dbname, '_design', 'aimpl', '_list', 'tex', 'pl_full'])),
                startkey=[pl_name], endkey=[pl_name, {}], include_docs=True, headers={'Accept': '*/*'})
            data = tex.body
            try:
                doc = db['pdfs']
            except ResourceNotFound:
                doc = {}
                db['pdfs'] = doc
            pdfname = pl_name
            jobname = uuid.uuid4().hex
            f = open('/tmp/%s.tex' % jobname, 'w+')
            f.write(data)
            f.close()
            try:
                for i in range(2):
                    p = subprocess.Popen([
                        'pdflatex',
                        '-output-directory', '/tmp',
                        '-interaction', 'nonstopmode',
                        '-jobname', jobname,
                        '/tmp/%s.tex' % jobname,
                    ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                    p.communicate()
                filename = '/tmp/%s.pdf' % jobname
                data = open(filename).read()
                db.put_attachment(doc, data, name=pdfname, content_type='application/pdf')
            except IOError:
                pass
    return f

if __name__ == '__main__':
    while True:
        db = Database(sys.argv[1])
        c = Consumer(db)
        last_seq = c.wait_once()['last_seq']
        c.register_callback(generate_pdf(db))
        c.wait(filter='aimpl/pl', since=last_seq, heartbeat=True)
        time.sleep(5)
