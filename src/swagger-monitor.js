'use strict';

const util = require('util');
const schemaGenerator = require('json-schema-generator');
const fs = require('fs');

/**
 * some utility methods to work with swagger/OAS 3.0.
 */


class SwaggerMonitor {
  // work with 2 modes, override, or not

  constructor(title, description, version) {
    this.swaggerjson = {
      openapi: '3.0.0',
      info: {
        title,
        description,
        version
      },
      servers: [],
      paths: {}
    };
    this.totalRoutes = new Set();
    this.hitRoutes = new Set();
  }

  createFromFile(file){
    return new SwaggerAPI();
  }

  // adds all routes from express app.
  // no need to check existence of path anymore.
  addExpressApp(server) {
    const self = this;

    function addRoutes() {
      console.log('adding routes to swagger');
      server._router.stack.filter(r => r.route && r.route.path).map(
        r => {
          //r.route.methods object
          Object.keys(r.route.methods).forEach(method => {
            self.addPath(r.route.path, method);
            self.totalRoutes.add(method + ':' + r.route.path);
          });
        }
      )
    }

    setTimeout(() => {
      addRoutes();
    }, 50)

    // if(!server._router) throw new Error('there must be routes in the express server, consider change the where you put the route ')

    server.use(this.autoCapture.bind(this));
    server.get('/api-save', (req, res, next) => {
      fs.writeFile('./swagger.json', JSON.stringify(self.swaggerjson), (err, data) => {
        if (err) console.log(err);
        res.send("Successfully Written to File.");
      });
    });
    server.get('/api-json', (req, res, next) => {

      res.send(this.swaggerjson);

    });

  }


  addServer(url, description) {
    if (!util.isArray(this.swaggerjson.servers)) throw new Error('Server must be a array');
    let servers = this.swaggerjson.servers;
    servers.push({url, description});
  }

  /**
   * translate a express path to a swagger path
   * swagger path use ${} while express path use :id and other regex staff.
   * @param {*} expressPath
   */
  pathTranslate(expressPath) {
    if (expressPath.indexOf(':') === -1) return expressPath;
    else {
      const arr1 = expressPath.split('/');
      const arr2 = arr1.map(pe => {
        if (pe.indexOf(':') === -1) return pe;
        else return '${' + pe.replace(':', '') + '}';
      })
      return arr2.join('/');
    }
  }

  /**
   *
   * @param {*} path : a express path,  i.e. '/search/client', can have ':' for templating; do not support regex elements like ?+* yet.
   * @param {*} method  'GET'
   * @param {*} body
   * @param {*} parameters
   */
  addPath(path, method) {
    method = method.toLowerCase();
    const swaggerPath = this.pathTranslate(path);
    if (!this.swaggerjson.paths[swaggerPath]) this.swaggerjson.paths[swaggerPath] = {};
    if (this.swaggerjson.paths[swaggerPath][method]) {  // should work with existing half defined json files.
      return;
    }
    // at the same time, if there is route parameters, add
    this.swaggerjson.paths[swaggerPath][method] = {
      tags: [],
      requestBody: {},
      parameters: [],
      responses: {
        200: {
          description: 'OK'
        }
      }
    };

    if(path.indexOf(':') >= 0){
      const pathElements= path.split('/');
      for(const pe of pathElements){
        if(pe.indexOf(':') >=0){
          const name= pe.replace(':', '');
          const parameter= SwaggerAPI.createParameter(name, 'path',name,'string');
          this.addParameter(path, method, parameter);
        }
      }

    }

  }

  addBody(path, method, body) {
    const swaggerPath= this.pathTranslate(path);
    method = method.toLowerCase();
    if(Object.keys(this.swaggerjson.paths[swaggerPath][method].requestBody).length!==0 ) return; // respect the already added routes.
    this.swaggerjson.paths[swaggerPath][method].requestBody = body;
  }

