var express = require('express');
var router = express.Router();
var grpc = require('@grpc/grpc-js');
var protoLoader = require('@grpc/proto-loader');

var PROTO_PATH = __dirname + '/../Protos/smartHotel.proto';
var packageDefinition = protoLoader.loadSync(PROTO_PATH);
var smartHotel_proto = grpc.loadPackageDefinition(packageDefinition).smartHotel;
var tempControlClient = new smartHotel_proto.tempControl('0.0.0.0:40000', grpc.credentials.createInsecure());

router.get('/', function (req, res, next) {
  res.render('temperature', { title: 'Temperature Control', message: 'Smart Temperature Control' });
});

router.post('/', function (req, res, next) {
  var temperature = req.body.temp;
  var hours = req.body.hours;
  var requestedTemp, requestedHours;

  console.log('Received temperature:', temperature, 'and hours:', hours);

});

module.exports = router;

// using this as template / test page