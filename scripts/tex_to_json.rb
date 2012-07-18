class TexToJSON
  def initialize string
    # open the file
    @tex = string
  end
  def parse_aimpl
    doc, rest = nest("document", @tex)
    aimpl = {
      :intro => intro(doc),
      :title => title(doc),
      :sections => sections(doc),
      :name => urlstub(doc),
      :version => version(doc)
    }

    aimpl
  end
  private

  def title tex
    # \title{} may include further tags. Ruby's Regex engine doesn't do
    # recursive matches (which isn't "regular anyway"). We fake things by
    # first matching the line \title{} is on and then match the contents
    # of `{}` greedily
    rst_line = Regexp.new("^\\\\title(.*)")
    line = tex.match(rst_line)
    if line && line[1]
      rst_title = Regexp.new("\{(.*)\}")
      title = line[1].match(rst_title)
      title && title[1]
    else
      throw new Exception("Couldn't find \\title{}")
    end
  end
  
  def version tex
    rst_line = Regexp.new("^\\\\plversion(.*)")
    line = tex.match(rst_line)
    if line && line[1]
      rst_version = Regexp.new("\{(.*)\}")
      version = line[1].match(rst_version)
      version && version[1]
    else
      version = "1.0"
      version
    end
  end

  def urlstub tex
    rst_line = Regexp.new("^\\\\urlstub(.*)")
    line = tex.match(rst_line)
    if line && line[1]
      rst_title = Regexp.new("\{(.*)\}")
      title = line[1].match(rst_title)
      title && title[1]
    else
      throw new Exception("Couldn't find \\urlstub{}")
    end
  end

  def intro doc
    sects = split("section", doc, false)
    front = sects.shift
    split("maketitle", front, false).pop
  end

  def sections doc
    sects = split("section", doc)
    sects.shift
    sects.collect{|s|section(s)}
  end

  def section(tex)
    # puts "\nsection"
    # puts '-'*80    
    # puts tex
    parts = split("begin{problemblock}", tex)
    rst = Regexp.new("\\\\section\{(.*?)\}(.*)", Regexp::MULTILINE)
    # puts rst.inspect
    m = parts[0].match(rst)
    intro = m && m[2]
    s = {
      :title => field("section", tex),
      :author => field("by", tex),
      :problemblocks => problemblocks(tex)
    }
    # puts s[:title]
    s[:intro] = intro if intro
    # s[:intro] = parts[0]
    s
  end

  def problemblocks tex
    blocks = []
    beg = next_tag("begin", tex)
    # puts "beg? *(problem|block) \"#{beg}\""
    if beg == "problem" || beg == "rhequivalence" || beg == "conjecture" || beg == "rhapproach"
      block, rest = nest(beg, tex)
      probtag = beg
      if probtag == "rhequivalence"
        probtag = "RH Equivalence"
      end
      blocks << simpleproblemblock(block, probtag)
    elsif beg && tex.length > 1
        block, rest = nest("problemblock", tex)
        pb = problemblock(block)
        blocks << pb if pb
    end
    blocks << problemblocks(rest) if rest
    blocks.flatten
  end

  def problemblock text
    return nil unless text
    # puts
    # puts "problemblock"
    # puts 'P'*50
    # puts text
    m = text.match(/(.*)\\begin\{(problem|rhequivalence|conjecture|rhapproach)\}(\[[^\]]+\])?/m)
    probtag = "Problem"
    if m
      intro = m[1]
      name = m[2]
      probtag = name
      if probtag == "rhequivalence"
        probtag = "RH Equivalence"
      end
    else
      intro = text
      name = "problem"
    end
    x = {}
    m = intro.match(/\\name\{([^\}]+)\}/)
    if m
      x[:name] = m[1]
      intro = intro.sub(/\\name\{[^\}]+\}/, "")
    end
    probs = list(name, text)
    x[:intro] = intro
    x[:problems] = parse_probs(probs)
    x[:probtag] = probtag
    comments = list("remark", text)
    distremark, rest = nest("distinguishedremark", text)
    if distremark
      x[:distremark] = distremark
    end
    x[:comments] = comments.map{|c|{:remark => remove_field("by", c), :by => field("by", c)}}
    x
  end

  def parse_probs(probs)
    probs.collect do |prob|      
      {
        :body => remove_field("by", prob).sub(/\s*\[[^\]]+\]/, ""),
        :by => field("by", prob) # Nitin: to be consistent this needs to be author or the authors need to become \by
      }
    end
  end

  def simpleproblemblock text, probtag
    # puts
    #     puts "simpleproblemblock"
    #     puts 'PS'*25
    #     puts text
    [{
      :problems => parse_probs([text]),
      :probtag => probtag
    }]
  end

  def list name, tex
    items = []
    while tex do
      block, tex = nest(name, tex)
      items << block if block
    end
    items
  end

  def next_tag(tname, tex)
    rst = Regexp.new("\\\\#{Regexp.escape(tname)}\{(.*)\}")
    m = tex.match(rst)
    m && m[1]
  end

  # find the next nested section by that name
  # return it and the rest
  def nest(name, tex)  # nitin: this is the engine that does recursive decent parsing of blocks, sections etc
    rname = Regexp.escape(name)
    rst = Regexp.new("\\\\begin\{#{rname}\}(.*?)\\\\end\{#{rname}\}(.*)?", Regexp::MULTILINE)
    # puts rst.inspect
    m = tex.match(rst)
    # m.to_a.each_with_index do |d,i| 
    #   puts ("m#{i}")*20
    #   puts "name #{name}"
    #   puts d
    # end
    return nil unless m
    found = m[1]
    rest = m[2]
    rest = nil if (rest == "" || rest.squeeze == " ")
    [found, rest]
  end

  def remove_field(name, tex)
    return nil unless tex
    rst = Regexp.new("\\\\#{Regexp.escape(name)}\{(.*?)\}")
    tex.sub(rst, "")
  end

  def field(name, tex)
    # FIXME: nested tags make this fail. e.g.: \emph{foo \emph{bar} baz}
    return nil unless tex
    rst = Regexp.new("\\\\#{Regexp.escape(name)}\{(.*?)\}")
    m = tex.match(rst)
    m && m[1]
  end

  def split(name, tex, keep=true)
    rst = Regexp.new("^\\\\#{Regexp.escape(name)}")
    splitted = tex.split(rst)
    if keep
      splitted.map{|st|'\\'+name+st}
    else
      splitted
    end
  end
end
