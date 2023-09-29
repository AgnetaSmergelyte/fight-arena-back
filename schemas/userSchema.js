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
        default: 300
    },
    inventory: {
        type: Array,
        required: true,
        default: [
            {
                id: '000',
                type: 'weapon',
                grade: 'C',
                power: 1,
                gold: 1,
                effectSlots: [],
                image: 'https://wow.zamimg.com/images/wow/icons/large/inv_sword_04.jpg'
            },
        ]
    }
});

const user = mongoose.model("arena-users", userSchema);
module.exports = user;