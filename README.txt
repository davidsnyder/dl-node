The rails backend responds to a vote request by pinging the redis server listening on the node app.

`Redis::Client.publish dl.channel.votes "{'meal_id':'139a24','user_id':'foobarbaz','restaurant_id':'a2a828d'}"`

The node app listens on a websocket using socket.io, and subscribes to changes to this redis channel

//Meal 
{"id" => "3o2309","vote_count" => 3,"ballot" => [{"restaurant_id"=> "1fa2f","vote_count" => 3,"votes"=>['@userfoo','@userbar','@userbaz']}]}


