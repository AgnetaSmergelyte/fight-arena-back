const {Server} = require('socket.io');
const userDb = require("../schemas/userSchema");

const weapons = [
    "https://wow.zamimg.com/images/wow/icons/large/inv_staff_2h_inscription_c_01_blue.jpg",
    "https://wow.zamimg.com/images/wow/icons/large/inv_knife_1h_primalistraid_d_02.jpg",
    "https://wow.zamimg.com/images/wow/icons/large/inv_sword_1h_broker2boss_d_01_red.jpg",
    "https://wow.zamimg.com/images/wow/icons/large/inv_sword_40.jpg",
    "https://wow.zamimg.com/images/wow/icons/large/inv_polearm_2h_draenorchallenge_d_01_02.jpg",
    "https://wow.zamimg.com/images/wow/icons/large/inv_sword_42.jpg",
    "https://wow.zamimg.com/images/wow/icons/large/inv_sword_10.jpg",
    "https://wow.zamimg.com/images/wow/icons/large/inv_staff_2h_drakonid_c_02.jpg",
    "https://wow.zamimg.com/images/wow/icons/large/inv_sword_1h_broker2boss_d_01_green.jpg",
    "https://wow.zamimg.com/images/wow/icons/large/inv_sword_22.jpg"
];

const armors = [
    "https://wow.zamimg.com/images/wow/icons/large/inv_chest_plate_dragonpvp_d_01.jpg",
    "https://wow.zamimg.com/images/wow/icons/large/inv_chest_leather_08.jpg",
    "https://wow.zamimg.com/images/wow/icons/large/inv_chest_plate06.jpg",
    "https://wow.zamimg.com/images/wow/icons/large/inv_chest_mail_raidshaman_p_01.jpg",
    "https://wow.zamimg.com/images/wow/icons/large/inv_chest_chain.jpg",
    "https://wow.zamimg.com/images/wow/icons/large/inv_chest_mail_pvpshaman_o_01.jpg",
    "https://wow.zamimg.com/images/wow/icons/large/inv_chest_leather_03.jpg",
    "https://wow.zamimg.com/images/wow/icons/large/inv_chest_chain_12.jpg",
    "https://wow.zamimg.com/images/wow/icons/large/inv_chest_chain_07.jpg",
    "https://wow.zamimg.com/images/wow/icons/large/inv_chest_plate08.jpg"
];

const grades = ['A', 'B', 'C'];
const effects = ['Critical chance', 'Dodge chance', 'Life steal chance'];

function rnd(num) {
    //random integer from 0 to (num-1)
    return Math.floor(Math.random() * num);
}

function rndInterval(num1, num2) {
    //random integer from num1 to num2
    return Math.floor(Math.random() * (num2 - num1 + 1) + num1);
}

function uid() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

function generateGradeAEffects() {
    const newEffects = [];
    if (rnd(2) === 1) newEffects.push({name: effects[0], chance: rndInterval(1, 50)});
    if (rnd(2) === 1) newEffects.push({name: effects[1], chance: rndInterval(1, 40)});
    if (rnd(2) === 1) newEffects.push({name: effects[2], chance: rndInterval(1, 50)});
    return newEffects;
}

function generateGradeBEffects() {
    const newEffects = [];
    if (rnd(2) === 1) {
        const EffectIndex = rnd(effects.length);
        if (EffectIndex === 1) {
            newEffects.push({name: effects[EffectIndex], chance: rndInterval(1, 40)});
        } else {
            newEffects.push({name: effects[EffectIndex], chance: rndInterval(1, 50)});
        }
    }
    return newEffects;
}

async function takeAwayMyMoney(username) {
    const userExists = await userDb.findOne({username});
    if (!userExists) {
        return false;
    } else {
        if (userExists.money >= 100) {
            const money = userExists.money - 100;
            await userDb.findOneAndUpdate(
                {username},
                {$set: {money}},
            )
            return money;
        }
    }
}

async function addNewItem(username, item) {
    const userExists = await userDb.findOne({username});
    if (userExists) {
        const inventory = [...userExists.inventory, item]
        await userDb.findOneAndUpdate(
            {username},
            {$set: {inventory}},
        )
        return inventory;
    } else return false;
}

async function removeItem(username, item) {
    const userExists = await userDb.findOne({username});

    if (userExists) {
        console.log('item:', item)
        const newInventory = userExists.inventory.filter(x => x.id !== item.id)
        console.log(newInventory)
        await userDb.findOneAndUpdate(
            {username},
            {$set: {inventory: newInventory}},
        )
        return newInventory;
    } else return false;
}

