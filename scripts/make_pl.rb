#!/usr/bin/env ruby1.9
# -*- coding: utf-8 -*-
require File.expand_path("../tex_to_json", __FILE__)
require File.expand_path("../jtex_to_couch", __FILE__)

#DB = CouchRest.database!("http://127.0.0.1:5984/aimpl")

if ARGV.first
  filename = ARGV.first
  @tex = TexToJSON.new(open(filename).read)
  puts JSON.pretty_generate(@tex.parse_aimpl)
  #@json = JSON.parse(@tex.parse_aimpl.to_json)
  #@ttc = JTexToCouch.new(@json)
  #pl = @ttc.create_list!
  exit 0
else
  puts "Missing filename" 
  exit -1
end
