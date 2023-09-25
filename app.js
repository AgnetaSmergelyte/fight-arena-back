const express = require("express");
const app = express();
const cors = require("cors");
const router = require("./router/mainRouter");
const mongoose = require("mongoose");
const {createServer} = require('node:http');
const {Server} = require('socket.io');
const jwt = require("jsonwebtoken");

require("dotenv").config()

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000"
    }
});

let onlineUsers = [];

io.on('connection', (socket) => {
    console.log('a user connected', socket.id);
    const token = socket.handshake.query.token; // jwt token passed from client

    // authenticate
    try {
        if (!token) throw new Error("Token not found");
        jwt.verify(token, process.env.JWT_SECRET, (err, data) => {
            if (err) {
                socket.emit("authFailed");
                socket.disconnect();
            }
            if (!onlineUsers.find(x => x.id === socket.id)) {
                const index = onlineUsers.indexOf(data.username)
                if (index !== -1) {
                    onlineUsers[index].id = socket.id;
                } else {
                    onlineUsers.push({username: data.username, id: socket.id});
                }
            }
            io.emit('userList', onlineUsers);
        })
    } catch (err) {
        // jwt verification failed
        socket.emit("authFailed");
        socket.disconnect();
    }

    socket.on('disconnect', () => {
        onlineUsers = onlineUsers.filter(x => x.id !== socket.id);
        io.emit('userList', onlineUsers);
        console.log('A client disconnected');
    });
});

server.listen(3001, () => {
    console.log('server running at http://localhost:3001')
});

mongoose.connect(process.env.DB_KEY)
    .then(() => {
        console.log('connection success')
    }).catch(e => {
    console.log('ERROR', e)
})

app.use(cors());
app.use(express.json());
app.use("/", router);

const port = 8080;

app.listen(port);