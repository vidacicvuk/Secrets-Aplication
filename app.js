//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");


const app = express();

mongoose.connect("mongodb://localhost:27017/userDB")

app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({
    extended:true
}));

const userSchema = {
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
}

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
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    })
    newUser.save((err)=>{
        if(err){
            console.log(err);
        }else{
            res.render("secrets");
        }
    })

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
            if(foundUser.password===req.body.password){
                res.render("secrets");
            }else{
                   console.log("Wrong password!");
            
            }
        }
    }
   })

})

app.listen(3000,()=>{
    console.log("Server running!")
});