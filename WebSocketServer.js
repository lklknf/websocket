const WsServer = require('websocket').server;
const http = require('http');
const {deNormalize} = require('@nnnx/utils');
const EventEmitter = require('events');
const Client = require('./Client');

class WebSocketServer extends EventEmitter {
    constructor(options = {}) {
        super();
        let {
            port = 8080,
            debug = false,
        } = options;

        this.run = this.run.bind(this);
        this.handleConnect = this.handleConnect.bind(this);
        this.handleDisconnect = this.handleDisconnect.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
        this.debug = debug;
        this.port = port;
        this.clients = {};
    }

    run() {
        const server = http.createServer(function (request, response) {
            response.writeHead(404);
            response.end();
        });
        this.httpServer = server;
        this.wsServer = new WsServer({
            httpServer: server,
            autoAcceptConnections: false
        });

        // noinspection JSUnresolvedFunction
        this.wsServer.on('request', (request) => {
            const connection = request.accept(null, request.origin);
            this.handleConnect(connection);
        });

        return new Promise((resolve, reject) => {
            console.log(`Starting @nnnx WebSocketServer instance on port ${this.port}`);
            server.listen(this.port, () => {
                resolve({port: this.port});
                console.log(`@nnnx WebSocketServer successfully started on port ${this.port}`);
            });

            server.on('error', e => {
                console.log(`Failed to start @nnnx WebSocketServer instance on port ${this.port}. Error: ${e.message}`);
                reject(e);
            })
        });

    }

    static createClient(connection) {
        return new Client({connection});
    }

    handleConnect(connection) {

        const client = WebSocketServer.createClient(connection);

        if (this.debug) {
            console.log('client ' + client.id + ' connected');
        }

        this.clients[client.id] = client;

        connection.on('close', (reasonCode, description) => {
            this.handleDisconnect(client, reasonCode, description);
        });

        connection.on('message', message => {
            this.handleMessage(client, message);
        });

        this.emit('client-connected', client);
    }

    handleDisconnect(client, reasonCode, description) {
        if (this.debug) {
            console.log('client ' + client.id + ' disconnected');
            console.log('reasonCode: ' + reasonCode + ', description: ' + description);
        }
        delete this.clients[client.id];
        this.emit('client-disconnected', client, reasonCode, description);
    }

    handleMessage(client, message) {
        if (message.type === 'utf8') {
            this.emit('message', client, JSON.parse(message.utf8Data));
        } else if (message.type === 'binary') {
            this.emit('message', client, message.binaryData);
        }
    }

    getConnectionCount() {
        return new Promise((resolve, reject) => {
            this.httpServer.getConnections((error, count) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(count);
                }
            })
        });
    }

    getClients() {
        return deNormalize(this.clients);
    }

    sendToClient(id, msg, type = 'utf') {
        const client = this.clients[id];
        if (client && client.connection) {
            const connection = client.connection;
            switch (type) {
                case 'utf':
                    // noinspection JSUnresolvedFunction
                    connection.sendUTF(JSON.stringify(msg));
                    return true;
                case 'binary':
                    connection.sendBytes(msg);
                    return true;
                default:
                    throw Error('unknown message type');
            }
        }
        return false;
    }

    sendBytes(bytes) {
        this.send(bytes, 'binary');
    }

    send(msg, type = 'utf') {
        let count = 0;
        Object.keys(this.clients).forEach(id => {
            if (this.sendToClient(id, msg, type)) {
                count++;
            }
        });
        if (this.debug) {
            console.log(`WebSocketServer (port ${this.getPort()}): packet sent to ${count} clients`);
        }
    }

    getPort() {
        return this.port
    }
}

module.exports = WebSocketServer;
