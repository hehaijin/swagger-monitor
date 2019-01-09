'use strict'


const SwaggerMonitor = require('./swaggerMonitor');
const swaggerUi = require('swagger-ui-express');
const fs= require('fs');




module.expors= function addSwaggerMonitor(server, jsonFilePath){	
	const swaggerMonitor = new SwaggerMonitor('Rhodes Fusion', 'web API for rhodes fusion data service', '0.1.0');
	SwaggerMonitor.addServer('http://localhost:4202/', 'default test server');
	server.use('/api-docs', swaggerUi.serve, (req,res,next)=>{
	swaggerUi.setup(swaggerMonitor.swaggerjson,options)(req,res,next);
});
	swagger.get('/api-json',(req,res,next)=>{
		res.send(swaggerMonitor.swaggerjson);
	});	
}