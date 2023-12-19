var readline = require('readline'); // Imports libraries
var readlineSync = require('readline-sync');
var grpc = require("@grpc/grpc-js");
var protoLoader = require("@grpc/proto-loader");
const { normalize } = require('path');

var PROTO_PATH = __dirname + "/protos/smartHotel.proto";
var packageDefinition = protoLoader.loadSync(PROTO_PATH);
var smartHotel = grpc.loadPackageDefinition(packageDefinition).smartHotel;

var client = new smartHotel.HotelChat('localhost:40000', grpc.credentials.createInsecure());

var name = readlineSync.question("Hello Guest! What is your name? ") // Asks guest to enter their name
var call = client.sendMessage(); 

call.on('data', function(resp) { // Handles incoming name + message
    console.log(resp.name + ": " + resp.message)
});
call.on('end', function(){
});

call.on("error", function(e) { // Throws error code eg. if server not booted up
    console.log("Cannot connect to Smart Hotel chat server")
})

call.write({ // Sends message to server / all advising a guest has joined the chat
    message: name + " joined the Smart Hotel chat",
    name:name
});

var rl = readline.createInterface({ // Readline to capture guest input
    input: process.stdin,
    output: process.stdout
});

rl.on("line", function(message) {
    if (message.toLowerCase() ==="quit") { // If Guest types "quit" then sends message to server saying they quit and ends the gRPC call.
        call.write({
            message: name + " left the Smart Hotel chat",
            name: name
        });
        call.end();
        rl.close();
    } else {
        call.write({ // Else - sends guests message to the server.
            message: message,
            name: name
        });
    }
});
