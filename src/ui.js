'use strict'


const SwaggerMonitor = require('./swagger-monitor');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');


module.exports = function addSwaggerMonitor(server, jsonFilePath) {
    const swaggerMonitor = new SwaggerMonitor(jsonFilePath);
    swaggerMonitor.addServer('http://localhost:4202/', 'default test server');
    swaggerMonitor.addExpressApp(server);
    server.use('/api-docs', swaggerUi.serve, (req, res, next) => {
        swaggerUi.setup(swaggerMonitor.swaggerjson)(req, res, next);
    });
    server.get('/api-json', (req, res, next) => {
        res.send(swaggerMonitor.swaggerjson);
    });
}