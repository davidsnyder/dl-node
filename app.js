var channel_name = 'dl.channel.votes';

const redis = require('redis');
const redis_store = redis.createClient();

const io = require('socket.io').listen(3000);

io.sockets.on('connection', function(client) {

    const sub = redis.createClient(); //create a new subscriber connection
    
    sub.subscribe(channel_name);  //listen for messages published on this channel

    client.on('join', function(meal_id) {
        client.set('meal_id', meal_id);
        client.join(meal_id);
        console.log("user joined /"+meal_id);
    })

    sub.on("message", function(channel, vote) { //receives "meal_id:user_id:restaurant_id" messages from redis
        var vote_keys = vote.split(":");
        var key = vote_keys[0]+":"+vote_keys[1];
        redis_store.set(key,vote_keys[2]); //register this vote in the db

        client.get('meal_id',function(err,vote_session) { //we only want to send updates to clients in this vote session
            var meal = {'meal_id':vote_session,'total':0,'votes':{'carlos':'fix me'}};
            redis_store.keys(vote_keys[0]+":*", function (err, votes) { //grab all votes for this meal
                meal['total'] = votes.length;
                votes.forEach(function (vote) {  //assemble response payload 
                    redis_store.get(vote,function(err,rest_id) {
                        if(meal['votes'][rest_id] == undefined) {
                            meal['votes'][rest_id] = [];           
                        }                                              
                        meal['votes'][rest_id].push(vote.split(':')[1]);           
                    });
                });
            });
            
            //How do I get the changes made in the function closures above to reflect in @meal@?
            io.sockets.in(vote_session).emit('vote', JSON.stringify(meal));             
        });
    });

    client.on("connect",function() {
        console.log("user connected");        
    });

    client.on('disconnect', function() {
        client.get('meal_id',function(err,vote_session) {
            client.leave("/"+vote_session);
            sub.quit();
            console.log(io.rooms);
            console.log("user left /"+vote_session);
        });
    });
    
});                   
