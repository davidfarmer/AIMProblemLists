import re

def parse_aimpl(tex):
    doc, rest = nest("document", tex)
    return {
        'intro': intro(doc),
        'title': title(doc),
        'sections': sections(doc),
    }

def title(tex):
    # \title{} may include further tags. Ruby's Regex engine doesn't do
    # recursive matches (which isn't "regular anyway"). We fake things by
    # first matching the line \title{} is on and then match the contents
    # of `{}` greedily
    rst_line = re.compile(r"^\\title(.*)", re.MULTILINE)
    line = rst_line.search(tex)
    if line and line.group(1):
        rst_title = re.compile(r"\{(.*)\}")
        title = rst_title.search(line.group(1))
        return title and title.group(1)
    else:
        raise Exception(r"Couldn't find \title{}")

def intro(doc):
    sects = split("section", doc, False)
    front = sects.pop(0)
    return split("maketitle", front, False).pop()

def sections(doc):
    sects = split("section", doc)
    sects.pop(0)
    return [section(s) for s in sects]

def section(tex):
    # puts "\nsection"
    # puts '-'*80    
    # puts tex
    parts = split("begin", tex)
    rst = re.compile(r"\\section\{(.*?)\}(.*)", re.MULTILINE | re.DOTALL)
    # puts rst.inspect
    m = rst.match(parts[0])
    intro = m[2]
    s = {
        'title': field("section", tex),
        'author': field("by", tex),
        'problemblocks': problemblocks(tex),
    }
    # puts s[:title]
    if intro:
        s['intro'] = intro
    # s[:intro] = parts[0]
    return s

def problemblocks(tex):
    blocks = []
    beg = next_tag("begin", tex)
    # puts "beg? *(problem|block) \"#{beg}\""
    if beg in ("problem", "rhequivalence", "conjecture"):
        block, rest = nest("problem", tex)
        blocks << simpleproblemblock(block)
    elif beg and tex.length > 1:
        block, rest = nest("problemblock", tex)
        pb = problemblock(block)
        if pb:
            blocks.append(pb)
    if rest:
        blocks.append(problemblocks(rest))
    return sum(blocks, []) # flatten

def problemblock(text):
    if not text:
        return None
    # puts
    # puts "problemblock"
    # puts 'P'*50
    # puts text
    m = re.compile(r'(.*)\\begin\{problem\}', re.MULTILINE | re.DOTALL).match(text)
    if m:
        intro = m[1]
    else:
        intro = text
    x = {
        'intro': intro,
    }
    probs = list("problem", text)
    x['problems'] = parse_probs(probs)
    comments = list("comment", text)
    x['comments'] = [{'remark': c} for c in comments]
    return x

def parse_probs(probs):
    for prob in probs:
        yield {
            'body': prob,
            'by': field("by", prob), # Nitin: to be consistent this needs to be author or the authors need to become \by
        }

def simpleproblemblock(text):
    # puts
    #     puts "simpleproblemblock"
    #     puts 'PS'*25
    #     puts text
    return {
        'problems': parse_probs([text]),
    }

def list(name, tex):
    items = []
    while tex:
        block, tex = nest(name, tex)
        if block:
            items.append(block)
    return items

def next_tag(tname, tex):
    rst = Regexp.new("\\\\#{Regexp.escape(tname)}\{(.*)\}")
    m = rst.match(tex)
    return m[1]

# find the next nested section by that name
# return it and the rest
def nest(name, tex):  # nitin: this is the engine that does recursive decent parsing of blocks, sections etc
    rst = re.compile(r"\\begin\{%s\}(.*?)\\end\{%s\}(.*?)" % (
        re.escape(name), re.escape(name)), re.MULTILINE | re.DOTALL)
    # puts rst.inspect
    m = rst.search(tex)
    # m.to_a.each_with_index do |d,i| 
    #   puts ("m#{i}")*20
    #   puts "name #{name}"
    #   puts d
    # end
    if not m:
        return
    found = m.group(1)
    rest = m.group(2)
    if rest == "" or rest.squeeze == " ":
        rest = None
    return found, rest

def field(name, tex):
    # FIXME: nested tags make this fail. e.g.: \emph{foo \emph{bar} baz}
    rst = re.compile(r"\\%s\{(.*?)\}" % re.escape(name))
    m = rst.match(tex)
    return m[1]

def split(name, tex, keep=True):
    rst = re.compile(r"^\\%s" % re.escape(name))
    splitted = rst.split(tex)
    if keep:
        return ['\\%s%s' % (name, st) for st in splitted]
    return splitted
