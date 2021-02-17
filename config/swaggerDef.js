const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
  //  openapi: '3.0.0', // Specification (optional, defaults to swagger: '2.0')
    info: {
      title: 'Sety', // Title (required)
      version: '1.0.0', // Version (required)
      description: 'Api For sety project',
    },
    securityDefinitions: {
        bearerAuth: {
            type: 'apiKey',
            name: 'Authorization',
            scheme: 'bearer',
            in: 'header',
          },
    }
  },
  // Path to the API docs
 // apis: ['./controllers/v1/*.js','./models/*.js'],
 apis: ['./controllers/v1/User.js','./models/*.js'],
};

// Initialize swagger-jsdoc -> returns validated swagger spec in json format
const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec