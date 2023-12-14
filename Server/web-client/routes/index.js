var express = require('express')
var router = express.Router()
var grpc = require('@grpc/grpc-js')
var protoLoader = require('@grpc/proto-loader')

var PROTO_PATH = __dirname + '/../Protos/smartHotel.proto'
var packageDefinition = protoLoader.loadSync(PROTO_PATH)
var smartHotel_proto = grpc.loadPackageDefinition(packageDefinition).smartHotel
var client = new smartHotel_proto.BookingService('0.0.0.0:40000', grpc.credentials.createInsecure())


router.get('/', function(req, res, next) {
  
  res.render('index', { title: 'Main Page', message: 'Welcome to the main page!' });
});


module.exports = router;