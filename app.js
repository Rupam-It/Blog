//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose= require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");
const InternalOAuthError = require('passport-oauth').InternalOAuthError;

const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Capture Life's Moments: Welcome to our Day Journal Website, the perfect platform to record your daily experiences, thoughts, and emotions. Whether you want to cherish memories, track your personal growth, or simply enjoy the art of journaling, we provide a user-friendly space to document your unique journey. Join us in preserving your daily adventures one entry at a time!";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
//--------------------  DATA BASE parts-------------------------
mongoose.connect("mongodb://0.0.0.0:27017/blogdb");
const userInfo= new mongoose.Schema({
  mail:String,
  username:String,
  password:String
})

const Blog=  new mongoose.Schema({
  Username:String,
  date:String,
  title: String,
  content: String
})

const comment= new mongoose.Schema({
  newId:String,
  username:String,
  comment:String
})

userInfo.plugin(passportLocalMongoose);
userInfo.plugin(findOrCreate);

const userInfoDB= mongoose.model("UserInfo",userInfo);
const BlogDB=mongoose.model("Blog",Blog);
const commentDB=mongoose.model("comment",comment);

passport.use(userInfoDB.createStrategy());
// this  will complicate the password and also derived the orginal password 
passport.serializeUser(function(user,done){
  done(null,user.id);
});
passport.deserializeUser(function(id, done) {
  userInfoDB.findById(id)
      .then(function(user) {
          done(null, user);
      })
      .catch(function(err) {
          done(err, null);
      });
});
//--------------------  DATA BASE parts ends here-------------------------



// --------------------  get function()-------------------

app.get("/", function(req, res){
 if(req.isAuthenticated()){
  res.redirect("/home");
 }else{


    BlogDB.find({})
    .then((posts,err)=>{
      if (err) {
        console.error(err);
        res.render("404");
      }else{
        // console.log(posts);
        // res.render('home', {
        //   startingContent: homeStartingContent,
        //   posts: posts
        // });
        res.render("drashboard",{posts: posts});
      }

    })
  }
});

app.get("/home",function(req,res){
  if (req.isAuthenticated())
      { BlogDB.find({})
        .then((posts,err)=>{
          if (err) {
            console.error(err);
            res.render("404");
          }else{
            // console.log(posts);
            userInfoDB.findOne({_id:req.session.passport.user})
            .then(function(user){
              res.render('home', {
                yourAccount:user.username,
                startingContent: homeStartingContent,
                posts: posts
              });
              // res.render("drashboard",{posts: posts});
            });

          }
        })}else{
          res.render("login");
        }
});

app.get("/about", function(req, res){
  res.render("about", {aboutContent: aboutContent});
});

app.get("/contact", function(req, res){
  res.render("contact", {contactContent: contactContent});
});



app.get("/login",function(req,res){
    res.render("login");
});
app.get("/signup",function(req,res){
  res.render("signup");
});
app.get("/compose", function(req, res){

  // passing the current user to get the writer of the blog
  if (req.isAuthenticated()){
    // console.log(req.session.passport.user);
    userInfoDB.findOne({_id:req.session.passport.user})
    .then(function(user){
      // console.log(user.username);
      res.render("compose",{currentUser:user.username});
    });
    
  }else{
    res.render("login");
  }
});

app.get("/logout",function(req,res){
  req.logout((err) => {
    if (err) {
        console.error(err);
    }
    // Redirect after logout
    res.redirect("/");
});
});




app.get("/user/:yourAccount",function(req,res){
 //req.params.yourAccount = user name store in userinfo
//  console.log(req.session.passport);

    if(req.isAuthenticated()){
      // console.log(req.params.yourAccount);
    userInfoDB.findOne({_id : req.session.passport.user})
    .then((user)=>{
      if(req.params.yourAccount){
      
        BlogDB.find({ Username: req.params.yourAccount})
          .exec()
          .then(posts => {
            if (!posts) {
              res.render("account",{
                posts:posts
              });
            }
          //  console.log("post[0]: ",posts[0].Username);
          else if(req.params.yourAccount===user.username){
            res.render("account", {
              posts:posts
            });
          }else{
            res.render("404");
          }

          })
          .catch(err => {
            const post=[];
            res.render("account",{
              posts:post
            });
          });
      
      }else{
        res.send("error");
      }
    })


    }else{
  res.render("login");
 }


});

app.get("/404",(req,res)=>{
  res.render("404");
});
app.get("/submissionError",(req,res)=>{
  res.render("submission_error");
});
app.get("/account/:postName",function(req,res){
  const requestedTitle = _.lowerCase(req.params.postName);
  // console.log(requestedTitle);
  // console.log(BlogDB.findOne({ title: requestedTitle }));

  BlogDB.findOne({ title: requestedTitle })
    .exec()
    .then(post => {
      if (!post) {
        res.render("404");
      }
  
      res.render("manageBlog", {
        title: post.title,
        content: post.content
      });
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Internal Server Error');
    });
});


