require File.expand_path("../tex_to_json", __FILE__)
require File.expand_path("../jtex_to_couch", __FILE__)

DB = CouchRest.database!("http://127.0.0.1:5984/aimpl")

@fixture_path = File.expand_path("../../resources/final/", __FILE__)

Dir[@fixture_path+"/*.tex"].each do |file|
  puts "pls: #{file}"
  @tex = TexToJSON.new(open(file).read)
  @json = JSON.parse(@tex.parse_aimpl.to_json)
  @ttc = JTexToCouch.new(@json)
  pl = @ttc.create_list!  
end
