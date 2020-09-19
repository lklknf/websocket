const WebSocketClient = require('../WebSocketClient');

async function run(){
    const port = 8313;
    const client = new WebSocketClient({
        serverUrl: 'ws://localhost:' + port,
        timeout: 200,
    });
    await client.connect();
}

run().then(()=>{
    console.log('closing process succesfully');
    process.exit();
}).catch(error=>{
    console.log(error);
    process.exit();
});
