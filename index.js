var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

var rooms = {}

var clone = function(json_original) {
    return JSON.parse(JSON.stringify(json_original));
}

var base_user = {
    "playable": false
}

io.on('connection', function(socket) {
    socket.room = null;
    console.log('a user connected');
    // socket.on('chat message', function(msg) {
    //     console.log('message: ' + msg);
    //     if (socket.room) {
    //         console.log("From " + socket.room)
    //     }
    // });

    socket.on('message', function(room_msg) {
        console.log('message: ' + room_msg.msg + ' ' + room_msg.room);
        if (socket.room) {
            console.log("From " + socket.room)
        }
        socket.broadcast.to(room_msg.room).emit('message', room_msg.msg);
    });

    socket.on('room-make', function(room_info) {
        if (!room_info.room_num) {
            socket.emit('err', "Please give valid room id");
        } else {
            console.log(room_info.room_num + " has joined with url " + room_info.url)
            socket.room = room_info.room_num;
            socket.join(room_info.room_num);
            var exists = false;
            console.log(room_info)
            if (!rooms[room_info.room_num]) {
                if (room_info.url) {
                    users = {};
                    users[socket.id] = clone(base_user);
                    rooms[room_info.room_num] = {
                        'url': room_info.url,
                        'joined': 1,
                        'users': users
                    };
                    socket.room = room_info.room_num;
                    socket.emit('join-success', {
                        'name': room_info.room_num,
                        'url': room_info.url
                    })
                } else {
                    socket.emit('err', "URL not given")
                }
            }
            console.log(rooms)
        }
    });
    socket.on('room-join', function(room_num) {
        if (!room_num) {
            socket.emit('err', "Please give valid room id");
        }
        if (room_num in rooms) {
            socket.join(room_num);
            console.log(room_num + " has joined with url " + rooms[room_num].url)
            rooms[room_num].joined++;
            rooms[room_num].users[socket.id] = clone(base_user);
            socket.room = rooms[room_num].url;
            socket.emit('join-success', {
                'name': room_num,
                'url': rooms[room_num].url
            })
        } else {
            socket.emit('err', "Room does not exist. Create it first.");
        }
        console.log(rooms)
    });
    // socket
    socket.on('disconnect', function() {
        console.log('user disconnected from ' + socket.room);
        if (socket.room) {
            rooms[socket.room].joined--;
            if (rooms[socket.room].joined <= 0) {
                console.log("Removing room " + socket.room)
                delete rooms[socket.room];
            } else {
                console.log("Deleting user " + socket.id + " from room " + socket.room)
                delete rooms[socket.room].users[socket.id];
            }
        }

    });
});


http.listen(3000, function() {
    console.log('listening on *:3000');
});