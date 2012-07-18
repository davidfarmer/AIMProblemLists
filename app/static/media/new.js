var aimpl = {};

function entries(data) {
  var item = d3.select("#content").selectAll("div")
      .data(data);
  item.enter().append("div");
  item.exit().remove();
  item.call(aimpl.object);
}

function menu(items) {
  var item = d3.select("#menu").selectAll("li")
      .data(items);
  item.enter().append("li").append("a");
  item.exit().remove();
  item.attr("href", function(d) { return d.url; })
      .text(function(d) { return d.name; });
}

aimpl.init = function(data) {
  // takes CouchDB rows and initialises display
  var page = aimpl.page();

  data.forEach(function(d) {
    var o = page.add(aimpl.object.type[d.type]).fromJSON(d);
    // fade in?
  });
};

aimpl.page = function() {
  var objects = [];
  var content = document.getElementById("content");

  function page() {}

  page.add = function(type) {
    var o = type(page).on("save", save);
    objects.push(o);
    content.appendChild(o.node());
    return o;
  };

  function save() {
    var object = this;
    var d = object.toJSON();
    objects.some(function(o) {
      o.fromJSON(d);
    });
  }

  return page;
};

aimpl.object = function(page) {
  var object = {};
  var div = document.createElement("div");

  var event = d3.dispatch(
    "serialize",
    "deserialize",
    "save"
  );

  object.fromJSON = function(x) {
    event.deserialize.dispatch.call(object, x);
  };

  object.toJSON = function() {
    var x = {};
    event.serialize.dispatch.call(object, x);
    return x;
  };

  object.save = function() {
    event.save.dispatch.call(object);
    return object;
  };

  object.node = function() {
    return div;
  };

  object.transition = function() {
    return d3.select(div);
  };

  object.on = function(type, listener) {
    event[type].add(listener);
    return object;
  };

  return object;
};

aimpl.object.type = {};

aimpl.object.type.remark = function() {
};

aimpl.object.type.problem = function(page) {
  var mode = "view";
  var data = {};

  var problem = aimpl.object(page)
        .on("serialize", serialize)
        .on("deserialize", deserialize);

  var div = d3.select(problem.node());

  var heading,
      introduction;

  render();

  function render() {
    if (mode == "edit") {
      heading = div.append("input").attr("type", "text");
      introduction = div.append("textarea");
      div.append("input").attr("type", "button").attr("value", "Save").on("click", function() {
        mode = "view";
        div.html("");
        render();
        problem.save();
      });
    } else {
      div.append("h2").attr("class", "heading");
      div.append("p").attr("class", "introduction");
      div.append("p").append("a").attr("href", "javascript:void()").text("Edit").on("click", function() {
        mode = "edit";
        div.html("");
        render();
        problem.fromJSON(data);
        d3.event.preventDefault();
      });
    }
  }

  function serialize(json) {
    json.type = "problem";
    json.heading = heading.property("value");
    json.intro = introduction.property("value");
  }

  function deserialize(json) {
    data = json;
    if (mode == "edit") {
      heading.property("value", json.heading || "");
      introduction.property("value", json.intro || "");
    } else {
      var transition = problem.transition();

      transition.select(".heading").html(L(data.heading));
      transition.select(".introduction").html(L(data.intro));
    }
  }

  return problem;
};

aimpl.object.type.section = function() {
};

aimpl.object.type.list = function() {
};

aimpl.init([{type: "problem", heading: "test heading", intro: ""}]);

function L(s) {
  return s;
}
