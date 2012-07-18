require 'rubygems'
require 'couchrest'
require 'cgi'
require File.expand_path("../tex_to_json", __FILE__)

class JTexToCouch
  def initialize j
    @j = j
  end
  def create_list!(publish=false)
    lid = uuid()
    list = {
      "type" => "list",
      "_id" => @j["name"],
      "version" => @j["version"],
      "title" => @j["title"],
      "intro" => @j["intro"],
      "name" => @j["name"],
      "author" => @j["author"]
    }
    section_ids = sections(@j, list)
    list["section_ids"] = section_ids
    begin
      olddoc = DB.get(@j["name"])
      docs = []
      sections = DB.documents(:keys => olddoc["section_ids"], :include_docs => true)["rows"]
      sections.each do |sec|
        sec["doc"]["_deleted"] = true
        docs << sec["doc"]
        pblocks = DB.documents(:keys => sec["doc"]["pblock_ids"], :include_docs => true)["rows"]
        pblocks.each do |pblock|
          puts pblock["doc"]
          pblock["doc"]["_deleted"] = true
          docs << pblock["doc"]
        end
      end
      
      DB.bulk_save(docs)
      
      list["_rev"] = olddoc["_rev"]
      DB.save_doc(list)
      
      if olddoc["version"] != @j["version"]
        remarks = DB.view("aimpl/remarks")
        remarks.each do |remark|
          remark["_deleted"] = true
          docs << remark['value']
        end
        
        make_revision(list)
      end
    
    
    rescue
      DB.save_doc(list)
      make_revision(list)

    end
  end
  private
  
  def make_revision(list)
    docid = list['_id'] + "/v" + list['version']
    DB.copy_doc(list, docid)
    new_list = DB.get(docid)
    new_list['name'] = docid
    section_ids = sections(@j, new_list)
    new_list["section_ids"] = section_ids
    DB.save_doc(new_list)
  end
  
  def sections j, list
    ss = []
    j["sections"].each_with_index do |stex, pos|
      # make a section doc
      ss << section_doc(stex, list, pos + 1)
    end
    ss
  end
  def section_doc stex, list, pos
    sid = uuid()
    # make pbs
    sdoc = {
      "type" => "section",
      "_id" => sid,
      "list_id" => list["_id"],
      "list_name" => list["name"],
      "pl_title" => list["title"],
      "list_pos" => pos,
      "title" => stex["title"],
      "intro" => stex["intro"],
      "author" => stex["author"]
    }
    sdoc["pblock_ids"] = pb_docs(sdoc, stex)
    DB.save_doc(sdoc, true)
    sid
  end
  def pb_docs sdoc, stex
    pbids = []
    if !stex["problemblocks"]
      puts "fail"*33
      puts sdoc
    end
    stex["problemblocks"].each_with_index do |pb, pos|
      unless pb
        puts "missing pb #{pos}"
        puts stex.to_json
        next
      end
      pbid = uuid()
      pb_doc = {
        "type" => "pblock",
        "_id" => pbid,
        "list_id" => sdoc["list_id"],
        "list_name" => sdoc["list_name"],
        "list_pos" => sdoc["list_pos"],
        "section_id" => sdoc["_id"],
        "sec_pos" => pos,
        "name" => pb["name"],
        "problem_tag" => "#{pb["probtag"]} #{sdoc["list_pos"]}.#{pos+1}", # Chris: there was a request to hard-code problem tags, here they are, but not used in the templates yet.
        "remarks" => pb["comments"] || [],
        "distremark" => pb["distremark"],
        "problem" => pb["problems"] && pb["problems"][0], # Nitin: in future this should be an array rather than just the first
        "intro" => pb["intro"]
      }
      DB.save_doc(pb_doc, true)
      pbids << pbid
    end
    pbids
  end
  
  def uuid()
    DB.server.next_uuid
  end

end
