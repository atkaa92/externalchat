const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//create schema
const BotSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    bottoken: {
        type: String,
        required: true
    },
    channel: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: false
    },
    user: {
        type: String,
        required: false
    },
    active: {
        type: String,
        default: 1
    },
    date: {
        type: Date,
        default: Date.now
    }
});

mongoose.model('bots', BotSchema);