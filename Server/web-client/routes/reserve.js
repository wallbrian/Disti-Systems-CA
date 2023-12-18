var express = require('express')
var router = express.Router()
var grpc = require('@grpc/grpc-js')
var protoLoader = require('@grpc/proto-loader')

var PROTO_PATH = __dirname + '/../Protos/smartHotel.proto'
var packageDefinition = protoLoader.loadSync(PROTO_PATH)
var smartHotel_proto = grpc.loadPackageDefinition(packageDefinition).smartHotel
var client = new smartHotel_proto.BookingService('0.0.0.0:40000', grpc.credentials.createInsecure())
var clientRoom = new smartHotel_proto.roomAvailabilityService('0.0.0.0:40000', grpc.credentials.createInsecure())

router.get('/', async (req, res, next) => {
  try {
    var reserveRoom = req.query.reserveRoom;
    var numOfNights = req.query.numOfNights;
    var roomAvailability = [];

    // room availability section starts here
    var call = clientRoom.getRoomAvailability({}); //calls on room availability RPC which pulls data from Array in Server>App.js
    call.on('data', (response) => {
      roomAvailability.push(response);
    });

    // added promise/resolve as without, it moves onto the next gRPC (reserve room section) without publishing getRoomAvailability
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve

    var grpcLoad = new Promise((resolve) => { 
      call.on('end', resolve);
    });


    // room availability section ends here

    await grpcLoad;

    // reserve room section section starts here
    
    if (reserveRoom === 'yes' && (numOfNights === '' || isNaN(numOfNights) || parseInt(numOfNights) <= 0)) { // creating error codes for every non-confirmed possibility (I can simplify this by making it only if 'Want to reserve' = Yes && Nights = !NaN is confirmed but then cannot differentiate error messages)
      res.render('reserve', { title: 'Reservation Status', error: 'Please enter a valid number of nights', confirm: null });
    } else if (reserveRoom === 'no' && (numOfNights === '' || isNaN(numOfNights) || parseInt(numOfNights) <= 0)) {
      res.render('reserve', { title: 'Reservation Status', error: 'You selected "No," and you left the number of nights blank', confirm: null });
    } else if (reserveRoom === 'no' && (numOfNights !== '' && !isNaN(numOfNights))) {
      res.render('reserve', { title: 'Reservation Status', error: "You selected 'No,' so you're not staying", confirm: null });
    } else if (!isNaN(numOfNights)) {
      try {
        client.reserve({ reserveRoom: reserveRoom, numOfNights: parseInt(numOfNights) }, function (error, response) {
          if (error) {
            console.error("Error:", error);
            res.render('reserve', { title: 'Reservation Status', error: "Error communicating with the server", confirm: null });
          } else {
            if (response.confirm !== undefined) {
              res.render('reserve', { title: 'Reservation Status', error: null, confirm: response.confirm, roomAvailability });
            } else {
              console.error("Unexpected response format:", response);
              res.render('reserve', { title: 'Reservation Status', error: "Unexpected response format", confirm: null, roomAvailability });
            }
          }
        });
      } catch (error) {
        console.error(error);
        res.render('reserve', { title: 'Reservation Status', error: "An error occurred on the client side", confirm: null, roomAvailability });
      }
    } else {
      res.render('reserve', { title: 'Reservation Status', error: "Please enter a valid number of nights", confirm: null, roomAvailability });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error communicating with the server');
  }
  
    // reserve room section section ends here

    var grpcLoad2 = new Promise((resolve) => { // another promise/resolve in case gRPC loading too fast
      call.on('end', resolve);
    });

    // room availability section ends here

    await grpcLoad2;

});

module.exports = router;
