const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({
    origin: '*'
}));

const http = require('http');
const server = http.createServer(app);
const port = 7000;
let clients = [];

const {Server} = require('socket.io');
const io = new Server(server,{
    cors: {
        origin: '*',
        methods: ["GET","POST"]
    }
});

const createNewClient = (id) => {
    if (clients.length === 0 || !clients.includes(id)){
        clients.push(id);
        pushed = true;
    }
    return id;
}


const getApiAndEmit = socket => {
    const response = new Date();
    socket.emit("FromAPI",response);
}

let interval;
io.on('connection', (socket) => {


    io.to(socket.id).emit("id",createNewClient(socket.id))
    console.log(`Un usuario se ha conectado. Tenemos ${clients.length} clientes conectados.`);
    if (interval) {
        clearInterval(interval);
    }
    interval = setInterval( () => getApiAndEmit(socket),1000);

    socket.on('chat', (msg) => {
        console.log("Mensaje: "+msg.msg)
        io.emit("chat",msg)
    })
    socket.on("disconnect", () => {
        console.log(`Un usuario se ha desconectado. Tenemos ${clients.length} clientes conectados.`);
        clearInterval(interval);
        for (let i=0;i<clients.length;i++){
            let clientId = clients[i];
            if (socket.id === clientId){
                clients.splice(i,1);
                break;
            }
        }
    })
})


app.get('/', (req,res)=> {
    res.send({response: "I'm alive"}).status(200);
})

server.listen(port, () => {
    console.log("Server running on port: "+port);
})