var express = require('express');
var router = express.Router();
var grpc = require('@grpc/grpc-js');
var protoLoader = require('@grpc/proto-loader');

var PROTO_PATH = __dirname + '/../Protos/smartHotel.proto';
var packageDefinition = protoLoader.loadSync(PROTO_PATH);
var smartHotel_proto = grpc.loadPackageDefinition(packageDefinition).smartHotel;
var client = new smartHotel_proto.localAttractionsService('0.0.0.0:40000', grpc.credentials.createInsecure());
var client2 = new smartHotel_proto.distance('0.0.0.0:40000', grpc.credentials.createInsecure());

router.get('/', (req, res, next) => {
  var localAttractions = { topAttractions: [], distanceAttractions: [] };

  // Get top attractions
  var topAttractionsCall = client.getLocalAttractions({}); // loads getLocalAttractions gRPC from Proto
  topAttractionsCall.on('data', (response) => {
      localAttractions.topAttractions.push(response);
  });

  topAttractionsCall.on('end', () => {
      renderView();
  });

  topAttractionsCall.on('error', (e) => { // error catching if server not switched on 
      console.error(e);
      res.status(500).send('Error communicating with the server');
  });

  // Get attractions with distance information 
  function renderView() {
      res.render('localattractions', { localAttractions });
  }
});

router.get('/distance', (req, res, next) => {
  var localAttractions = { topAttractions: [], distanceAttractions: [] }; // localAttracions = combined data arrays
  var distanceToTravel = req.query.distanceToTravel || 0;

  // Get top attractions
  var topAttractionsCall = client.getLocalAttractions({}); // client + client 2 - possible to combine these into one pull?
  topAttractionsCall.on('data', (response) => {
      localAttractions.topAttractions.push(response);
  });

  topAttractionsCall.on('end', () => {

      // Get attractions with distance information
      var attractionsCall = client2.getDistance({ distanceToTravel: distanceToTravel });
      attractionsCall.on('data', (response) => {
          localAttractions.distanceAttractions.push(response);
      });

      attractionsCall.on('end', () => {
          renderView();
      });

      attractionsCall.on('error', (e) => { // Displays error if issuew ith attracionsCall gRPC
          console.error(e);
          res.status(500).send('Error communicating with the server - attracionsCall');
      });
  });

  topAttractionsCall.on('error', (e) => { // Displays error if issue with topAttracionsCall gRPC
      console.error(e);
      res.status(500).send('Error communicating with the server - topAttractionsCall');
  });

  function renderView() {
      res.render('localattractions', { localAttractions });
  }
});

module.exports = router;
