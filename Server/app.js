var grpc = require("@grpc/grpc-js");
var protoLoader = require("@grpc/proto-loader");
var PROTO_PATH = __dirname + "/protos/smartHotel.proto";
var packageDefinition = protoLoader.loadSync(PROTO_PATH);
var smartHotel_proto = grpc.loadPackageDefinition(packageDefinition).smartHotel;

// Unary gRPC

function reserve(call, callback) {
    try {
        var reserveRoom = call.request.reserveRoom;
        var numOfNights = parseInt(call.request.numOfNights);

        if (reserveRoom && reserveRoom.trim().toLowerCase() === "yes" && !isNaN(numOfNights)) {
            var confirm = "Congratulations, you have reserved a room for " + numOfNights + " nights."
            console.log("Guest has booked a room for " +numOfNights +" nights.")
            callback(null, {
                message: undefined,
                confirm: confirm
            });
        } else {
            var errorMessage;
            if (isNaN(numOfNights) || numOfNights <= 0) {
                errorMessage = "Please enter a valid number of nights greater than 0.";
            } else {
                errorMessage = "You will not reserve a room with us.";
            }
            callback(null, {
                message: errorMessage
            });
        }
    } catch (e) {
        var errorMessage = "An error has occurred: " + e.message
        console.error(errorMessage);
        callback(null, {
            message: errorMessage
        });
    }
}

// Server-client gRPC

function getRoomAvailability(call) {
    
    var data = [
        { roomType: "Single", 
        roomQuantity: 1 
        },
        { roomType: "Double", 
        roomQuantity: 6 
        },
        { roomType: "Junior Suite", 
        roomQuantity: 2 
        }
    ];

    for (var i = 0; i < data.length; i++) {
        call.write({
            roomType: data[i].roomType,
            roomQuantity: data[i].roomQuantity
        });
    }
    call.end();
}

// Server-client gRPC

function getLocalAttractions(call, callback) {

    var data = [
        {
        attractionName:"Museum",
        attractionRating: 7,
        },
        {
        attractionName:"Beach",
        attractionRating: 9
        },
        {
        attractionName:"Art Gallery",
        attractionRating: 6
        }
    ]

    for(var i = 0; i < data.length; i++){
        call.write({
            attractionName: data[i].attractionName,
            attractionRating: data[i].attractionRating,
        })
    }
    call.end()
}

// Unary gRPC 

function getDistance(call, callback) {

    console.log("Received getDistance request");
   
    var data = [
        {
        attractionName:"Museum",
        distance: 2
        },
        {
        attractionName:"Cathedral",
        distance: 2
        },
        {
        attractionName:"Best Cafe",
        distance: 4
        },
        {
        attractionName:"Concert Hall",
        distance: 7
        },
        {
        attractionName:"Beach",
        distance: 3
        },
        {
        attractionName:"Swimming Pool",
        distance: 9
        },
        {
        attractionName:"Cinema",
        distance: 8
        },
        {
        attractionName:"Art Gallery",
        distance: 5
        },
        {
        attractionName:"Shopping Centre",
        distance: 10
        }
    ]

    var distanceToTravel = call.request.distanceToTravel;
    
    console.log("A guest requested what attractions were within", distanceToTravel +" km.");

    for(var i = 0; i < data.length; i++){
        if (data[i].distance <= distanceToTravel) {
        call.write({
            attractionName: data[i].attractionName,
            attractionRating: data[i].attractionRating,
            distance: data[i].distance
        })
        }
    }
    call.end()
}

// Server-client gRPC

function getRoomTempInitial(call) {
    
    var initialTemp = 20;
    call.write({initialTemp: initialTemp})
    call.end();
}

// Client-Server gRPC

function setTemp(call, callback) {

    var currentTemp = 0
    var requestedTemp = 0
    var requestedHours = 0

    call.on('data', function(request) {
        requestedTemp = request.temp
        currentTemp = requestedTemp
        requestedHours = request.hours
    })

    call.on("end", function() {
        callback(null, {
            temp: requestedTemp,
            hours: requestedHours
        })
    })

    call.on('error', function(e) {
        console.log("An error occured")
    })

}

// bidirectional chat

var clients = {}

function sendMessage(call) {
    call.on('data', function(chat_message) {

        if(!(chat_message.name in clients)) {
            clients[chat_message.name] = {
                name: chat_message.name,
                call: call
            }
        }

        for (var client in clients) {
            clients[client].call.write(
                {
                    name: chat_message.name,
                    message: chat_message.message
                }
            )
        }
    });

}

var server = new grpc.Server();

server.addService(smartHotel_proto.BookingService.service, { reserve: reserve }); // Reserve room Unary gRPC
server.addService(smartHotel_proto.roomAvailabilityService.service, { getRoomAvailability: getRoomAvailability }); // Room type Server-Client gRPC

server.addService(smartHotel_proto.localAttractionsService.service, { getLocalAttractions: getLocalAttractions }); // Local attractions Server-Client gRPC
server.addService(smartHotel_proto.distance.service, { getDistance: getDistance }); // Distance room Unary gRPC

server.addService(smartHotel_proto.tempControl.service, { setTemp: setTemp }); // Temperature Control Client-Server gRPC
server.addService(smartHotel_proto.getRoomTempInitialService.service, { getRoomTempInitial: getRoomTempInitial }); // Room type Server-Client gRPC

server.addService(smartHotel_proto.HotelChat.service, { sendMessage: sendMessage }) // Chat bi-directional gRPC

server.bindAsync("0.0.0.0:40000", grpc.ServerCredentials.createInsecure(), function () {
    console.log("Server started on port 40000");
    server.start();
});
