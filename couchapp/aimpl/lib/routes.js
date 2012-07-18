var paths = {};
paths.boxy = assetPath('jquery.boxy.js');
paths.boxyCss = assetPath('style', 'boxy.css');
paths.json2 = assetPath('json2.js');
paths.jQuery = assetPath('jquery.js');
paths.jQueryCouch = assetPath('jquery.couch.js');
paths.jQueryForm = assetPath('jquery.form.js');
paths.jQueryUI = assetPath('jquery-ui-1.8.custom.min.js');
paths.reorder = assetPath('reorder.js');
paths.upload = assetPath('upload.js');
paths.jqModal = assetPath('jqModal.js');
paths.parser = assetPath('parser.js');
paths.handlebars = assetPath('handlebars.js');
paths.MathJax = 'http://aimath.org/mathjax/MathJax.js';
paths.appJS = assetPath('app.js');
paths.utils = assetPath('utils.js');
paths.sha1 = assetPath('sha1.js');
paths.jqModalcss = assetPath('jqModal.css');
paths.css = assetPath('style','main.css');
paths.cssOverride = '/aimpl/css/override.css';
paths.couchApp = assetPath('vendor','couchapp','jquery.couchapp.js');
paths.basePath = assetPath('');
paths.bib = assetPath('bib.js');
paths.roles = assetPath('roles.js');
paths.underscore = assetPath('underscore.js');

var indexPath = req.headers['X-Aimpl-Indexpath'];
if (indexPath && typeof indexPath != "undefined") {
  paths.index = indexPath;
} else {
  paths.index = "/"
}

var appPaths = {
  pl_with_sections : function(id) {
    if (indexPath && typeof indexPath != "undefined")
      return indexPath + ["", id].join('/');
    
    return rewritePath([id]);
  },
  pl_with_sec_view : function(id) {
    
    return viewPath("pl_with_sections", {
      startkey:[id], 
      endkey:[id,{}], 
      include_docs:true
    });
  },
  section_with_pblocks : function(list_id, list_pos) {
    if (indexPath && typeof indexPath != "undefined")
        return indexPath + ["",list_id,".",list_pos].join('/');
      
    return rewritePath([list_id ,list_pos]);
    
  },
  
  pblock : function(id) {
    return showPath("pblock", id);
  }
};
