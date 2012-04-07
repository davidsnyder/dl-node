const channel_name = 'dl.channel.votes';
const redis = require('redis');
var port = process.env.PORT || 3000;
const io = require('socket.io').listen(port);

// Heroku Cedar stack does not support Websockets yet, force long poll
if(process.env.HEROKU_DEPLOY) {
    io.configure(function () { 
        io.set("transports", ["xhr-polling"]); 
        io.set("polling duration", 10);
    });    
}

io.sockets.on('connection', function(client) {

    console.log(process.env);
    //Heroku production authentication
    if (process.env.REDISTOGO_URL) {
        console.log("HERE");
        var rtg = require("url").parse(process.env.REDISTOGO_URL);
        console.log(rtg);
        var sub = redis.createClient(rtg.port, rtg.hostname);
        sub.auth(rtg.auth.split(":")[1]);
        console.log(sub);
    } else {
        var sub = redis.createClient(); //create a new subscriber connection        
    }
    
    sub.subscribe(channel_name);  //listen for messages published on this channel

    client.on('join', function(session_id) {
        client.set('vote_session',session_id);
        client.join(session_id);
        //console.log("user joined /"+session_id);
    });

    sub.on("message", function(channel,session) {
        var session_id = JSON.parse(session).uuid; //this is a waste, there's probably a way to avoid it
        client.get('vote_session', function(err,vote_session) { //we only want to send updates to clients in this vote session
            if(vote_session == session_id) {
              client.emit('vote', session);              
            }
        });
    });

    client.on('disconnect', function() {
        client.get('vote_session', function(err,vote_session) {
            client.leave("/" + vote_session);
            sub.quit();
            //console.log("user left /"+vote_session);                        
        });
    });
    
});                   
