const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({
    origin: '*'
}));

const http = require('http');
const server = http.createServer(app);
const port = 8080;
let last20Msgs = [];
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
        clients.push({
            id: id,
            name: null
        });
        pushed = true;
    }
    return id;
}

const getAlias = (id) => {
    for (let i = 0; i < clients.length; i++) {
        const client = clients[i];
        if (client.id === id){
            return client.name;
            break;
        }
        
    }
}

const newMsg = (msg) => {
    console.log("Mensaje: "+msg.msg)
    last20Msgs.push(msg);
    if (last20Msgs.length >= 20){
        last20Msgs.shift();
    }
    io.emit("chat",msg)

}


const getApiAndEmit = socket => {
    const response = new Date();
    socket.emit("FromAPI",response);
}

let interval;
io.on('connection', (socket) => {


    io.to(socket.id).emit("id",createNewClient(socket.id));
    io.to(socket.id).emit("lastMsgs",last20Msgs);
    console.log(`Un usuario se ha conectado. Tenemos ${clients.length} clientes conectados.`);
    if (interval) {
        clearInterval(interval);
    }
    interval = setInterval( () => getApiAndEmit(socket),1000);

    socket.on('chat', (msg) => {
        if (msg.msg === "/reset"){
            last20Msgs = [];
        }else{
            newMsg(msg);
        }
        
    })

    //Cambio o seteo de nombre
    socket.on('changeName', (name) => {
        let alias = socket.id;
        for (let i = 0; i < clients.length; i++) {
            if (socket.id === clients[i].id){
                alias = clients[i].name;
                clients[i].name =name;
                break
            }
            
        }
        //Avisar del cambio de nombre
        console.log("El usuario "+alias+" se ha cambiado el alias a: "+name)
        if (alias !== null){
            const msg = {
                msg: "El usuario "+alias+" se ha cambiado el alias a: "+name,
                date: new Date(),
                name: "Servidor",
                id: null
            }
            
            newMsg(msg);
        }else{
            let msg = {
                msg: name+" se ha conectado.",
                date: new Date(),
                name: "Servidor",
                id:null
            }
            
            newMsg(msg);
        }
        io.emit("userEvent",clients)
    })


    socket.on("disconnect", () => {
        //Quitar usuario de la lista del servidor
        const alias = getAlias(socket.id);
        console.log(`Un usuario se ha desconectado. Tenemos ${clients.length} clientes conectados.`);
        clearInterval(interval);
        for (let i=0;i<clients.length;i++){
            let clientId = clients[i].id;
            if (socket.id === clientId){
                clients.splice(i,1);
                break;
            }
        }
        //Avisar a los usuarios de la desconexión de tal usuario
        let msg = {
            user: alias,
            msg: alias+" se ha desconectado.",
            date: new Date(),
            id: null
        }
        newMsg(msg);
        io.emit("userEvent",clients)
    })
})


app.get('/', (req,res)=> {
    res.send({response: "I'm alive"}).status(200);
})

server.listen(port, () => {
    console.log("Server running on port: "+port);
})