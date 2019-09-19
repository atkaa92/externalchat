const mongoose = require('mongoose');
require('../models/Token');
const Token = mongoose.model('tokens')
var allLoginUsers = {};

module.exports = (function (io) {
    io.of('/chat').
    on('connection', function (socket) {
        var token = socket.handshake.query.token;
        var role = (socket.handshake.headers.referer.indexOf("dashboard/admin") > -1) ? 'admin' : 'user';
        var name = (socket.handshake.headers.referer.indexOf("dashboard/admin") > -1) ? 'Admin' : 'User';
        newUser = {id: socket.client.id, role : role, name : name, token : token};
        if (typeof allLoginUsers[token] == 'undefined') allLoginUsers[token] = {}
        allLoginUsers[token][socket.client.id] = newUser;
        allLoginUsers[socket.client.id] = newUser;

        if (role == 'admin') {
            clients = io.of('/chat').clients();
            conClients = clients.connected
            for (var p in conClients) {
                if (allLoginUsers[conClients[p].client.id]['role'] == 'admin' && allLoginUsers[conClients[p].client.id]['token'] == token) {
                    conClients[p].emit('usersList', {allLoginUsers : allLoginUsers[token], thisId : conClients[p].client.id});
                }
            }
       };

        socket.on('setusername', function (name) {
            var token = allLoginUsers[socket.client.id]['token']
            Token.findOne({ token: token })
                    .then(tokken => {
                        var pointDomain = typeof socket.handshake.headers.referer != 'undefined' ? socket.handshake.headers.referer : null;
                        var registeredDomain = tokken.domain;
                        if (pointDomain) {
                            if(pointDomain.indexOf(registeredDomain) !== -1 ){
                                allLoginUsers[socket.client.id]['name'] = name;
                                clients = io.of('/chat').clients();
                                conClients = clients.connected
                                var adminIsConnected = false;
                                var myNewUser = false;
                                for (var p in conClients) {
                                    if (allLoginUsers[conClients[p].client.id]['role'] == 'admin' && allLoginUsers[conClients[p].client.id]['token'] == token) {
                                        conClients[p].emit('usersList', {allLoginUsers : allLoginUsers[token], thisId : conClients[p].client.id});
                                        adminIsConnected = true;
                                    }
                                    if (conClients[p].client.id == socket.client.id && allLoginUsers[conClients[p].client.id]['token'] == token) {
                                        myNewUser = conClients[p]
                                    }
                                }
                                if (myNewUser) {
                                    newUser.isAdminConnected = adminIsConnected ? true : false;
                                    myNewUser.emit('enterUser', newUser); 
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
            delete allLoginUsers[socket.client.id];
            delete allLoginUsers[token][socket.client.id];
            clients = io.of('/chat').clients();
            conClients = clients.connected
            for (var p in conClients) {
                if (allLoginUsers[conClients[p].client.id]['role'] == 'admin' && allLoginUsers[conClients[p].client.id]['token'] == token) {
                    conClients[p].emit('someoneDisconected', socket.client.id);
                }
            }
        });

        socket.on('chatToUser', function (data) {
            clients = io.of('/chat').clients();
            conClients = clients.connected
            for (var p in conClients) {
                if (allLoginUsers[conClients[p].client.id]['id'] == data.chatroom && allLoginUsers[conClients[p].client.id]['token'] == token) {
                    conClients[p].emit('adminChatToUser', data);
                }
            }
        });

        socket.on('chatToAdmin', function (data) {
            currId = socket.client.id
            data.chatroom = currId;
            data.name = allLoginUsers[socket.client.id]['name']
            clients = io.of('/chat').clients();
            conClients = clients.connected
            for (var p in conClients) {
                if (allLoginUsers[conClients[p].client.id]['role'] == 'admin' && allLoginUsers[conClients[p].client.id]['token'] == token) {
                    conClients[p].emit('chatToAdmin', data);
                }
            }
        });
    });
});