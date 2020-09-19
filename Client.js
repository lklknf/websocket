const uuidv4 = require('uuid/v4');

class Client {
    constructor({
                    id = uuidv4(),
                    connection,
                    creationDate = new Date()
                }) {
        this.id = id;
        this.creationDate = creationDate;
        this.connection = connection;
        this.clientInfo = null;
    }

    // noinspection JSUnusedGlobalSymbols
    send(message) {
        this.connection.sendUTF(JSON.stringify(message));
    }

    getConnectionInfo() {
        const {
            closeDescription, //After the connection is closed, contains a textual description of the reason for the connection closure, or null if the connection is still open.
            closeReasonCode, //After the connection is closed, contains the numeric close reason status code, or -1 if the connection is still open.
            socket, //The underlying net.Socket instance for the connection.
            protocol, //The subprotocol that was chosen to be spoken on this connection. This field will have been converted to lower case.
            extensions, //An array of extensions that were negotiated for this connection. Currently unused, will always be an empty array.
            remoteAddress, //The IP address of the remote peer as a string. In the case of a server, the X-Forwarded-For header will be respected and preferred for the purposes of populating this field. If you need to get to the actual remote IP address, webSocketConnection.socket.remoteAddress will provide it.
            webSocketVersion, //A number indicating the version of the WebSocket protocol being spoken on this connection.
            connected
        } = this.connection;

        return {
            closeDescription,
            closeReasonCode,
            socket,
            protocol,
            extensions,
            remoteAddress,
            webSocketVersion,
            connected
        }
    }

    getNormalizedConnectionInfo() {
        const info = this.getConnectionInfo();
        delete info['socket'];
        return info;
    }

    // noinspection JSUnusedGlobalSymbols
    normalize() {
        return {
            id: this.id,
            creationDate: this.creationDate,
            connection: this.getNormalizedConnectionInfo(),
            clientInfo: this.clientInfo,
        }
    }
}

module.exports = Client;
