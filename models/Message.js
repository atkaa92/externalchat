const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//create schema
const MessageSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true
    },
    guest_id: {
        type: String,
        required: true,
        default: 'admin'
    },
    date: {
        type: Date,
        default: Date.now
    }
});

mongoose.model('messages', MessageSchema);