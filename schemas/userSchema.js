const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    money: {
        type: Number,
        required: true,
        default: 100
    },
    inventory: {
        type: Array,
        required: true,
        default: []
    }

});

const user = mongoose.model("arena-users", userSchema);
module.exports = user;