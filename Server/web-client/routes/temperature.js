var express = require('express');
var router = express.Router();
var grpc = require('@grpc/grpc-js');
var protoLoader = require('@grpc/proto-loader');

var PROTO_PATH = __dirname + '/../Protos/smartHotel.proto';
var packageDefinition = protoLoader.loadSync(PROTO_PATH);
var smartHotel_proto = grpc.loadPackageDefinition(packageDefinition).smartHotel;
var tempControlClient = new smartHotel_proto.tempControl('0.0.0.0:40000', grpc.credentials.createInsecure());

// Initialise requestedTemp with valur of 20 for current temperature
var requestedTemp = 20;

router.get('/', function (req, res, next) {
  // Display the default value when loading the page
  res.render('temperature', { title: 'Temperature Control', message: 'Smart Temperature Control', temperatureInfo: { currentTemp: requestedTemp } });
});

router.post('/', function (req, res, next) {
  var temperature = req.body.temp;
  var hours = req.body.hours;
  var requestedHours = 0;

  console.log('Received temperature:', temperature, 'and hours:', hours);


  // Start of Client-server gRPC stream
  var call = tempControlClient.setTemp(function (error, response) {
    if (error) {
      console.error('Error:', error);
      res.status(500).send('Internal Server Error');
      return;
    }

    // Takes input from guest and stores as a variable
    requestedTemp = response.temp;
    requestedHours = response.hours;

    // Logs guest updates on the server
    console.log('Guest set temperature to:', requestedTemp, 'for', requestedHours, 'hours.');

    // Render the page with the updated requestedTemp
    res.render('temperature', {
      title: 'Temperature Control',
      message: 'Smart Temperature Control',
      temperatureInfo: {
        requestedTemp: requestedTemp,
        requestedHours: requestedHours,
        currentTemp: requestedTemp, // Display the requested temperature
      },
    });
  });

  call.on('error', function (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  });

  // send client info to server
  call.write({ temp: parseFloat(temperature), hours: parseInt(hours) });

  call.end();
  // end Client-server gRPC stream
});

module.exports = router;
