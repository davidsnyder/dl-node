var channel_name = 'dl.channel.votes';

const redis = require('redis');
const redis_store = redis.createClient();
const io = require('socket.io').listen(3000);

io.sockets.on('connection', function(client) {

    const sub = redis.createClient(); //create a new subscriber connection
    sub.subscribe(channel_name);  //listen for messages published on this channel

    client.on('join', function(session_id) {
        client.set('vote_session', session_id);
        client.join(session_id);
        console.log("user joined /"+session_id);
    });

    sub.on("message", function(channel, session) {
        var session_id = JSON.parse(session).uuid; //this is a waste, there's probably a way to avoid it
        client.get('vote_session',function(err,vote_session) { //we only want to send updates to clients in this vote session
            if(vote_session == session_id) {
              client.emit('vote', session);              
            }
        });
    });

    client.on('disconnect', function() {
        client.get('vote_session',function(err,vote_session) {
            client.leave("/"+vote_session);
            sub.quit();
            console.log("user left /"+vote_session);                        
        });
    });
    
});                   
