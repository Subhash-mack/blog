//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require("lodash")
const bcrypt = require("bcrypt");
const saltRounds = 10;
const postSchema = require("./models/post");
const userSchema=require("./models/user");
const session = require('express-session')
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const { response } = require('express');
const facebookStrategy=require('passport-facebook').Strategy;


const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
mongoose.connect("mongodb://localhost:27017/blogDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set('useCreateIndex', true);
app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = new mongoose.model("User", userSchema);
const Post = new mongoose.model("Post",postSchema);
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

passport.use(new facebookStrategy({
    clientID: process.env.CLIENT_FID,
    clientSecret: process.env.CLIENT_FSECRET,
    callbackURL: "http://localhost:3000/auth/facebook/home",
    profileFields   : ['id','displayName','name','gender','picture.type(large)','email'],

},
function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id,username:profile.emails[0].value }, function (err, user) {
      return cb(err, user);
    });
  }
))

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/blog",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo",
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id,username:profile.email}, function (err, user) {
      return cb(err, user);
    });
  }
));
      app.get("/home",function(req,res){
        if(req.isAuthenticated()){
        Post.find({}, function (err, posts) {
        res.render("home",{StartingContent: homeStartingContent,
          posts: posts});
      });}
      else
      res.render('login');
    });
      app.get("/login", function (req, res) {
          res.render("login");
        });
      app.post("/login", function (req, res) {
        const user = new User({
          username: req.body.username,
          password: req.body.password
      });
      req.login(user, function (err) {
        if(err)
        console.log(err);
          passport.authenticate("local")(req, res, function () {
              res.redirect("/home");
          })
      });
      });
      app.get("/",function(req,res){
        res.render("register");
      });
      app.post("/", function (req, res) {
        User.register(({
          fname:req.body.fname,   
          lname:req.body.lname,      
          username:req.body.username}) , req.body.password,function (err, user) {
            if (err)
            {console.log(err);
                res.redirect("/register");
            }
            else
                passport.authenticate("local")(req, res, function () {
                  console.log(user);
                    res.redirect("/home");
                });
        });
    });
    app.get("/auth/google",
    passport.authenticate("google",{ scope: ["profile"] })
);
app.get("/auth/facebook",
    passport.authenticate("facebook",{ scope: ["email,user_photos"] })
);
app.get("/auth/google/blog", 
  passport.authenticate('google', { successRedirect : '/home', failureRedirect: 'login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('home');
  });
app.get("/auth/facebook/home", 
  passport.authenticate('facebook', { successRedirect : '/home',failureRedirect: 'login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('home');
  });
      app.get("/about", function (req, res) {
        res.render("about", {
          about: aboutContent
        });
      });
      app.get("/contact", function (req, res) {
        res.render("contact", {
          contact: contactContent
        });
      });
      app.get("/compose", function (req, res) {
        res.render("compose");
      });
      app.get('/posts/:postId', function (req, res) {
        const parameter = req.params.postId;
        Post.findOne({
          _id: parameter
        }, function (err, post) {
          if (_.lowerCase(post._id) === _.lowerCase(parameter))
            res.render("post", {
              postTitle: post.title,
              postContent: post.content
            });
          else
            console.log("Not a match");
        });


      });
      app.post("/compose", function (req, res) {
        const password1=req.body.password;
          const post = new Post({
            title: req.body.postTitle,
            content: req.body.postContent,
          });
             post.save(function (err) {
                if (!err) {
                        res.redirect("/");
                      }
                      else
                      console.log(err);
                    });
            });


      app.get("/logout",function(req,res){
        req.logout();
        res.redirect("login");
    })









      app.listen(3000, function () {
        console.log("Server started on port 3000");
      });