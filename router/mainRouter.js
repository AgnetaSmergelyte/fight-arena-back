const express = require("express");
const router = express.Router();

const {
    signup,
    login,
    getUser,
    getImages
} = require("../controllers/mainController");
const {
    validateSignUp,
    validateLogIn,
    validateUser
} = require("../middleware/validators");

router.post("/signup", validateSignUp, signup);
router.post("/login", validateLogIn, login);
router.get("/getUser", validateUser, getUser);
router.get("/images", getImages);

module.exports = router;