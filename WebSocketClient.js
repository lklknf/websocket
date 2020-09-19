const Client = require('websocket').client;
const EventEmitter = require('events');
const {sleep} = require('@nnnx/node-utils');

class WebSocketClient extends EventEmitter {

    constructor(options = {}) {
        super();
        this.handleConnect = this.handleConnect.bind(this);
        this.handleError = this.handleError.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
        this.isConnected = this.isConnected.bind(this);
        this.connect = this.connect.bind(this);
        this.close = this.close.bind(this);

        const {
            serverUrl,
            protocol,
            logMessages = false,
            autoConnect = false,
            autoReconnect = true,
            debug = false,
            timeout = 5000,
        } = options;

        this.logMessages = logMessages;
        this.debug = debug;
        this.serverUrl = serverUrl;
        this.protocol = protocol;
        this.autoReconnect = autoReconnect;
        this.reconnecting = false;
        this.timeout = timeout;

        if (autoConnect) {
            this.connect();
        }
    }

    async reconnect() {
        if (this.reconnecting) {
            return;
        }

        this.log('reconnecting');
        this.reconnecting = true;
        await sleep(1000);
        this.reconnecting = false;
        this.connect();
    }

    connect() {
        this.client = new Client();

        if (typeof this.serverUrl === 'string') {
            this.client.connect(this.serverUrl, this.protocol);
        } else {
            throw Error('no serverUrl provided');
        }

        return new Promise((resolve, reject) => {
            setTimeout(()=>{
                reject({message: `WebSocketClient failed to connect before timeout (${this.timeout}  ms)`});
            }, this.timeout);

            this.client.on('connectFailed', error => {
                reject(error);
            });

            this.client.on('connect', connection => {
                this.handleConnect(connection);
                resolve(connection);
            });
        });
    }

    disconnect() {
        this.close();
    }

    close() {
        return new Promise((resolve) => {
            if (this.connection) {
                this.connection.close();
                this.connection.once('close', (reasonCode, description) => {
                    resolve(reasonCode, description);
                });
            } else {
                resolve(null);
            }

        });
    }

    isConnected() {
        return this.connection && this.connection.connected;
    }

    handleConnect(connection) {

        this.connection = connection;

        connection.on('error', error => {
            this.handleError(error);
        });

        connection.on('close', (reasonCode, description) => {
            this.handleClose(reasonCode, description);
        });

        connection.on('message', message => {
            this.handleMessage(message);
        });

        this.emit('connect', connection);
    }

    handleError(error) {
        this.log('Connection error: ' + JSON.stringify(error));
        this.emit('connection_error', error);

        if (this.autoReconnect) {
            this.reconnect().then();
        }
    }

    handleClose(reasonCode, description) {
        this.log('Connection closed: ' + JSON.stringify({reasonCode, description}));
        this.emit('disconnect', {reasonCode, description});

        if (this.autoReconnect) {
            this.reconnect().then();
        }
    }

    handleMessage(message) {
        if (message.type === 'utf8') {
            message = JSON.parse(message.utf8Data);
        }

        if (this.logMessages) {
            console.log(message);
        }

        this.emit('message', message);
    }

    sendMessage(message) {
        if (this.connection) {
            this.connection.sendUTF(
                JSON.stringify(message));
            this.emit('message_sent', message);
            return;
        }

        throw Error('sendMessage called with no connection');
    }

    log(message) {
        if (this.debug) {
            console.log('[' + this.serverUrl + ']' + message);
        }
    }
}

module.exports = WebSocketClient;
