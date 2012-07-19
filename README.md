# AimPL: the American Institute of Mathematics Problem Lists

For creating and maintaining up-to-date lists of unsolved problems in research
mathematics.

## Dependencies

 * Node.js 0.8.x
 * Node.js packages defined in `app/package.json`. Install using `npm install`
   in the `app/` directory.
 * CouchDB 1.2.x
 * [CouchApp](http://couchapp.org/)
 * LaTeX (pdflatex and relevant fonts)
 * Python 2.7.x
 * couchdbkit (Python library)
 * MathJax 2.x

## Configuration

The following configuration needs to be added to CouchDB:

    [query_server_config]
    reduce_limit = false

Before running the application, a random secret should be added to
`app/secrets.js`. Use `app/secrets.js.template` as a template.

## Installation

1. Install the above dependencies, with the above configuration.
2. Install MathJax: `git submodule init; git submodule update`.
3. Install the CouchApp, which is located in the `couchapp/aimpl` directory. 

        couchapp push http://user:password@127.0.0.1:5984/aimpldb

4. Start the Node.js application.

        cd app; node app.js

## Hosted Setup

In the production environment, it's recommended to use Nginx or similar to
serve static files, with a reverse proxy forwarding non-static requests to the
Node.js application listening on localhost.

## Security

To prevent abuse of `pdflatex`, it is advisable to set `openin_any=p` in the
LaTeX system config.
