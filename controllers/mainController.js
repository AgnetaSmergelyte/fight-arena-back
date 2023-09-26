const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userDb = require("../schemas/userSchema");

const resSend = (res, error, data, message) => {
    res.send({error, data, message});
}

const monsterImages = [
    "https://digimonsuperrumble.com/mo/img/idx/sec3_digimon1.png",
    "https://digimonsuperrumble.com/mo/img/idx/sec3_digimon2.png",
    "https://digimonsuperrumble.com/mo/img/idx/sec3_digimon3.png",
    "https://digimonsuperrumble.com/mo/img/idx/sec3_digimon4.png",
    "https://digimonsuperrumble.com/mo/img/idx/sec3_digimon5.png",
    "https://digimonsuperrumble.com/mo/img/idx/sec3_digimon6.png",
    "https://digimonsuperrumble.com/mo/img/idx/sec3_digimon7.png",
    "https://digimonsuperrumble.com/mo/img/idx/sec3_digimon8.png",
    "https://shop.bandai.co.uk/wp-content/uploads/2023/05/bandai-digimon-ghost-game-hero-001.png",
    "https://images.ctfassets.net/hnoi7ctzfs57/7IXk2MBvYvAsePeVBOjrHn/12e14c3239cc6e6b0e0c5734424e8b6e/____.png",
    "https://dro.gameking.com/image/digimon-ter.png",
    "https://comicvine.gamespot.com/a/uploads/original/11130/111301681/8333056-growlmon%28digimon%29.png",
]

async function findAvailableImages() {
    const availableImages = [];
    const allUserImages = await userDb.find();
    monsterImages.map(x => {
        const imageTaken = Boolean(allUserImages.find(y => y.image === x));
        availableImages.push({image: x, taken: imageTaken});
    });
    return availableImages;
}

module.exports = {
    signup: async (req, res) => {
        const {username, password, image} = req.body;
        const hash = await bcrypt.hash(password, 10);
        const user = new userDb({
            username,
            password: hash,
            image
        })
        try {
            await user.save();
            resSend(res, false, null, 'Registered');
        } catch (err) {
            resSend(res, true, null, 'Registration failed');
        }
    },
    login: async (req, res) => {
        const {username, password} = req.body;
        const userExists = await userDb.findOne({username});
        if (!userExists) {
            return resSend(res, true, null, 'User does not exist');
        } else {
            const isValid = await bcrypt.compare(password, userExists.password);
            if (!isValid) return resSend(res, true, null, 'Wrong password');
        }
        const user = {
            username,
            id: userExists._id
        }
        const token = jwt.sign(user, process.env.JWT_SECRET);
        const myUser = {
            username,
            id: userExists._id,
            image: userExists.image,
            money: userExists.money,
            inventory: userExists.inventory
        }
        console.log(myUser);
        resSend(res, false, {user: myUser, token}, 'Logged in successfully');
    },
    getUser: async (req, res) => {
        const user = req.user;
        const userLegit = await userDb.findOne({_id: user.id});
        const myUser = {
            username: userLegit.username,
            id: userLegit._id,
            image: userLegit.image,
            money: userLegit.money,
            inventory: userLegit.inventory
        }
        resSend(res, false, myUser, '');
    },
    getImages: async (req, res) => {
        const images = await findAvailableImages();
        resSend(res, false, images, '');
    }

}