app.get("/posts/:postName", function(req, res){
  const requestedTitle = _.lowerCase(req.params.postName);
  // console.log(BlogDB.findOne({ title: requestedTitle }));
if(req.isAuthenticated()){
  BlogDB.findOne({ title: requestedTitle })
  .exec()
  .then(post => {
    // console.log(post);
    if (!post) {  
     res.render("404");
    }
    else{
      // console.log(post.id);
    commentDB.find({newId:post.id})
    .then((comments)=>{
      userInfoDB.findOne({_id:req.session.passport.user})
      .then(function(User){
  
        res.render("post", {
          user:User.username,
          ID:post.id,
          title: post.title,
          content: post.content,
          allComment: comments
        });
      });
    });
    }
    



  })
  .catch(err => {
    console.error(err);
    res.status(500).send('Internal Server Error');
  });
}
else{
  BlogDB.findOne({ title: requestedTitle })
    .exec()
    .then(post => {
      if (!post) {
        res.render("404");
      }
  
      res.render("seeBlog", {
        writer:post.Username,
        title: post.title,
        content: post.content
      });
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Internal Server Error');
    });
}
  
});

app.get("/edit", function (req, res) {
  const editContent = req.query.title;

  BlogDB.findOne({ title: editContent })
    .then((post) => {
      if (!post) {
        res.render("404");
      } else {
        res.render("edit", {
          title: post.title,
          content: post.content,
        });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Internal Server Error');
    });
});

app.get("/delete", function(req, res){
    
  const deleteContent = req.query.title;
  // console.log(deleteContent);
  BlogDB.findOneAndDelete({title:deleteContent})
  .then(success=>{
    if (success) {
  console.log("successfully deleted");
      res.redirect("/home");
    }
    else{
      // console.error(err);
      res.status(500).send('Internal Server Error');
      return;
    }
  })

});



app.get("/:random",(req,res)=>{
  res.render("404");
})
//--------------------------post funciton()----------------
// app.post("/compose", function(req, res){


//   const blog= new BlogDB({
//     Username: req.body.username,
//     title:_.lowerCase(req.body.postTitle),
//     content: req.body.postBody
//   }) 
//   blog.save()
//   .then(()=>{
//     console.log("your data base is updated");
//   })
//   res.redirect("/");

// });
app.post("/compose", function(req, res){
  const title = _.lowerCase(req.body.postTitle);

  // Check if a blog with the same title already exists
  BlogDB.findOne({ title: title })
    .then(existingBlog => {
      if (existingBlog) {
        console.log("A blog with this title already exists.");
        return res.render("exists"); // Or you can redirect to an error page
      }

      // If no existing blog, save the new one
      const blog = new BlogDB({
        Username: req.body.username,
        title: title,
        content: req.body.postBody
      });

      return blog.save()
      .then(() => {
        console.log("Your database is updated.");
        res.redirect("/");
      });
    })

    .catch(error => {
      console.error(error);
      res.status(500).send("Internal Server Error");
    });
});


app.post("/update", function (req, res) {
  const updatedTitle = req.body.postTitle;
  const updatedContent = req.body.postBody;

  // Assuming you have a way to identify the specific post you want to update (e.g., using an ID)
  const postId =  req.query.content;

  BlogDB.findOneAndUpdate(
    { content: postId },
    { $set: { title: updatedTitle, content: updatedContent } },
    { new: true }
  )
    .then((updatedPost) => {
      if (!updatedPost) {
        res.render("404");
      } else {
        console.log("Post updated successfully");
        // Redirect to a different page or route after successful update
        res.redirect("/");
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Internal Server Error');
    });
});


app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    res.render("submission_error");
  }

  userInfoDB.findOne({ mail: email, password: password })
  .then(function(user) {
    if (user) {
      req.logIn(user, (err) => {
        if (err) {
          console.error(err);
          res.render("404");
        } else {
          res.redirect("/home");
       }
      });
    } else {
      res.render("invalid");
    }
  })
  .catch(function(error) {
    console.error(error);
    res.send("Error checking database.");
  });

});






app.post("/register",(req,res)=>{
  const email = req.body.email;
  const username = req.body.username;
  const password = req.body.password
    // Check if any field is empty
    if (!email || !username || !password) {
      res.render("submission_error");
    }

  // Check if email or username already exists
  userInfoDB.findOne({ $or: [ { mail: email }, { username: username } ] })
  .then(function(user){
    if(user) {
      if(user.mail === email) {
        res.send("This email is already registered.");
      } else {
        res.send("This username is already taken.");
      }
    } else {
      // If email and username are unique, create a new user
      const newUser = new userInfoDB({
        mail: email,
        username: username,
        password: password
      });

      newUser.save()
      .then(function(success){
        res.redirect("/home");
      })
      .catch(function(error){
        res.render("404");
      });
    }
  })
  .catch(function(error){
    res.send("Error checking database: " + error);
  });
});



app.post("/publish",function(req,res){
    const username= req.body.username;
    const comment= req.body.comment;
    const blogRelatedId=req.query.ID;
    // console.log(username);
    // console.log(comment);
    // console.log(blogRelatedId);
    // res.send("we are working on it");
    if(!comment){
      res.render("submission_error");
    }else{
      const comment_data= new commentDB({
        newId:blogRelatedId,
        username:username,
        comment:comment
      });
  
      comment_data.save()
      .then(()=>{
        console.log("new comment added");
      })
  
      // BlogDB.findOne({_id:blogRelatedId})
      // .then((blog)=>{
      //   res.redirect(`/posts/{blog.title}`);
      // })
      res.redirect("/home")
    }
    
});




app.listen(3000, function() {
  console.log("Server started on port 3000");
});