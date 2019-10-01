const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const SlackBot = require('slackbots');
const router = express.Router();
const {ensureAuthenticaed} = require('../helpers/auth')

//glob constatnts
const globconst = require('../config/globconst');

//load modals
require('../models/User');
const User = mongoose.model('users')
require('../models/Token');
const Token = mongoose.model('tokens')
require('../models/Bot');
const Bot = mongoose.model('bots')

router.get('/', ensureAuthenticaed, (req, res) => {
    res.render('dashboard/index')
})

router.get('/admin', ensureAuthenticaed, (req, res) => {
    var token = req.user.token;
    if (!token) {
        req.flash('error_msg', 'You need to register token under your domain to use chat dashboard');
        res.redirect('/dashboard/token')
    }else{
        res.render('dashboard/admin', {token : token, uri : globconst.socketURI})
    }
})

router.get('/token', ensureAuthenticaed, (req, res) => {
    res.render('dashboard/token', {token : req.user.token, uri : globconst.socketURI})
})

router.put('/token', (req, res) => {
    let errors = [];
    let domain = req.body.domain;
    let filteredDomain = false;
    let re = new RegExp(/(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/); 
    let ifMatch =   domain.match(re);
    if (ifMatch) {
        var myRegexp = /(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/;
        var match = myRegexp.exec(domain);
        filteredDomain = match[0]
    }
    if (!filteredDomain) {
        errors.push({ text: 'Not valid domain' })
        res.render('dashboard/token', {
            errors: errors,
        })
    } else {
        User.findOne({ _id: req.user._id })
                .then(user => {
                    let token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                    user.token = token;
                    user.save()
                        .then(user => {
                            const newToken = {
                                domain: filteredDomain,
                                user: req.user._id,
                                token: token
                            }
                            new Token(newToken)
                                .save()
                                .then(token => {
                                    req.flash('success_msg', 'Token has been genereted');
                                    res.redirect('/dashboard/token');
                                })
                            
                        })
                })
    }
})

router.post('/bot', (req, res) => {
    let errors = [];
    if (req.body.name == '' || req.body.token == '' || req.body.channel == '') {
        errors.push({ text: 'Not valid data' })
    }
    if (errors.length > 0) {
        res.render('dashboard/bot', {
            errors: errors,
            name: req.body.name,
            token: req.body.token,
            channel: req.body.channel
        })
    } else {
        const newBot = new Bot({
            name: req.body.name.trim(),
            bottoken: req.body.token.trim(),
            channel: req.body.channel.trim(),
            token: req.user.token,
            user: req.user._id,
            active: req.body.active == 'on' ? 1 : 0,
        })
        newBot.save() 
                .then(bot1 => {
                    var myBott1 = new SlackBot({
                        token : bot1.bottoken.trim(),
                        name : bot1.name.trim()
                    })
                    myBott1.on('error', function(data) {
                        console.log(data);
                        delete myBott1;
                        req.flash('error_msg', 'Invalid data or problems with slack connection. If you are sure that your data is correct just try again after one miute');
                        res.redirect('/dashboard/bot');
                        return; 
                    })
                    myBott1.on('start', function(data) {
                        myBott1.getChannel(bot1.channel)
                                .then(channel => {
                                        delete myBott1;
                                    if (typeof channel == 'undefined') {
                                        req.flash('error_msg', 'Channel dosen\'t exists');
                                        res.redirect('/dashboard/bot');
                                    }else{
                                        req.flash('success_msg', 'Bot has been registered');
                                        res.redirect('/dashboard/admin');
                                    }
                                })
                    })
                })
                .catch(err => {
                    console.log(err);
                    return;
                })
    }
})


router.put('/bot', (req, res) => {
    let errors = [];
    if (req.body.name == '' || req.body.token == '' || req.body.channel == '') {
        errors.push({ text: 'Not valid data' })
    }
    if (errors.length > 0) {
        res.render('dashboard/bot', {
            errors: errors,
            name: req.body.name,
            token: req.body.token,
            channel: req.body.channel
        })
    } else {
        Bot.findOne({ user: req.user._id, token: req.user.token})
            .then(bot => {
                bot.name = req.body.name.trim(),
                bot.bottoken = req.body.token.trim(),
                bot.channel = req.body.channel.trim(),
                bot.active = req.body.active == 'on' ? 1 : 0,
                bot.save()
                    .then(bot2 => {
                        var myBott2 = new SlackBot({
                            token : bot2.bottoken.trim(),
                            name : bot2.name.trim()
                        })
                        myBott2.on('error', function(data) {
                            delete myBott2;
                            req.flash('error_msg', 'Invalid data or problems with slack connection. If you are sure that your data is correct just try again after one miute');
                            res.redirect('/dashboard/bot');
                            return; 
                        })
                        myBott2.on('start', function(data) {
                            myBott2.getChannel(bot2.channel)
                                    .then(channel => {
                                            delete myBott2;
                                        if (typeof channel == 'undefined') {
                                            req.flash('error_msg', 'Channel dosen\'t exists');
                                            res.redirect('/dashboard/bot');
                                        }else{
                                            req.flash('success_msg', 'Bot has been updated');
                                            res.redirect('/dashboard/admin');
                                        }
                                    })
                        })
                    })
                    .catch(err => {
                        console.log(err);
                        return;
                    })
            })
    }
})

router.get('/bot', ensureAuthenticaed, (req, res) => {
    Bot.findOne({ user: req.user._id, token: req.user.token})
            .then(bot => {
                res.render('dashboard/bot', {bot : bot})
            })
})

module.exports = router;