const mongoose=require("mongoose");
var userSchema = mongoose.Schema({
    fname: String,
    lname: String,
    email: String,
    secret:String,
    googleId:String,
    facebookId:String,
});

module.exports = userSchema;