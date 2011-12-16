var channel_name = 'dl.channel.votes';

const redis = require('redis');
const redis_store = redis.createClient();

const io = require('socket.io').listen(3000);

io.sockets.on('connection', function(client) {

    const sub = redis.createClient(); //create a new subscriber connection
    
    sub.subscribe(channel_name);  //listen for messages published on this channel

    client.on('join', function(vote_session) {
        client.set('vote_session', vote_session);
        client.join(vote_session);
        emitSessionResponse(vote_session); //new connections get the current session state on join
        console.log("user joined /"+vote_session);
    });

    sub.on("message", function(channel, vote_json) {
        var obj = JSON.parse(vote_json);
        var vote = obj.vote;
        redis_store.set(obj.session_id+":"+vote.user.id,JSON.stringify(vote)); //register this vote in the db
        client.get('vote_session',function(err,vote_session) { //we only want to send updates to clients in this vote session
            if(vote_session == obj.session_id) {
                emitSessionResponse(obj.session_id);
            }
        });
    });

    function emitSessionResponse(session_id) {
        var session = {
            "session_id": session_id,
            "total_votes":0,
            "options": {}
        };       
        redis_store.keys(session_id+":*", function(err, votes) { //grab all votes for this session_id
            session['total_votes'] = votes.length;
            votes.forEach(function(vote_id) {  //assemble response payload
                redis_store.get(vote_id,function(err,vote_json) {
                    var vote = JSON.parse(vote_json);
                    if(session.options[vote.option.id] == undefined) {
                        session.options[vote.option.id] = {'id':vote.option.id,'name':vote.option.name,'votes':[]};           
                    }                                              
                    session.options[vote.option.id].votes.push(vote.user);
                    if(votes[votes.length-1] == vote_id) { //hackity-hack (don't talk back, workaround for async issue)
                        client.emit('vote', JSON.stringify(session));                             
                    }
                });
            });
        });
        return session;
    }

    client.on('disconnect', function() {
        client.get('vote_session',function(err,vote_session) {
            client.leave("/"+vote_session);
            sub.quit();
            console.log("user left /"+vote_session);                        
        });
    });
    
});                   
