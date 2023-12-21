var grpc = require("@grpc/grpc-js");
var protoLoader = require("@grpc/proto-loader");
var PROTO_PATH = __dirname + "/protos/smartHotel.proto"; // Loads protocol buffer file
var packageDefinition = protoLoader.loadSync(PROTO_PATH);
var smartHotel_proto = grpc.loadPackageDefinition(packageDefinition).smartHotel;

// Unary gRPC

function reserve(call, callback) {
    console.log("--- Reservation Received ---");
    try {
        var reserveRoom = call.request.reserveRoom;
        var numOfNights = parseInt(call.request.numOfNights);

        if (reserveRoom && reserveRoom.trim().toLowerCase() === "yes" && !isNaN(numOfNights)) { // Checks that room reservation is valid based on a "Yes" selected + a valid number.
            var confirm = "Congratulations, you have reserved a room for " + numOfNights + " nights."
            console.log("Guest has booked a room for " +numOfNights +" nights.")
            callback(null, { // If valid, respond with confirm message.
                message: undefined,
                confirm: confirm
            });
        } else {
            var errorMessage; // Generates an error 
            if (isNaN(numOfNights) || numOfNights <= 0) {
                errorMessage = "Please enter a valid number of nights greater than 0.";
            } else {
                errorMessage = "You will not reserve a room with us.";
            }
            callback(null, { // Respond with error message
                message: errorMessage
            });
        }
    } catch (e) {
        var errorMessage = "An error has occurred: " + e.message // Handles errors
        console.error(errorMessage);
        callback(null, {
            message: errorMessage
        });
    }
}

// Server-client gRPC

function getRoomAvailability(call) {
    
    var data = [ // Sample array of rooms available to client - published on reserve page
        { roomType: "Single", 
        roomDesc: "Our single occupancy in a classic double bedded room, inclusive of full Irish breakfast. These rooms are smaller than our standard rooms with limited views."
        },
        { roomType: "Double", 
        roomDesc: "The standard double occupancy bed room, with full ensuite facilities, iron and ironing board, mini safe and hairdryer."
        },
        { roomType: "Junior Suite", 
        roomDesc: "Our Junior Suite comes with a Kingsize bed and stunning lake view with the following amenities;with full ensuite facilities and iron and ironing board."
        }
    ];

    for (var i = 0; i < data.length; i++) { // Send room info to client
        call.write({
            roomType: data[i].roomType,
            roomDesc: data[i].roomDesc
        });
    }
    call.end(); // Closes the call
}

// Server-client gRPC

function getLocalAttractions(call, callback) { // Array of 3 rated attractions

    var data = [
        {
        attractionName:"Museum",
        attractionRating: 10,
        },
        {
        attractionName:"Beach",
        attractionRating: 9
        },
        {
        attractionName:"Art Gallery",
        attractionRating: 8
        }
    ]

    for(var i = 0; i < data.length; i++){ // Sends top 3 attractions to client
        call.write({
            attractionName: data[i].attractionName,
            attractionRating: data[i].attractionRating,
        })
    }
    call.end() // Closes call
}

// Unary gRPC 

function getDistance(call, callback) { 

    console.log("--- getDistance request received ---");
   
    var data = [ // Array of available attractions within 10km
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

    for(var i = 0; i < data.length; i++){ // Sends attractions to client within specified distance by stoping the loop at the number inputted.
        if (data[i].distance <= distanceToTravel) {
        call.write({
            attractionName: data[i].attractionName,
            attractionRating: data[i].attractionRating,
            distance: data[i].distance
        })
        }  
    }
    call.end() // Close call
}



// Client-Server gRPC

function setTemp(call, callback) {

    var currentTemp = 0
    var requestedTemp = 0
    var requestedHours = 0

    call.on('data', function(request) { // Listens for temperature + duration request from client
        requestedTemp = request.temp
        currentTemp = requestedTemp
        requestedHours = request.hours

        console.log("A guest requested to set the temperature to", requestedTemp +"°C for " +requestedHours + " hours."); // Prints request to server console.
    })

    call.on("end", function() { // Used to set the HTML to show response was received.
        callback(null, {
            temp: requestedTemp,
            hours: requestedHours
        })
    })

    call.on('error', function(e) { // Error handling
        console.log("An error occured")
    })

    
}

// bidirectional chat

var guests = {} // Array to hold all clients that joint the chat

function sendMessage(call) {
    call.on('data', function(chat_message) {

        if(!(chat_message.name in guests)) {
            guests[chat_message.name] = { // Register guest in the chat 
                name: chat_message.name,
                call: call
            }
        }

        for (var guest in guests) { // Send chat message to all in chat
            guests[guest].call.write(
                {
                    name: chat_message.name,
                    message: chat_message.message
                }
            )
        }
    });

}

var server = new grpc.Server(); // Creates gRPC server

// Adds services to server

server.addService(smartHotel_proto.BookingService.service, { reserve: reserve }); // Reserve room Unary gRPC
server.addService(smartHotel_proto.roomAvailabilityService.service, { getRoomAvailability: getRoomAvailability }); // Room type Server-Client gRPC

server.addService(smartHotel_proto.localAttractionsService.service, { getLocalAttractions: getLocalAttractions }); // Local attractions Server-Client gRPC
server.addService(smartHotel_proto.distance.service, { getDistance: getDistance }); // Distance room Unary gRPC

server.addService(smartHotel_proto.tempControl.service, { setTemp: setTemp }); // Temperature Control Client-Server gRPC

server.addService(smartHotel_proto.HotelChat.service, { sendMessage: sendMessage }) // Chat bi-directional gRPC

server.bindAsync("0.0.0.0:40000", grpc.ServerCredentials.createInsecure(), function () {
    console.log("Smart Hotel server is up & running!");
    server.start();
});
