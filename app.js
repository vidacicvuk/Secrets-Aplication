//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const bcrypt = require("bcrypt");

const saltRounds = 10;

const app = express();

mongoose.connect("mongodb://localhost:27017/userDB")

app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({
    extended:true
}));

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
})


userSchema.plugin(encrypt,{secret:process.env.SECRET, encryptedFields: ["password"]})

const User = new mongoose.model("User",userSchema);


app.get("/",(req,res)=>{
    res.render("home")
})

app.get("/login",(req,res)=>{
    res.render("login")
})

app.get("/register",(req,res)=>{
    res.render("register")
})

app.post("/register",(req,res)=>{
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        const newUser = new User({
            email: req.body.username,
            password: hash
        })
        newUser.save((err)=>{
            if(err){
                console.log(err);
            }else{
                res.render("secrets");
            }
        })
    });


    

})

app.post("/login",(req,res)=>{
console.log(req.body.username)
   User.findOne({email:req.body.username},(err,foundUser)=>{
    if(err){
        console.log(err);
    }else{
        if(!foundUser){
                console.log("No user with " + req.body.username + " found in the register database. Please register yourself first.")

            res.redirect("/register")
        }
        else{
            bcrypt.compare(req.body.password, foundUser.password, function(err, result) {
                if(result){
                    res.render("secrets");
                }else{
                       console.log("Wrong password!");
                
                }
            });
            
        }
    }
   })

})

app.listen(3000,()=>{
    console.log("Server running!")
});