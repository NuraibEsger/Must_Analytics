const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/auth')
.then(() => {
  console.log("mongodb connected");
}).catch((err) => {
  console.log(err);
});

const UserSchema = new mongoose.Schema({
    email: {
        type:String,
        required: true
    },
    password: {
        type:String,
        required: true
    }
});

const collection = new mongoose.model("loginUsers", UserSchema);

module.exports = collection