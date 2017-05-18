function XmppClient() {

    let client;
    let ee = new EventEmitter();

    this.authenticate = function (username, password, callback) {
        client = XMPP.createClient({
            jid: username,
            password: password,

            transport: 'websocket',

             wsURL: 'wss://jive-swing-xmpp-exp.ecs.devfactory.com/ws/',
             boshURL: 'https://jive-swing-xmpp-exp.ecs.devfactory.com/http-bind/'

            //wsURL: 'ws://localhost:7070/ws/',
            //boshURL: 'http://localhost:7070/http-bind/'
        });

        client.on('session:started', () => {
            client.sendPresence();
            callback("success");
        });

        client.on('auth:failed', () => callback("failure"));

        client.on('chat', (msg) => ee.emitEvent('direct-message', [msg]));
        client.on('groupchat', (msg) => ee.emitEvent('channel-message', [msg]));

        client.connect();
    };

    this.sendDirectMessage = function (to, message) {
        client.sendMessage({
            to: to,
            type: "chat",
            body: message
        });
    };

    this.sendChannelMessage = function (channel, message) {
        client.sendMessage({
            to: channel,
            type: "groupchat",
            body: message
        });
    };

    this.getChannels = (callback) => client.getDiscoItems("conference.swing", "",
        (err, data) => callback(getRooms(data)));

    this.getDirectMessages = (callback) => client.getRoster((err, data) => callback(getDirectMessages(data)));

    this.joinChannel = (jid, nick) => {
        client.joinRoom(jid, nick, {
            joinMuc: {
                history: true
            }
        });

        client.requestRoomVoice(jid);
    };

	//This function loads the entire history, icluding room history - which is also sent by default by openfire. 
	//Check https://github.com/legastero/stanza.io/blob/master/docs/Reference.md#clientsearchhistoryopts-cb for search options
	this.getHistory = (callback) => client.searchHistory({}, (err, data) => callback(getHistoryMessages(data)));
	
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