# Swagger Monitor
Automatically monitors HTTP data flow and creates swagger config files.

The package acts as a middle ware that can check the http data flow, automatically convert query string, headers, request bodies into swagger format, and add the examples. 

I intend for this package as a quick and dirty way to generate config file drafts.

Functionalities to support:
1. scans _routes.stack for route definition, and create swagger path definition.
2. convert route parameter like /users/:id to swagger parameters in path.
3. convert cookies to swagger parameter in cookies.
3. convert user defined headers(will ignore common headers like content-type) to swagger parameters in header and adds the value to example. 
4. automatically create schema from request body, addes to swagger Request body. And add the body as example.
5. automatically create schema from response body.

# Install
```
npm install swagger-monitor

```

# Usage
Code example:
````

const SwaggerMonitor = require('swagger-monitor');
const express= require('express');

const httpServer= express();

// define you httpServer here.
````
Create file from scratch:
```
const swaggerMonitor= new SwaggerMonitor(); // A swaggerconfig.json will be created in root folder

// optional, adds meta data
swaggerMonitor.addMetaData(title, description, '0.1.0');

// optional, adds server info, can add multiple server.
swaggerMonitor.addServer('http://localhost:8080/', 'default test server');

swaggerMonitor.addExpressServer(httpServer);

// optional, add tags to paths.
swaggerMonitor.addTag(/admin/,'admin');

```
From existing config File

```
const swaggerMonitor= new SwaggerMonitor('pathToConfigFile');

swaggerMonitor.addExpressServer(httpServer);

```


The package will read from already existing json file, or create from scratch.

A route at **'/api-docs'** will be availabe to display the the APIs.

You will need to refresh the webpage to see changes.

Or visit **'/api-json'** to see the raw json file.


### Caveat
All updates will be saved to the json file immediately. Be carefully that if you have routes defined mannully, they might get overridden. 
 

