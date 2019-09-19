const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//create schema
const TokenSchema = new Schema({
    domain: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true
    },
    user: {
        type: String,
        required: true
    },
});

mongoose.model('tokens', TokenSchema);