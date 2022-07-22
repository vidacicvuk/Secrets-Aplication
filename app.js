//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const path = require('path');

//app setting up

const app = express();

const staticPath = path.join(__dirname, "/public")
app.use(express.static(staticPath))
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret: 'Nasa mala tajna',
    resave: false,
    saveUninitialized: false
}))


app.use(passport.initialize());
app.use(passport.session())

//setting up database

mongoose.connect("mongodb://localhost:27017/userDB")


const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    facebookId: String,
    secret: String
})


userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

const User = new mongoose.model("User", userSchema);

//setting up passport

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
},
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            console.log(user)
            return cb(err, user);
        });
    }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "https://localhost:3000/auth/facebook/secrets"
},
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile);
        User.findOrCreate({ facebookId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

//handling get requests 

app.get("/", (req, res) => {
    res.render("home")
})

app.get("/login", (req, res) => {
    res.render("login", { message: "" })
})

app.get("/login/:message", (req, res) => {
    let message = req.params.message;
    res.render('login', { message: message })
})

app.get("/register", (req, res) => {
    res.render("register")
})



app.get("/secrets", (req, res) => {
    User.find({ "secrets": { $ne: null } }, (err, foundUsers) => {
        if (err) {
            console.log(err);
        } else {
            res.render("secrets", { foundUsers: foundUsers })
        }
    })
})

app.get("/logout", (req, res) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
})

app.get("/submit", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
})

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] })
);


app.get('/auth/facebook',
    passport.authenticate('facebook', { authType: 'reauthenticate', scope: ['user_friends', 'manage_pages'] }));

app.get('/auth/facebook/secrets',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });


app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });

//handling post requests

app.post("/register", (req, res) => {
    User.findOne({ username: req.body.username }, (err, foundUser) => {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                let message = encodeURIComponent("User with " + req.body.username + " username already exists. Please log in.");
                res.redirect("/login/" + message)
            } else {
                User.register({ username: req.body.username }, req.body.password, function (err, user) {
                    if (err) {
                        console.log(err);
                        res.redirect("/register");
                    } else {
                        passport.authenticate("local")(req, res, () => {
                            res.redirect("/secrets");
                        })
                    }


                });
            }
        }
    })


})

app.post("/submit", (req, res) => {
    const submittedSecret = req.body.secret;
    User.findById(req.user.id, (err, foundUser) => {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                foundUser.secret = submittedSecret;
                foundUser.save(() => {
                    res.redirect("/secrets")
                });
            }

        }
    })

})

app.post("/login", (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })
    req.login(user, (err) => {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local", function (err, user, info) {
                if (err) { return next(err); }
                if (!user) {
                    let message = encodeURIComponent("Wrong username or password.");
                    return res.redirect('/login/' + message);
                }
                req.logIn(user, function (err) {
                    if (err) { return next(err); }
                    return res.redirect('/secrets');
                });
            })(req, res)
        }
    })
    
    

})

app.listen(3000, () => {
    console.log("Server running!")
});