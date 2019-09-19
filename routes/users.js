const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const router = express.Router();
const {ensureAuthenticaed} = require('../helpers/auth')

//load modals
require('../models/User');
const User = mongoose.model('users')

//user routes
router.get('/login', (req, res) => {
    res.render('users/login')
})
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/dashboard/admin',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
})
router.get('/register', (req, res) => {
    res.render('users/register')
})
router.post('/register', (req, res) => {
    let errors = [];
    if (req.body.password != req.body.password2) {
        errors.push({ text: 'Passwords do not match' })
    }
    if (req.body.password.length < 4) {
        errors.push({ text: 'Password mast be at least 4 characters' })
    }
    if (errors.length > 0) {
        res.render('users/register', {
            errors: errors,
            name: req.body.name,
            email: req.body.email,
        })
    } else {
        User.findOne({ email: req.body.email })
            .then(user => {
                if (user) {
                    req.flash('warning_msg', 'Email already taken');
                    res.redirect('/users/register')
                } else {
                    const newUser = new User({
                        name: req.body.name,
                        email: req.body.email,
                        password: req.body.password
                    })
                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(newUser.password, salt, (err, hash) => {
                            if (err) throw err;
                            newUser.password = hash;
                            newUser.save()
                                .then(user => {
                                    req.flash('success_msg', 'User registered');
                                    res.redirect('/users/login');
                                })
                                .catch(err => {
                                    console.log(err);
                                    return;
                                })
                        })
                    })
                }
            })
    }
})
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'Tou are logged out')
    res.redirect('/users/login');
})
module.exports = router;