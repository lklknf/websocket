const WebSocketClient = require('../WebSocketClient');
const WebSocketServer = require('../WebSocketServer');


async function run(){
    const port = 8313;

    const client1 = new WebSocketClient({serverUrl: 'ws://localhost:' + port, onMessage: message =>{
            console.log('From server: ' + message);
        }});

    const client2 = new WebSocketClient({serverUrl: 'ws://localhost:' + port, onMessage: message =>{
            console.log('From server: ' + message);
        }});

    const server = new WebSocketServer({
        port,
        debug: true,
    });

    server.on('message',
        (clientId , message) =>{
            console.log(`From client ${clientId}: ` + message);
            server.send("Hey from server");
        }
    );

    await server.run();
    await client1.connect();
    console.log('clients connected: ' + server.getClients().length);
    console.log('connections: ' + await server.getConnectionCount());
    await client2.connect();
    console.log('clients connected: ' + server.getClients().length);
    console.log('connections: ' + await server.getConnectionCount());
    client1.sendMessage('Hey from client 1');
    client2.sendMessage('Hey from client 2');
    await client1.close();
    console.log('clients connected: ' + server.getClients().length);
    console.log('connections: ' + await server.getConnectionCount());
    await client2.close();
    console.log('clients connected: ' + server.getClients().length);
    console.log('connections: ' + await server.getConnectionCount());
}

run().then(()=>{
    console.log('closing process succesfully');
    process.exit();
}).catch(error=>{
    console.log(error);
    process.exit();
});
