from tex_to_json import *
from uuid import uuid4
try:
    import json
except ImportError:
    import simplejson as json

class JTexToCouch(object):
    def __init__(self, db, j):
        self.db, self.j = db, j

    def create_list(self, publish=False):
        j = self.j
        list = {
            "type": "list",
            "_id": publish and j["title"].lower().gsub(r' ', "-") or self.uuid(),
            "title": j["title"],
            "intro": j["intro"],
            "author": j.get("author"),
        }
        section_ids = self.sections(j, list)
        list["section_ids"] = section_ids
        self.db[list['_id']] = list

    def sections(self, j, list):
        ss = []
        for pos, stex in enumerate(j["sections"]):
          # make a section doc
            ss.append(section_doc(stex, list, pos + 1))
        return ss

    def section_doc(stex, list, pos):
        sid = self.uuid()
        # make pbs
        sdoc = {
            "type": "section",
            "_id": sid,
            "list_id": list["_id"],
            "pl_title": list["title"],
            "list_pos": pos,
            "title": stex["title"],
            "intro": stex["intro"],
            "author": stex["author"],
        }
        sdoc["pblock_ids"] = pb_docs(sdoc, stex)
        DB.save_doc(sdoc, true)
        return sid

    def pb_docs(sdoc, stex):
        pbids = []
        if not stex["problemblocks"]:
            print "fail"*33
            print sdoc
        for pb, pos in stex["problemblocks"].each_with_index():
            if not pb:
                print "missing pb #{pos}"
                print json.dumps(stex)
                continue
            pbid = self.uuid()
            pb_doc = {
                "type": "pblock",
                "_id": pbid,
                "list_id": sdoc["list_id"],
                "list_pos": sdoc["list_pos"],
                "section_id": sdoc["_id"],
                "sec_pos": pos,
                "problem_tag": "Problem %s.%s" % (sdoc['list_pos'], pos+1), # Chris: there was a request to hard-code problem tags, here they are, but not used in the templates yet.
                "remarks": pb["comments"] or [],
                "problem": pb["problems"][0], # Nitin: in future this should be an array rather than just the first
                "intro": pb["intro"],
            }
            self.db.save_doc(pb_doc, true)
            pbids.append(pbid)
        return pbids
  
    def uuid(self):
        return uuid4().hex
