// %script{:type => "text/javascript", :src  => "http://localhost:3000/socket.io/socket.io.js"}
// %script{:type => "text/javascript", :src  => "/javascripts/test_socket.js"}  

$(document).ready(function() {
                    var socket = io.connect('http://localhost',{port: 3000});
                    var content = $('#content');

                    socket.on('connect', function() {
                                console.log("connected");
                              });

                    socket.on('message', function(message){
                                console.log(message);
                                content.prepend(message + '<br />');
                              }) ;


                    socket.on('disconnect', function() {
                                console.log("Disconnected");
                              });

                  });
