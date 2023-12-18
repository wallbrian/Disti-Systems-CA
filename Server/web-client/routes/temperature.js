var express = require('express');
var router = express.Router();
var grpc = require('@grpc/grpc-js');
var protoLoader = require('@grpc/proto-loader');

var PROTO_PATH = __dirname + '/../Protos/smartHotel.proto';
var packageDefinition = protoLoader.loadSync(PROTO_PATH);
var smartHotel_proto = grpc.loadPackageDefinition(packageDefinition).smartHotel;
var tempControlClient = new smartHotel_proto.tempControl('0.0.0.0:40000', grpc.credentials.createInsecure());
var getRoomTempInitialClient = new smartHotel_proto.getRoomTempInitialService('0.0.0.0:40000', grpc.credentials.createInsecure());

router.get('/', function (req, res, next) {
  res.render('temperature', { title: 'Temperature Control', message: 'Smart Temperature Control', temperatureInfo: {} });
});

router.post('/', function (req, res, next) {
  var temperature = req.body.temp;
  var hours = req.body.hours;
  var requestedTemp, requestedHours; 
  var grpcLoad = false; 

  console.log('Received temperature:', temperature, 'and hours:', hours);

  // Server-client temperature starts here
 
  router.get('/', async (req, res, next) => {
    try {
      // Get initial temperature section starts here
      var initialTemp;
      var callInitialTemp = getRoomTempInitialClient.getRoomTempInitial({});
      callInitialTemp.on('data', (response) => {
        initialTemp = response.initialTemp;
      });
  
      var grpcLoadInitialTemp = new Promise((resolve) => {
        callInitialTemp.on('end', resolve);
      });
  
      await grpcLoadInitialTemp;
      // Get initial temperature section ends here
  
      res.render('temperature', {
        title: 'Temperature Control',
        message: 'Smart Temperature Control',
        temperatureInfo: {
          initialTemp: initialTemp // Display the initial temperature or default to 20
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error communicating with the server');
    }
  });

  
// Start of Client-server gRPC stream
  var call = tempControlClient.setTemp(function (error, response) {
    
    if (error) {
      console.error('Error:', error);
      res.status(500).send('Internal Server Error');
      return;
    }

    // takes input from guest and stores as a variable
    requestedTemp = response.temp;
    requestedHours = response.hours;

    // Logs guest updates on server
    console.log('Guest set temperature to:', requestedTemp, 'for', requestedHours, 'hours.');

    // once logged then set grpcLoad to true
    grpcLoad = true;
  });


  call.on('error', function (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  });

  // send client info to server
  call.write({ temp: parseFloat(temperature), hours: parseInt(hours) });


  call.end();

  // end Client-server gRPC stream

  // Alternative to promse/resolve as would not work on client - > server like it did server -> client (unknown why...)
  function grpcLoad2() {
    if (grpcLoad) {
      res.render('temperature', {
        title: 'Temperature Control',
        message: 'Smart Temperature Control',
        temperatureInfo: {
          requestedTemp: parseFloat(temperature),
          requestedHours: parseInt(hours),
          currentTemp: requestedTemp, // Display the requested temperature - want this to default to 20 but can't get it to work
        },
      });
    } else {
      setTimeout(grpcLoad2, 100); // https://www.w3schools.com/jsref/met_win_settimeout.asp
    }
  }

  grpcLoad2();
});

module.exports = router;
