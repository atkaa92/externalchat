const mongoose = require('mongoose');
const globconst = require('../config/globconst');
const SlackBot = require('slackbots');

require('../models/Token');
require('../models/Message');
require('../models/Bot');
const Token = mongoose.model('tokens')
const Message = mongoose.model('messages')
const Bot = mongoose.model('bots')
var allLoginUsers = {};

Array.prototype.arr_remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
}

module.exports = (function (io) {
    io.of('/chat').
    on('connection', function (socket) {
            Bot.findOne({ token : socket.handshake.query.token})
                .then(bott => {
                    if(bott){ 
                        if (typeof myBot == 'undefined') {
                            myBot = new SlackBot({
                                token : bott.bottoken,
                                name : bott.name
                            })
                            myBot.on('error', function(data) {
                                delete  myBot;
                                return; 
                            })
                            myBot.on('message', function(data) {
                                if (data.type == 'message' && data.subtype != 'bot_message') {
                                    let text = data.text;
                                    var myRegexp = /\(@*[a-z A-Z 0-9]*\)/;
                                    var match = myRegexp.exec(text);
                                    if (match) {
                                        var guestId = match[0];
                                        text = text.replace(guestId, '')
                                        var myRegexp1 = /<@*[a-z A-Z 0-9]*>/;
                                        var match1 = myRegexp1.exec(text);
                                        text = text.replace(match1 ? match1[0] : '', '');
                                        guestId = guestId.replace('(@', '').replace(')', '').trim();
                                        let token = allLoginUsers['guests'][guestId]['token'];
                                        Bot.findOne({ token : token})
                                            .then(bott => {
                                                if(bott && bott.active == 1){
                                                    let data1 = {
                                                        'guestId' : guestId,
                                                        'message' : text,
                                                    }
                                                    const newMessage = {
                                                        guest_id: data1.guestId,
                                                        token: token,
                                                        name: 'Admin',
                                                        text: data1['message']
                                                    }
                                                    new Message(newMessage)
                                                        .save()
                                                        .then(message => {
                                                            clients = io.of('/chat').clients();
                                                            conClients = clients.connected
                                                            for (var p in conClients) {
                                                                if (typeof allLoginUsers[conClients[p].client.id] != 'undefined') {
                                                                    if (allLoginUsers[conClients[p].client.id]['guest_id'] == data1.guestId && allLoginUsers[conClients[p].client.id]['token'] == token) {
                                                                        conClients[p].emit('adminChatToUser', data1);
                                                                    }
                                                                    if ( allLoginUsers[conClients[p].client.id]['role'] == 'admin' && allLoginUsers[conClients[p].client.id]['token'] == token) {
                                                                        conClients[p].emit('anotherAdminMessage', data1);
                                                                    }
                                                                }else{
                                                                    conClients[p].emit('smthWentWrong');
                                                                }
                                                            }
                                                        })
                                                }
                                            })
                                    }else{
                                        return
                                    }
                                }else{
                                    return;
                                }
                            });
                        }
                    }
                }) 
        var token = socket.handshake.query.token;
        var role = (socket.handshake.headers.referer.indexOf("dashboard/admin") > -1) ? 'admin' : 'user';
        var name = (socket.handshake.headers.referer.indexOf("dashboard/admin") > -1) ? 'Admin' : 'Myuser';
        var guest_id = role == 'admin' ? 'admin' : socket.handshake.query.guest_id;
        var newUser = { id : socket.client.id, role : role, name : name, token : token, guest_id : guest_id, conDate : new Date(), };
        if (typeof allLoginUsers[token] == 'undefined') allLoginUsers[token] = {}
        if (typeof allLoginUsers['guests'] == 'undefined') allLoginUsers['guests'] = {}
        allLoginUsers[token][socket.client.id] = newUser;
        allLoginUsers[socket.client.id] = newUser;
        if (guest_id  != 'admin') {
                if (typeof allLoginUsers['guests'][guest_id] == 'undefined' || allLoginUsers['guests'][guest_id]['name'] == 'Myuser') {
                    if (typeof allLoginUsers['guests'][guest_id] == 'undefined') {
                        allLoginUsers['guests'][guest_id] = {
                            role : role, 
                            name : name, 
                            token : token, 
                            guest_id : guest_id, 
                            clients : [socket.client.id]
                        };
                    }else{
                        allLoginUsers['guests'][guest_id]['clients'].push(socket.client.id);
                    }
                    socket.emit('activateChatBtn'); 
                }else{
                    if (allLoginUsers['guests'][guest_id]['name'] != 'Myuser') {
                        let name = allLoginUsers['guests'][guest_id]['name'];
                        allLoginUsers['guests'][guest_id]['clients'].push(socket.client.id);
                        allLoginUsers[socket.client.id]['name'] = name;
                        allLoginUsers[token][socket.client.id]['name'] = name;
                        Message.find({ guest_id: guest_id })
                                .sort({date: 'asc'})
                                .then(messages => {
                                    socket.emit('userReconect', { name : name, messages :  messages}); 
                                    clients = io.of('/chat').clients();
                                    conClients = clients.connected
                                    for (var p in conClients) {
                                        if (typeof allLoginUsers[conClients[p].client.id] != 'undefined') {
                                            if (allLoginUsers[conClients[p].client.id]['role'] == 'admin' && allLoginUsers[conClients[p].client.id]['token'] == token) {
                                                conClients[p].emit('adminUserReconect', { guest_id : guest_id, name :  name}); 
                                            }
                                        }else{
                                            conClients[p].emit('smthWentWrong');
                                        }
                                    }
                                })
                    }
            }
        }

        if (role == 'admin') {
            clients = io.of('/chat').clients();
            conClients = clients.connected
            for (var p in conClients) {
                if (typeof allLoginUsers[conClients[p].client.id] != 'undefined') {
                    if (allLoginUsers[conClients[p].client.id]['role'] == 'admin' && allLoginUsers[conClients[p].client.id]['token'] == token) {
                        conClients[p].emit('usersList', {allLoginUsers : allLoginUsers[token], thisId : conClients[p].client.id});
                    }
                }else{
                    conClients[p].emit('smthWentWrong');
                }
            }
       };


        socket.on('setusername', function (data) {
            let name = data.name;
            let guestId = data.guestId;
            var token = allLoginUsers[socket.client.id]['token']
            Token.findOne({ token: token })
                    .then(tokken => {
                        var pointDomain = typeof socket.handshake.headers.referer != 'undefined' ? socket.handshake.headers.referer : null;
                        var registeredDomain = tokken.domain;
                        if (pointDomain) {
                            if(pointDomain.indexOf(registeredDomain) !== -1 ){
                                allLoginUsers[socket.client.id]['name'] = name;
                                allLoginUsers['guests'][guestId]['name'] = name;
                                allLoginUsers[token][socket.client.id]['name'] = name;
                                var clients = io.of('/chat').clients();
                                let guestClients = allLoginUsers['guests'][guestId]['clients'];
                                var conClients = clients.connected
                                var multipleConnected = [];
                                for (var p in conClients) {
                                    if (typeof allLoginUsers[conClients[p].client.id] != 'undefined') {
                                        if (allLoginUsers[conClients[p].client.id]['role'] == 'admin' && allLoginUsers[conClients[p].client.id]['token'] == token) {
                                            conClients[p].emit('usersList', {allLoginUsers : allLoginUsers[token], thisId : conClients[p].client.id});
                                        }
                                        if (guestClients.includes(conClients[p].client.id) && allLoginUsers[conClients[p].client.id]['token'] == token) {
                                            multipleConnected.push(conClients[p]);
                                        }
                                    }else{
                                        conClients[p].emit('smthWentWrong');
                                    }
                                }
                                if (multipleConnected.length) {
                                    Message.find({ guest_id: guestId })
                                            .sort({date: 'asc'})
                                            .then(messages => {
                                                // there is a warning 'multipleConnected[p].emit is not a function' , but everthing works fine
                                                for (var p in multipleConnected) {
                                                    if (messages.length) {
                                                        multipleConnected[p].emit('userReconect', { name : name, messages :  messages}); 
                                                    }else{
                                                        multipleConnected[p].emit('enterUser', {name : name}); 
                                                    }
                                                }
                                            })
                                }
                            }else{
                                socket.disconnect();
                            }
                        }else{
                            socket.disconnect();
                        }
                    })
        });

        socket.on('disconnect', function () {
            if (typeof allLoginUsers[socket.client.id] != 'undefined') {
                var guestId = allLoginUsers[socket.client.id]['guest_id']
                delete allLoginUsers[socket.client.id];
                delete allLoginUsers[token][socket.client.id];
                if (guestId != 'admin') {
                    allLoginUsers['guests'][guestId]['clients'].arr_remove(socket.client.id)
                    if (!allLoginUsers['guests'][guestId]['clients'].length) {
                        clients = io.of('/chat').clients();
                        conClients = clients.connected
                        for (var p in conClients) {
                            if (typeof allLoginUsers[conClients[p].client.id] != 'undefined') {
                                if (allLoginUsers[conClients[p].client.id]['role'] == 'admin' && allLoginUsers[conClients[p].client.id]['token'] == token) {
                                    conClients[p].emit('someoneDisconected', guestId);
                                }
                            }else{
                                conClients[p].emit('smthWentWrong');
                            }
                        }
                    }
                }
            }
        });


        socket.on('chatToUser', function (data) {
            const newMessage = {
                guest_id: data.guestId,
                token: allLoginUsers[socket.client.id]['token'],
                name: allLoginUsers[socket.client.id]['name'],
                text: data['message']
            }
            new Message(newMessage)
                .save()
                .then(message => {
                    clients = io.of('/chat').clients();
                    conClients = clients.connected
                    for (var p in conClients) {
                        if (typeof allLoginUsers[conClients[p].client.id] != 'undefined') {
                            if (allLoginUsers[conClients[p].client.id]['guest_id'] == data.guestId && allLoginUsers[conClients[p].client.id]['token'] == token) {
                                conClients[p].emit('adminChatToUser', data);
                            }
                            if (conClients[p].client.id != socket.client.id && allLoginUsers[conClients[p].client.id]['role'] == 'admin' && allLoginUsers[conClients[p].client.id]['token'] == token) {
                                conClients[p].emit('anotherAdminMessage', data);
                            }
                        }else{
                            conClients[p].emit('smthWentWrong');
                        }
                    }
                })
        });

        socket.on('getUserMessages', function (data) {
            var guestId = data.guestId
            Message.find({ guest_id: guestId })
                    .sort({date: 'desc'})
                    .then(messages => {
                        socket.emit('setUserMessages', { msgs : messages})
                    })
        });
 
        socket.on('chatToAdmin', function (data) {
            const newMessage = {
                guest_id: data['guestId'],
                token: allLoginUsers['guests'][data['guestId']]['token'],
                name: allLoginUsers['guests'][data['guestId']]['name'],
                text: data['message']
            }
            Bot.findOne({ token : allLoginUsers['guests'][data['guestId']]['token']})
                .then(bott => {
                    if(bott && bott.active == 1){ 
                        if (typeof myBot == 'undefined') {
                            myBot = new SlackBot({
                                token : bott.bottoken,
                                name : bott.name
                            })
                            myBot.on('error', function(data) {
                                delete  myBot;
                                return; 
                            })
                            myBot.on('message', function(data) {
                                if (data.type == 'message' && data.subtype != 'bot_message') {
                                    let text = data.text;
                                    var myRegexp = /\(@*[a-z A-Z 0-9]*\)/;
                                    var match = myRegexp.exec(text);
                                    if (match) {
                                        var guestId = match[0];
                                        text = text.replace(guestId, '')
                                        var myRegexp1 = /<@*[a-z A-Z 0-9]*>/;
                                        var match1 = myRegexp1.exec(text);
                                        text = text.replace(match1 ? match1[0] : '', '');
                                        guestId = guestId.replace('(@', '').replace(')', '').trim();
                                        let token = allLoginUsers['guests'][guestId]['token'];
                                        Bot.findOne({ token : token})
                                            .then(bott => {
                                                if(bott && bott.active == 1){
                                                    let data1 = {
                                                        'guestId' : guestId,
                                                        'message' : text,
                                                    }
                                                    const newMessage = {
                                                        guest_id: data1.guestId,
                                                        token: token,
                                                        name: 'Admin',
                                                        text: data1['message']
                                                    }
                                                    new Message(newMessage)
                                                        .save()
                                                        .then(message => {
                                                            clients = io.of('/chat').clients();
                                                            conClients = clients.connected
                                                            for (var p in conClients) {
                                                                if (typeof allLoginUsers[conClients[p].client.id] != 'undefined') {
                                                                    if (allLoginUsers[conClients[p].client.id]['guest_id'] == data1.guestId && allLoginUsers[conClients[p].client.id]['token'] == token) {
                                                                        conClients[p].emit('adminChatToUser', data1);
                                                                    }
                                                                    if ( allLoginUsers[conClients[p].client.id]['role'] == 'admin' && allLoginUsers[conClients[p].client.id]['token'] == token) {
                                                                        conClients[p].emit('anotherAdminMessage', data1);
                                                                    }
                                                                }else{
                                                                    conClients[p].emit('smthWentWrong');
                                                                }
                                                            }
                                                        })
                                                }
                                            })
                                    }else{
                                        return
                                    }
                                }else{
                                    return;
                                }
                            });
                            myBot.postMessageToChannel( bott.channel, `${allLoginUsers['guests'][data['guestId']]['name']} - ${data['message']} (@${data['guestId']})`, { icon_emoji: globconst.botemoji });
                        }else{
                            myBot.postMessageToChannel( bott.channel, `${allLoginUsers['guests'][data['guestId']]['name']} - ${data['message']} (@${data['guestId']})`, { icon_emoji: globconst.botemoji });
                        }
                    }
                })
            new Message(newMessage)
                .save()
                .then(message => {
                    data.name = allLoginUsers['guests'][data['guestId']]['name']
                    clients = io.of('/chat').clients();
                    conClients = clients.connected
                    for (var p in conClients) {
                        if (typeof allLoginUsers[conClients[p].client.id] != 'undefined') {
                            if (allLoginUsers[conClients[p].client.id]['role'] == 'admin' && allLoginUsers[conClients[p].client.id]['token'] == token) {
                                conClients[p].emit('chatToAdmin', data);
                            }
                            if (conClients[p].client.id != socket.client.id && allLoginUsers[conClients[p].client.id]['guest_id'] == data['guestId'] && allLoginUsers[conClients[p].client.id]['token'] == token) {
                                conClients[p].emit('anotherUserMessage', data);
                            }
                        }else{
                            conClients[p].emit('smthWentWrong');
                        }
                    }
                })
        });
    });
});