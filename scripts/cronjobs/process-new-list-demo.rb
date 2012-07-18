require 'uuid'
require 'rubygems'
require 'couchrest'
File.expand_path("../tex_to_json", __FILE__)
File.expand_path("../jtex_to_couch", __FILE__)

DB = CouchRest.database("http://127.0.0.1:5984/aimpl-demo")

newlist = DB.get("_design/aimpl")

if newlist["is_new"]
  # find the attachment

  name, attachment = newlist["_attachments"].first
  tex = DB.fetch_attachment(newlist, name)

  # do dat par sing
  jtex = TexToJSON.new(tex)
  json = JSON.parse(jtex.parse_aimpl.to_json)

  # feed into couch
  jtech_to_couch = JTexToCouch.new(json)
  jtech_to_couch.create_list!

  # set is_new: true
  newlist["is_new"] = false
  DB.save_doc(newlist)

  # remove attachment
  newlist.delete_attachment(name)
end

