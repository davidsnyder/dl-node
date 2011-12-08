var channel_name = 'dl.channel.votes';

const redis = require('redis');
const sub   = redis.createClient();
const store = redis.createClient();

const io     = require('socket.io');
const socket = io.listen(3000);

socket.sockets.on('connection', function(client) {

    sub.subscribe(channel_name);  //listen for messages published on this channel

    sub.on("message", function(channel, vote) { //receives "meal_id:user_id:restaurant_id"
        var vote_keys = vote.split(":");
        var key = vote_keys[0]+":"+vote_keys[1];
        store.set(key,vote_keys[2]); //register this vote in the db

        var meal = {'meal_id':vote_keys[0],'total':0,'votes':{}};
        
        store.keys(vote_keys[0]+":*", function (err, votes) { //grab all votes for this meal
            meal['total'] = votes.length;
            votes.forEach(function (vote) {  //assemble response payload 
                store.get(vote,function(err,rest_id) {
                    if(meal['votes'][rest_id] == undefined) {
                        meal['votes'][rest_id] = [];           
                    }                                              
                    meal['votes'][rest_id].push(vote.split(':')[1]);           
                });
            });
        });

        //How do I get the changes made in the function closures to reflect here?
        console.log(meal);
        client.emit('vote',JSON.stringify(meal));
    });

    client.on("connect",function() {
        client.emit('message',"Connected");
    });

    client.on('disconnect', function() {
        client.emit('message',"Disconnected");
    });
});                   
