require("dotenv").config(); // must be at top. Not used in this file currently.
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
// note: requiring passport-local is not necessary
const passportLocalMongoose = require("passport-local-mongoose");
 
const app = express();
 
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded({ extended: true })); // to support URL-encoded bodies
 
app.use(express.static('public'));
app.set('view engine', 'ejs');
 
app.use(session({
    secret: "Our little secret.", // should be inside an environment variable
    resave: false,
    saveUninitialized: false
}));
 
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/loadWatchDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema ({
    firstName:String,
    lastName:String,
    age: Date,
    email:String,
    username:String,
    password:String
});

userSchema.plugin(passportLocalMongoose);
 
const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Get
app.get("/", function(req,res){
    res.render("landing");
});

app.get("/signup",function(req,res){
    res.render("signup");
});

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/editprofile",function(req,res){
    // res.render("editprofile");
    res.set(
        'Cache-Control', 
        'no-cache, private, no-store, must-revalidate, max-stal e=0, post-check=0, pre-check=0'
    );
    if(req.isAuthenticated()) {
        // console.log(req.user.firstName);
        res.render("editprofile",{
            user:req.user
        });     
    } else {
        res.redirect("/login");
    }
});

app.get("/aboutus", function(req,res){
    res.render("aboutus");
});

app.get("/userlanding", function(req,res){
    res.set(
        'Cache-Control', 
        'no-cache, private, no-store, must-revalidate, max-stal e=0, post-check=0, pre-check=0'
    );
    if(req.isAuthenticated()) {
        // console.log(req.user.firstName);
        res.render("userlanding",{
            userFirstName:req.user.firstName
        });        
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", function(req,res){
    req.logout();
    res.redirect("/");
});

// Post
app.post("/signup",function(req,res){
    const userPassword = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    
    if (userPassword === confirmPassword) {
        User.register({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            age: req.body.age,
            email: req.body.userEmail,
            username: req.body.username}, req.body.password,function(err, user){
                if (!err) {
                    // console.log("Successfully registered");
                    passport.authenticate("local")(req,res,function(){
                        res.redirect("/userlanding");
                    });
                } else {
                    console.log(err);
                }
        });
    } else {
        console.log("Passwords not match!");
        res.redirect("/signup");
    }
});

app.post("/login", 
    passport.authenticate("local",{failureRedirect: "/login"}), function(req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password     
    });
    req.login(user, function(err) {
        if(err) {
            console.log(err);
        } else {
            res.redirect("/userlanding");
        }
    });
});

app.post("/editprofile", function(req,res){
    User.findById(req.user.id, function(err, foundUser){
        if (err){
            console.log(err);
        } else {
            if (req.body.newpassword != req.body.confirmpassword) {
                console.log("Passwords do not match!")
            } else {
                foundUser.changePassword(req.body.oldpassword, req.body.newpassword, function (err) {
                    if (err){
                        console.log(err);
                    } else {
                        console.log("Successfully changed password!");
                    }
                });
            }
        }
    });
});

app.listen(3000, function() {
    console.log("Server started on port 3000");
  });
  