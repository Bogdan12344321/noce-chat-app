const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io')
const Filter = require('bad-words');
const { generateMessage } = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')


const app = express()
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname,'../public');

app.use(express.static(publicDirectoryPath));


io.on('connection', (socket) => {
    console.log('New WebSocket Connection');
    
    socket.on('join', ({username, room},callback) => {
        const { error, user } = addUser({id:socket.id, username, room});

        if(error) {
            return callback(error);
        }

        socket.join(user.room);

        socket.emit('message',generateMessage('Admin','Welcome !'));
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined`));
        io.to(user.room).emit('roomData',{
            room:user.room,
            users: getUsersInRoom(user.room)
        })

        callback();
    })

    socket.on('sendMessage', (message,callback) => {
        const user = getUser(socket.id);
        if(!user){
            return callback('User not found!');
        }
        const filter = new Filter();
        if(filter.isProfane(message)) {
            return callback('Profanity is not allowed');
        }
        io.to(user.room).emit('message',generateMessage(user.username,message));
        callback();
    })

    socket.on('sendLocation', (postion,callback) => {
        io.emit('message','Location')
        callback();
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if(user) {
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left !`));
            io.to(user.room).emit('roomData',{
                room:user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})



server.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})