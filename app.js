var channel_name = 'dl.channel.votes';

const redis = require('redis');

const pub = redis.createClient();
const sub = redis.createClient();
const store = redis.createClient();

const io = require('socket.io');
const socket = io.listen(3000);

socket.sockets.on('connection', function(client) {

            client.emit('message',{hello:"world"});

            sub.subscribe(channel_name);

            sub.on("message", function(channel, message) {
                     console.log(message);
                     var vote = JSON.parse(message);
                     var meal = store.hget("meals",vote.meal_id);
                     //JSON.stringify({});
                     client.send(meal);
                   });

            client.on("message", function(channel, message) {
                        console.log(channel + ": " + message);        
                        store.inc("count");
                        pub.publish("foo",message);
                      });

            client.on('disconnect', function() {
                        sub.quit();
                      });
          });                   
