# Swagger Monitor
Automatically monitors HTTP data flow and creates swagger config files.

The package acts as a middle ware that can check the http data flow, automatically convert query string, headers, request bodies into swagger format, and add the examples. 

#Install
```$xslt

npm install swagger-monitor

```

#Usage
Code example:
````

const SwaggerMonitor = require('swagger-monitor');
const express= require('express');

const httpServer= express();

// define you httpServer here.
````
From Scratch:
```
const swaggerMonitor= new SwaggerMonitor(); // A swaggerconfig.json will be created in root folder

// optional, adds meta data
swaggerMonitor.addMetaData(title, description, '0.1.0');

// optional, adds server info
swaggerMonitor.addServer('http://localhost:8080/', 'default test server');

swaggerMonitor.addExpressServer(httpServer);

// optional, add tags to paths.
swaggerMonitor.addTag(/admin/,'admin');

```
From Existing Config File

```
const swaggerMonitor= new SwaggerMonitor('pathToConfigFile');
swaggerMonitor.addExpressServer(httpServer);
```


The package will read from already existing json file, or create from scratch.

A route at '/api-docs' will be availabe to tract the changes in the swagger specification.

You will need to refresh the webpage to see changes.

Or visit '/api-json' to see the raw json file.

All updates will be saved to the json file immediately.
 

