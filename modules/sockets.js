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
let rooms = [];

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
async function addMoney(username, winnings) {
    const userExists = await userDb.findOne({username});
    if (!userExists) {
        return false;
    } else {
        const money = userExists.money + winnings;
        await userDb.findOneAndUpdate(
            {username},
            {$set: {money}},
        )
        return money;
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
        const newInventory = userExists.inventory.filter(x => x.id !== item.id)
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
        weapon.gold = rndInterval(1, 10);
        weapon.effectSlots = generateGradeAEffects();
    }
    if (weapon.grade === 'B') {
        weapon.power = rndInterval(3, 20);
        weapon.gold = rndInterval(1, 6);
        weapon.effectSlots = generateGradeBEffects();
    }
    if (weapon.grade === 'C') {
        weapon.power = rndInterval(1, 5);
        weapon.gold = rndInterval(1, 3);
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
function hit(attacker, victim) {
    //check if dodges
    let dodgeChance = 0;
    const dodgeFromWeapon = victim.weapon.effectSlots.find(x => x.name === effects[1]);
    if (dodgeFromWeapon) dodgeChance += dodgeFromWeapon.chance;
    if (victim.armor) {
        const dodgeFromArmor = victim.armor.effectSlots.find(x => x.name === effects[1]);
        if (dodgeFromArmor) dodgeChance += dodgeFromArmor.chance;
    }
    //generate rnd number from 1 to 100 and if not bigger than dodge chance, then dodged
    if (rndInterval(1, 100) <= dodgeChance) return {attacker, victim}
    //else (no dodge)
    let damage = rndInterval(1, attacker.weapon.power);
    //check critical:
    let criticalChance = 0;
    const criticalFromWeapon = attacker.weapon.effectSlots.find(x => x.name === effects[0]);
    if (criticalFromWeapon) criticalChance += criticalFromWeapon.chance;
    if (attacker.armor) {
        const criticalFromArmor = attacker.armor.effectSlots.find(x => x.name === effects[0]);
        if (criticalFromArmor) criticalChance += criticalFromArmor.chance;
    }
    if (rndInterval(1, 100) <= criticalChance) damage *= 2;
    //check live steal
    let liveStealChance = 0;
    const liveStealFromWeapon = attacker.weapon.effectSlots.find(x => x.name === effects[2]);
    if (liveStealFromWeapon) liveStealChance += liveStealFromWeapon.chance;
    if (attacker.armor) {
        const liveStealFromArmor = attacker.armor.effectSlots.find(x => x.name === effects[2]);
        if (liveStealFromArmor) liveStealChance += liveStealFromArmor.chance;
    }
    if (rndInterval(1, 100) <= liveStealChance) {
        victim.hp -= 1;
        if (attacker.hp < 100) attacker.hp += 1;
    }
    //defence
    if (victim.armor) {
        const percentsBlocked = rnd(victim.armor.power + 1);
        damage = Math.round((damage * (100 - percentsBlocked)) / 100);
    }
    //gold
    const gold = rnd(attacker.weapon.gold + 1);
    attacker.gold += gold;

    victim.hp -= damage;
    if (victim.hp < 0) victim.hp = 0;
    return {attacker, victim}
}

module.exports = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "http://localhost:3000"
        }
    });
    let onlineUsers = [];

    io.on('connection', (socket) => {
        socket.on('logged', user => {
            const newUser = {...user, socketId: socket.id};
            onlineUsers.push(newUser);
            io.emit('userList', onlineUsers);
        })

        socket.on('getUsersOnline', () => {
            io.to(socket.id).emit('userList', onlineUsers);
        })

        socket.on('generateItems', async () => {
            const myUser = onlineUsers.find(x => x.socketId === socket.id);
            if (myUser) {
                const updatedMoney = await takeAwayMyMoney(myUser.username);
                if (updatedMoney || updatedMoney === 0) {
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

        socket.on('removeItem', async (item) => {
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
                    hp: 100,
                    gold: 0
                }
                if (val.requestTo) io.to(val.requestTo).emit('request', player1);
            }
        })

        socket.on("cancelRequest", answerTo => {
            const sender = onlineUsers.find(x => x.socketId === socket.id);
            const answer = sender.username + " denied your request";
            io.to(answerTo).emit('answer', answer);
        })

        function handleLagers(beforeCount, roomName) {
            setTimeout(() => {
                const roomData = rooms.find(x => x.roomName === roomName);
                if (!roomData) return;
                if (beforeCount === roomData.count) {
                    if (roomData.turn === roomData.player1.username) {
                        roomData.turn = roomData.player2.username;
                    } else {
                        roomData.turn = roomData.player1.username;
                    }
                    roomData.count++;
                    io.to(roomData.roomName).emit("attackResults", roomData);
                    handleLagers(beforeCount +1, roomName)
                }
            }, 20000)
        }

        socket.on("acceptRequest", val => {
            //val = {inventory, player1}
            //if user who requested disconnected or is already in another fight
            const requester = onlineUsers.find(x => x.socketId === val.player1.socketId);
            if (!requester) {
                const answer = "User already disconnected";
                io.to(socket.id).emit('answer', answer);
                return;
            } else if (rooms.find(x => x.player1.socketId === requester.socketId || x.player2.socketId  === requester.socketId)) {
                const answer = "User is already in another fight";
                io.to(socket.id).emit('answer', answer);
                return;
            }
            const answerFrom = onlineUsers.find(x => x.socketId === socket.id);
            if (answerFrom && val.player1 && val.inventory.length === 3) {
                const player2 = {
                    socketId: answerFrom.socketId,
                    username: answerFrom.username,
                    image: answerFrom.image,
                    weapon: val.inventory[0],
                    armor: val.inventory[1],
                    potion: val.inventory[2],
                    hp: 100,
                    gold: 0
                }
                const roomName = uid();
                const roomInfo = {roomName, player1: val.player1, player2, turn: player2.username, gameOver: false, count: 0};
                io.to(val.player1.socketId).emit('gotTheRoom', roomInfo);
                io.to(player2.socketId).emit('gotTheRoom', roomInfo);
                rooms.push(roomInfo);
                handleLagers(0, roomName);
            }
        })

        socket.on("join", roomName => {
            socket.join(roomName);
        })

        socket.on("attack", async (roomName) => {
            //find needed room and its info:
            const roomData = rooms.find(x => x.roomName === roomName);
            if (!roomData) return;
            //check turn
            if (onlineUsers.find(x => x.socketId === socket.id).username !== roomData.turn) return;
            roomData.count++;
            if (socket.id === roomData.player1.socketId) {
                const result = hit(roomData.player1, roomData.player2);
                roomData.player1 = result.attacker;
                roomData.player2 = result.victim;
                if (roomData.player2.hp === 0) {
                    roomData.gameOver = true;
                    roomData.player2.image = "https://clipart-library.com/data_images/36955.png";
                    await addMoney(roomData.player1.username, roomData.player1.gold);
                } else {
                    roomData.turn = roomData.player2.username;
                }
            } else {
                const result = hit(roomData.player2, roomData.player1);
                roomData.player2 = result.attacker;
                roomData.player1 = result.victim;
                if (roomData.player1.hp === 0) {
                    roomData.gameOver = true;
                    roomData.player1.image = "https://clipart-library.com/data_images/36955.png";
                    await addMoney(roomData.player2.username, roomData.player2.gold);
                } else {
                    roomData.turn = roomData.player1.username;
                }
            }
            io.to(roomData.roomName).emit("attackResults", roomData);
            if (roomData.gameOver) rooms = rooms.filter(x => x.roomName !== roomData.roomName);
            const fixCount = roomData.count;
            handleLagers(fixCount, roomName);
        });

        socket.on('potion', async (roomName) => {
            //find room the user is in and update room data
            const roomData = rooms.find(x => x.roomName === roomName);
            if (!roomData) return;
            let potion;
            let username;
            if (socket.id === roomData.player1.socketId) {
                username = roomData.player1.username;
                potion = roomData.player1.potion;
                if (!potion) return;
                roomData.player1.hp += potion.power;
                if (roomData.player1.hp > 100) roomData.player1.hp = 100;
                roomData.player1.potion = null;
            } else if (socket.id === roomData.player2.socketId) {
                username = roomData.player2.username;
                potion = roomData.player2.potion;
                if (!potion) return;
                roomData.player2.hp += potion.power;
                if (roomData.player2.hp > 100) roomData.player2.hp = 100;
                roomData.player2.potion = null;
            }
            io.to(roomData.roomName).emit("attackResults", roomData);
            //update inventory and DB
            const userExists = await userDb.findOne({username});
            if (userExists) {
                const newInventory = userExists.inventory.filter(x => x.id !== potion.id)
                await userDb.findOneAndUpdate(
                    {username},
                    {$set: {inventory: newInventory}},
                )
                io.to(socket.id).emit('inventory', newInventory);
            }
        });

        socket.on('logout', () => {
            onlineUsers = onlineUsers.filter(x => x.socketId !== socket.id);
            rooms = rooms.filter(x => x.player1.socketId !== socket.id && x.player2.socketId !== socket.id);
            io.emit('userList', onlineUsers);
        });

        socket.on('disconnect', () => {
            onlineUsers = onlineUsers.filter(x => x.socketId !== socket.id);
            rooms = rooms.filter(x => x.player1.socketId !== socket.id && x.player2.socketId !== socket.id);
            io.emit('userList', onlineUsers);
        });
    });
}