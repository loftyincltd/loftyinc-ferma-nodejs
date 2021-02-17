
let router = require('express').Router();

const swaggerSpec = require('../../config/swaggerDef')
const swaggerUi = require('swagger-ui-express');
router.use('/api', require('./api'));
router.use('/auth', require('./auth'));
router.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  var options = {
    swaggerOptions: {
      authAction :{ JWT: {name: "JWT", schema: {type: "apiKey", in: "header", name: "Authorization", description: ""}, value: "Bearer 4jjjjjdjjdjdj94944949949494994949494949"} }
    }
  };
router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
module.exports = router;





