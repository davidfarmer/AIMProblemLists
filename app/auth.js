var bcrypt = require("bcrypt"),
    crypto = require("crypto"),
    key = "auth",
    TIMEOUT = 10 * 60 * 1000;

exports.setup = function(app, db, secret) {
  return {
    apps: setup,
    cookieParser: auth
  };

  function authCookie(userCtx, salt) {
    var hmac = crypto.createHmac("sha1", secret + salt);
    userCtx.time = +new Date;
    hmac.update(userCtx.name + "|" + userCtx.time);
    userCtx.hash = hmac.digest("base64");
    return key + "=" + new Buffer(JSON.stringify(userCtx), "utf8").toString("base64").replace("+", "-").replace("/", "_").replace("=", "") + ";path=/";
  }

  function auth(req, res, next) {
    try {
      var cookie = req.cookies[key] || "",
          data = new Buffer(cookie.replace("-", "+").replace("_", "/"), "base64").toString(),
          json = data ? JSON.parse(data) : {name: "admin", roles: []},
          salt = "",
          hmac = crypto.createHmac("sha1", secret + salt);
      hmac.update(json.name + "|" + json.time);
      var expected = hmac.digest("base64");
      if (json.hash === expected && json.time > +new Date - TIMEOUT) {
        req.userCtx = json;
        if (!req.userCtx.roles) req.userCtx.roles = [];
        res.setHeader("Set-Cookie", authCookie(json, salt));
      }
    } catch (e) {
      console.log("auth parse error", e, data, cookie, req.cookies[key]);
    }
    next();
  }

  function setup() {
    app.post("/login", function(req, res) {
      db.view("users", {
        startkey: req.body.name,
        limit: 1
      }, function(err, data) {
        if (data && data.rows.length > 0) {
          var doc = data.rows[0].value;
          if (doc.name === req.body.name) {
            bcrypt.compare(req.body.password, doc.password, function(err, eq) {
              var headers = {Location: "/"};
              if (eq) {
                var salt = "";
                headers["Set-Cookie"] = authCookie({id: data.rows[0].id, name: doc.name, roles: doc.roles || []}, salt);
              }
              res.writeHead(302, headers);
              res.end();
            });
          } else {
            res.writeHead(200, {});
            res.end("error");
          }
        } else {
          res.writeHead(200, {});
          res.end("error");
        }
      });
    });

    app.post("/logout", function(req, res) {
      delete req.userCtx;
      res.writeHead(302, {Location: "/", "Set-Cookie": key + "=;path=/"});
      res.end();
    });

    app.get("/register", function(req, res) {
      /*var locals = {
        //layout: "views/register.hbs",
        userCtx: req.userCtx,
        title: "AIM Problem Lists",
        breadcrumbs: [
          {url: "./", title: "AIM Problem Lists"},
          {title: "Register"}]
      };
      res.render("register", {locals: locals});*/
      res.render("register", {
        layout: "views/register.hbs",
        title: "AIM Problem Lists",
        userCtx: req.userCtx,
        breadcrumbs: [
          {url: "./", title: "AIM Problem Lists"},
          {title: "Register"}],
      });


    });

    app.post("/register", function(req, res) {
      // TODO validation
      var form = req.body,
          error = null;
      if (!form.name) error = "Please enter a name.";
      else if (!form.email) error = "Please enter an email address.";
      else if (!form.password) error = "Please enter a password.";
      else if (!form.terms) error = "Please agree to the terms and conditions.";
      else if (form.password !== form.password2) error = "The second password does not match the first.";
      if (error != null) {
        form.error = error;
        console.log("Registration Error: " + error);
        //res.render("register", {locals: form});    // Was not working with locals
        res.render("register", {                     // Changed to work with template
          layout: "views/register.hbs",
          title: "AIM Problem Lists",
          error: error,
          name: form.name,
          email: form.email,
          password: form.password,
          password2: form.password2,
          terms: form.terms,
          //userCtx: req.userCtx
          //breadcrumbs: [
          //  {url: "./", title: "AIM PRoblem Lists"},
          //  {title: "Register"}],
        });

        return;
      }
      bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(req.body.password, salt, function(err, hash) {
          var email = req.body.email,
              user = {
            _id: "org.aimpl.user:" + email,
            type: "user",
            name: email,
            screen_name: req.body.name || "Anonymous",
            password: hash
          };
          db.saveDoc(user, function(err, results) {
            if (results.error) {
              form.error = "This email address is already registered.";
              res.render("register", {
                layout: "views/register.hbs",
                title: "AIM Problem Lists",
                error: form.error,
                name: form.name,
                email: form.email,
                password: form.password,
                password2: form.password2,
                terms: form.terms,
              });

            } else res.render("register_success", { 
		     layout: "views/register_success.hbs",
	             title: "AIM Problem Lists",
		   });
          });
        });
      });

    console.log("register post");
    });
  }
};
