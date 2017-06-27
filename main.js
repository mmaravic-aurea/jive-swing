$(document).ready(function () {

    let chattables = [];
    let activeChattable;

    let client = new XmppClient();

    client.onDirectMessage(m => updateMessages(m.from.bare, m.from.bare, m.body));
    client.onChannelMessage(m => updateMessages(m.from.resource, m.from.bare, m.body));

    $("#connect").click(function () {
        const username = $("#jid").val() + "@swing/" + generateId(12);
        const password = $("#pass").val();
        const protocol = $("#protocol").val();

        client.authenticate(username, password, protocol, (status) => onAuthentication(status));
    });

    $("#disconnect").click(function () {
        client.disconnect();
    });

    $("#send").click(() => sendMessage());
    $("#msg").keypress(e => {
        let keycode = e.keyCode || e.which;
        if (keycode === 13) {
            sendMessage();
            return false;
        }
    });

    // dec2hex :: Integer -> String
    function dec2hex(dec) {
        return ('0' + dec.toString(16)).substr(-2)
    }

    // generateId :: Integer -> String
    function generateId(len) {
        var arr = new Uint8Array((len || 40) / 2)
        window.crypto.getRandomValues(arr)
        return Array.from(arr, dec2hex).join('')
    }

    function onAuthentication(status) {

        if (status == Strophe.Status.CONNECTING) {
            $("#messages").append("<i>Strophe is connecting...</i><br>");
        } else if (status == Strophe.Status.CONNFAIL) {
            $("#messages").append("<i>Strophe failed to connec!.</i><br>");
        } else if (status == Strophe.Status.DISCONNECTING) {
            $("#messages").append("<i>Strophe is disconnecting...</i><br>");
        } else if (status == Strophe.Status.DISCONNECTED) {
            $("#messages").append("<i>Strophe is disconnected!</i><br>");
        } else if (status == Strophe.Status.CONNECTED) {
            $("#messages").append("<i>Strophe is connected!</i><br>");
            chattables = [];
            $("#channels").empty();
            $("#users").empty();

            client.getChannels((channels) => displayChannels(channels));
        }
        /*
                client.getChannels((channels) => displayChannels(channels));
                client.getDirectMessages((dms) => displayDirectMessages(dms));
                client.getHistory((messages) => updateHistory(messages)); */
    }

    function displayChannels(channels) {
        var channelJids = $(channels).find('item').map(function() {return this.getAttribute('jid')}).get();

        channelJids.forEach(c => addChattable($("#channels"), c, true));
        channelJids.forEach(c => client.joinChannel(c, $("#jid").val()));
    }

    function displayDirectMessages(dms) {
        dms.forEach(dm => addChattable($("#users"), dm, false));
    }

    function addChattable(body, jid, isChannel) {
        const dom = $(`<a href='#' class='list-group-item list-group-item-action'>${jid}</a>`);
        body.append(dom);

        const chattable = {
            dom: dom,
            history: [],
            jid: jid,
            isChannel: isChannel
        };

        chattables.push(chattable);
        dom.click(() => setActiveChattable(chattable));

        return chattable;
    }

    function sendMessage() {
        if (!$("#msg").val()) {
            return;
        }
        const to = activeChattable.jid;
        const msg = $("#msg").val();

        $("#msg").val("");

        if (activeChattable.isChannel) {
            client.sendChannelMessage(to, msg)
        } else {
            client.sendDirectMessage(to, msg);
            updateMessages($("#jid").val(), to, msg)
        }

        $("#msg").focus();
    }

    function setActiveChattable(chattable) {
        if (activeChattable) {
            activeChattable.dom.removeClass("active");
        }
        chattable.dom.removeClass("font-weight-bold");
        chattable.dom.addClass("active");
        activeChattable = chattable;

        $("#messages").empty();
        chattable.history.forEach(h => insertMessage(h.from, h.message));
    }

    function updateMessages(fromJid, chattableJid, message) {
        let chattable = chattables.find(c => c.jid === chattableJid);
        if (!chattable) {
            chattable = addChattable($("#users"), chattableJid, false);
        }
        chattable.history.push({
            from: fromJid,
            message: message
        });
        if (chattable === activeChattable) {
            insertMessage(fromJid, message);
        } else {
            chattable.dom.addClass("font-weight-bold");
        }
    }

    function insertMessage(sender, message) {
        let dom = $("#messages");
        dom.append(`<p class="card-text"><strong>${sender} </strong> ${message}</p>`)
            .scrollTop(dom[0].scrollHeight);
    }

    function updateHistory(messages) {
        messages
            .filter(m => m.type === 'chat')//groupchat are also received by event(onChannelMessage). Possible solution: store msg id and ignore duplicates
            .forEach(m => addMessageToHistory(m));
    }

    function addMessageToHistory(msg) {
        let to = msg.to.bare;
        let from = msg.from.bare;

        let sendByMe = from === $("#jid").val();

        chattables.find(c => c.jid === (sendByMe ? to : from)).history.push({
            from: from,
            message: msg.body
        });
    }
});