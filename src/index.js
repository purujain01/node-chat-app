const express = require('express')
const path = require('path')
const socketio = require('socket.io')
const http = require('http')
const Filter = require('bad-words')
const { generateMessage,locationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUserInRoom } = require('./utils/users')

const app = express()
const publicDirectoryPath = path.join(__dirname,'../public')
const port = process.env.PORT || 3000
const server = http.createServer(app) 
const io = socketio(server)

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    console.log('New Connection setup')

    socket.on('join',(options, callback) => {
        const { Error, user } = addUser({ id:socket.id, ...options})

        if(Error){
            return callback(Error)
        }

        socket.join(user.room)
        socket.emit('message', generateMessage('Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.username} is joined!`))

        io.to(user.room).emit('roomData',{
            room: user.room,
            users: getUserInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()
        if(filter.isProfane(message)){
            return callback('Do not use bad words')
        }
        io.to(user.room).emit('message', generateMessage(user.username,message))
        callback()
    })

    socket.on('sendLocation', (position, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage',locationMessage(user.username,`https://google.com/maps?q=${position.latitude},${position.longitude}`))
        callback()
    })
    
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message', generateMessage('Admin',`${user.username} has left the chat!`))
        }

        io.to(user.room).emit('roomData',{
            room: user.room,
            users: getUserInRoom(user.room)
        })
    })
})

server.listen(port, () => {
    console.log(`Server started at port ${port}`)
})