  addResponse(path, method, code, description) {
    method = method.toLowerCase();
    this.swaggerjson.paths[path][method].responses[code] = {description};
  }

  /**
   * add tag to path that matches the given string/regex
   * @param tag
   * @param ipath  a string or regex.
   * @param imethod
   */
  addTag(ipath, imethod, tag) {
    imethod = imethod.toLowerCase();
    let json = this.swaggerjson;
    for (const path of Object.keys(json.paths)) {
      if (!path.match(ipath)) continue;
      for (const method of Object.keys(json.paths[path])) {
        if (method !== imethod) continue;
        if (!json.paths[path][method].tags) json.paths[path][method].tags = [];
        json.paths[path][method].tags.push(tag);
      }
    }
  }


  addParameter(path, method, parameter) {
    method = method.toLowerCase();
    const swaggerPath= this.pathTranslate(path);
    if(this.swaggerjson.paths[swaggerPath][method].parameters){
      for(const p of this.swaggerjson.paths[swaggerPath][method].parameters){
        if(p.name === parameter.name) return; // already with a parameter.
      }
    }
    this.swaggerjson.paths[swaggerPath][method].parameters.push(parameter);
  }


  static createParameter(name, place, description, defaultValue) {
    if (!['cookie', 'header', 'query', 'path'].includes(place))
      throw new Error('paramter must be in cookie, header, query or path, but here get the value of ' + place);


    return {
      name,
      in: place,
      description,
      required: true,
      schema: {
        type: (typeof defaultValue)==='string'? 'string':'integer', // numeric ? good for now
        default: defaultValue
      }
    };
  }

  static createJSONRequestBody(schema, value) {
    return {
      required: true,
      content: {
        "application/json": {
          schema: schema,
          example: value
        }
      }
    };
  }

  static createSchemaFromJSON(json) {
    return schemaGenerator(json);
  }


  /**
   * adds a level of wrapping for a object schema.
   * if schema is not provided, it assume it is a empty object
   * @param {*} name
   * @param {*} schema
   */
  static schemaAddWrapper(name, schema) {
    if (!schema)
      return {
        type: 'object',
        properties: {
          [name]: {
            type: 'object',
            properties: {}
          }
        }
      }
    return {
      type: 'object',
      properties: {
        [name]: schema
      }
    }
  }


  autoCapture(req, res, next) {
    // these better to be before any middle ware
    const method = req.method;
    const self = this;
    res.on('finish', () => {
      // this is when response are sent, after all middle ware.
      // req.route now has the matching route.
      // req.route.path is the route path.
      if (!req.route) return;
      const path = req.route.path;
      self.hitRoutes.add(method + ':' + path);
      console.log('swagger monitor routes coverage ' + self.hitRoutes.size + '/' + self.totalRoutes.size)
      if (req.params && Object.keys(req.params).length > 0) {
        for (const key of Object.keys(req.params)) {
          const param = SwaggerAPI.createParameter(key, 'path', '', req.params[key]);
          self.addParameter(path, method, param);
        }
      }
      if (req.query && Object.keys(req.query).length > 0) {
        for (const key of Object.keys(req.query)) {
          const param = SwaggerAPI.createParameter(key, 'query', '', req.query[key]);
          self.addParameter(path, method, param);
        }
      }
      for (const key of Object.keys(req.headers)) {
        if (['accept', 'content-type', 'security', 'connection', 'host', 'content-length', 'accept-encoding', 'user-agent', 'postman-token', 'cache-control', 'referer', 'origin', 'accept-language'].includes(key)) continue;
        const param = SwaggerAPI.createParameter(key, 'header', '', req.headers[key]);
        self.addParameter(path, method, param);
      }
      const body = req.body;
      const bodySchema = schemaGenerator(body);
      self.addBody(path, method, SwaggerAPI.createJSONRequestBody(bodySchema, body));
    })
    next();
  }
}

module.exports = SwaggerMonitor;
