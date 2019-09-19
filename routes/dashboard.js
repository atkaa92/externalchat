const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const router = express.Router();
const {ensureAuthenticaed} = require('../helpers/auth')

//load modals
require('../models/User');
const User = mongoose.model('users')
require('../models/Token');
const Token = mongoose.model('tokens')

router.get('/', ensureAuthenticaed, (req, res) => {
    res.render('dashboard/index')
})

router.get('/admin', ensureAuthenticaed, (req, res) => {
    var token = req.user.token;
    if (!token) {
        req.flash('error_msg', 'You need to register token under your domain to use chat dashboard');
        res.redirect('/dashboard/token')
    }else{
        res.render('dashboard/admin', {token : token})
    }
})

router.get('/token', ensureAuthenticaed, (req, res) => {
    var token = req.user.token;
    res.render('dashboard/token', {token : token})
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
                                    console.log(token);
                                    req.flash('success_msg', 'Token has been genereted');
                                    res.redirect('/dashboard/token');
                                })
                            
                        })
                })
    }
})

module.exports = router;