function generateItems() {
    //generate weapon:
    const weapon = {
        id: uid(),
        type: 'weapon',
        image: weapons[rnd(weapons.length)],
        grade: grades[rnd(grades.length)]
    }
    if (weapon.grade === 'A') {
        weapon.power = rndInterval(6, 30);
        weapon.gold = rnd(11);
        weapon.effectSlots = generateGradeAEffects();
    }
    if (weapon.grade === 'B') {
        weapon.power = rndInterval(3, 20);
        weapon.gold = rnd(7);
        weapon.effectSlots = generateGradeBEffects();
    }
    if (weapon.grade === 'C') {
        weapon.power = rndInterval(1, 5);
        weapon.gold = rnd(3);
        weapon.effectSlots = [];
    }

    //generate armor:
    const armor = {
        id: uid(),
        type: 'armor',
        image: armors[rnd(weapons.length)],
        grade: grades[rnd(grades.length)]
    }
    if (armor.grade === 'A') {
        armor.power = rndInterval(10, 90);
        armor.effectSlots = generateGradeAEffects();
    }
    if (armor.grade === 'B') {
        armor.power = rndInterval(0, 50);
        armor.effectSlots = generateGradeBEffects();
    }
    if (armor.grade === 'C') {
        armor.power = rndInterval(0, 20);
        armor.effectSlots = [];
    }
    //generate potion
    const potion = {
        id: uid(),
        type: 'potion',
        image: 'https://wow.zamimg.com/images/wow/icons/large/inv_potion_51.jpg',
        power: rndInterval(1, 100)
    }

    return [weapon, armor, potion]
}

module.exports = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "http://localhost:3000"
        }
    });
    let onlineUsers = [];

    io.on('connection', (socket) => {
        console.log('a user connected', socket.id);

        socket.on('logged', user => {
            const newUser = {...user, socketId: socket.id};
            if (!onlineUsers.find(x => x.socketId === socket.id)) {
                const index = onlineUsers.indexOf(newUser.username)
                if (index !== -1) {
                    onlineUsers[index].socketId = socket.id;
                } else {
                    onlineUsers.push(newUser);
                }
            }
            io.emit('userList', onlineUsers);
        })

        socket.on('getUsersOnline', () => {
            io.to(socket.id).emit('userList', onlineUsers);
        })

        socket.on('generateItems', async() => {
            const myUser = onlineUsers.find(x => x.socketId === socket.id);
            if (myUser) {
                const updatedMoney = await takeAwayMyMoney(myUser.username);
                if (updatedMoney) {
                    const items = generateItems();
                    io.to(socket.id).emit('items', {items, money: updatedMoney});
                }
            }
        })

        socket.on('takeItem', async (item) => {
            const myUser = onlineUsers.find(x => x.socketId === socket.id);
            if (myUser) {
                const inventory = await addNewItem(myUser.username, item);
                if (inventory) io.to(socket.id).emit('inventory', inventory);
            }
        })

        socket.on('removeItem', async (item)=> {
            const myUser = onlineUsers.find(x => x.socketId === socket.id);
            if (myUser) {
                const inventory = await removeItem(myUser.username, item);
                if (inventory) io.to(socket.id).emit('inventory', inventory);
            }
        })

        socket.on("requestToPlay", val => {
            const requestFrom = onlineUsers.find(x => x.socketId === socket.id);
            if (requestFrom && val.inventory.length === 3) {
                const player1 = {
                    socketId: requestFrom.socketId,
                    username: requestFrom.username,
                    image: requestFrom.image,
                    weapon: val.inventory[0],
                    armor: val.inventory[1],
                    potion: val.inventory[2],
                    hp: 100
                }
                if (val.requestTo) io.to(val.requestTo).emit('request', player1);
            }
        })

        socket.on("cancelRequest", answerTo => {
            const sender = onlineUsers.find(x => x.socketId === socket.id);
            const answer = "no";
            io.to(answerTo).emit('answer', {sender: sender.username, answer});
        })

        socket.on("acceptRequest", val => {
            //val.inventory ir val.player1
            const answerFrom = onlineUsers.find(x => x.socketId === socket.id);
            if (answerFrom && val.player1 && val.inventory.length === 3) {
                const player2 = {
                    socketId: answerFrom.socketId,
                    username: answerFrom.username,
                    image: answerFrom.image,
                    weapon: val.inventory[0],
                    armor: val.inventory[1],
                    potion: val.inventory[2],
                    hp: 100
                }
                const roomName = uid();
                const answer = "yes";
                io.to(val.player1.socketId).emit('answer', {answer});
                io.to(val.player1.socketId).emit('gotTheRoom', {roomName, player1: val.player1, player2});
                io.to(player2.socketId).emit('gotTheRoom', {roomName, player1: val.player1, player2});
            }
        })

        socket.on("join", roomName => {
            socket.join(roomName);
        })

        socket.on("hit", (roomName) => {
            io.to(roomName).emit("details", "hit msg");
        })

        socket.on('logout', () => {
            onlineUsers = onlineUsers.filter(x => x.socketId !== socket.id);
            io.emit('userList', onlineUsers);
        });

        socket.on('disconnect', () => {
            onlineUsers = onlineUsers.filter(x => x.socketId !== socket.id);
            io.emit('userList', onlineUsers);
            console.log('A user disconnected');
        });
    });
}