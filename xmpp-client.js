function XmppClient() {

    let connection;
    let ee = new EventEmitter();

    this.authenticate = function (username, password, protocol, callback) {
        if (protocol === "bosh")
            connection = new Strophe.Connection('http://localhost:5280/http-bind');
        else
            connection = new Strophe.Connection('ws://localhost:5290/ws');
		
        connection.connect(username, password, callback);
/*
        connection.on('chat', (msg) => ee.emitEvent('direct-message', [msg]));
        connection.on('groupchat', (msg) => ee.emitEvent('channel-message', [msg]));
        connection.enableKeepAlive({
            'interval': 5,
            'timeout': 10
        });

        connection.connect();
        */
    };

    this.disconnect = function() {
        connection.disconnect();
    }

    this.sendDirectMessage = function (to, message) {
        connection.send(new Strophe.Builder('message', { to: to, body: message}));
    };

    this.sendChannelMessage = function (channel, message) {
        connection.sendMessage({
            to: channel,
            type: "groupchat",
            body: message
        });
    };

    this.getChannels = (callback) => connection.disco.items("muc.swing", callback);

    this.getDirectMessages = (callback) => connection.getRoster((err, data) => callback(getDirectMessages(data)));

    this.joinChannel = (jid, nick) => {
        connection.muc.join(jid, nick, onChannelMessage, dummy, dummy, null, { maxstanzas: 10, seconds: 3600 });
//        connection.requestRoomVoice(jid);
    };

    this.dummy = function() {

    }

    //This function loads the entire history, icluding room history - which is also sent by default by openfire.
    //Check https://github.com/legastero/stanza.io/blob/master/docs/Reference.md#clientsearchhistoryopts-cb for search options
    this.getHistory = (callback) => connection.searchHistory({}, (err, data) => callback(getHistoryMessages(data)));

    this.onDirectMessage = (handler) => ee.addListener('direct-message', handler);

    this.onChannelMessage = (handler) => ee.addListener('channel-message', handler);

    function getDirectMessages(data) {
        return data.roster.items.map(i => i.jid.bare);
    }

    function getRooms(data) {
        return data.discoItems.items.map(i => i.jid.bare);
    }

    function getHistoryMessages(data) {
        return data.mamResult.items.map(i => i.forwarded.message);
    }
}