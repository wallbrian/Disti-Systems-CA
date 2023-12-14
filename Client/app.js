var readlineSync = require('readline-sync');
var grpc = require("@grpc/grpc-js");
var protoLoader = require("@grpc/proto-loader");

var PROTO_PATH = __dirname + "/protos/smartHotel.proto";
var packageDefinition = protoLoader.loadSync(PROTO_PATH);
var smartHotel = grpc.loadPackageDefinition(packageDefinition).smartHotel;

var reserveRoom = readlineSync.question("Do you want to book a room? If so, say Yes: ");
var numOfNights = readlineSync.question("How many nights would you like to stay? ");

var request = {
    reserveRoom: reserveRoom,
    numOfNights: parseInt(numOfNights)
};

if (isNaN(request.numOfNights) || request.numOfNights <= 0) {
    console.log("Please enter a valid number of nights greater than 0.");

} else {
    var client = new smartHotel.BookingService("0.0.0.0:40000", grpc.credentials.createInsecure());


client.reserve(request, function (error, response) {
    if (error) {
        console.error("Error:", error);
    } else {
        if (response.confirm !== undefined) {
            console.log(response.confirm);
        } else {
            console.error("Unexpected response format:", response);
        }
    }
});
}