const User = require("../models/user");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

module.exports.renderSignupForm =  (req, res) => {
    res.render("users/signup.ejs");
};

module.exports.signup = async (req, res) => {
    try{
        let {username, email, password} = req.body;
    const newUser = new User({email, username});
    const registeredUser = await User.register(newUser, password);
    console.log(registeredUser);
    req.login(registeredUser, (err) => {
        if(err) {
          return next(err);
        }
         req.flash("success", "Welcome to Wanderlust!");
    res.redirect("/listings"); 
    });
    }  catch(e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }

};

module.exports.renderLoginForm =  (req, res) => {
    res.render("users/login.ejs");
};

module.exports.login = async (req, res) => {
    req.flash("success", "Welcome back to Wanderlust!");
    let redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
   req.logout((err) => {
    if(err) {
     return next(err);
    }
    req.flash("success", "you are logged out!");
    res.redirect("/listings");
   });
};
//new code
module.exports.logout = (req, res, next) => {
   req.logout((err) => {
    if(err) {
     return next(err);
    }
    req.flash("success", "you are logged out!");
    res.redirect("/listings");
   });
};



// FORGOT PASSWORD SYSTEM 

// render forgot password page
module.exports.renderForgotForm = (req,res)=>{
    res.render("users/forgot.ejs");
};


// send reset email
module.exports.sendResetEmail = async (req,res)=>{

const user = await User.findOne({email:req.body.email});

if(!user){
req.flash("error","Email not registered");
return res.redirect("/forgot-password");
}

const token = crypto.randomBytes(32).toString("hex");

user.resetToken = token;
user.resetTokenExpiry = Date.now() + 3600000;

await user.save();

const transporter = nodemailer.createTransport({
service:"gmail",
auth:{
user:process.env.EMAIL_USER,
pass:process.env.EMAIL_PASS
}
});

const resetLink = `${process.env.BASE_URL}/reset-password/${token}`;

await transporter.sendMail({
to:user.email,
subject:"Password Reset",
html:`Click here to reset password <a href="${resetLink}">Reset Password</a>`
});

req.flash("success","Reset link sent to email");
res.redirect("/login");

};


// render reset password page
module.exports.renderResetForm = async (req,res)=>{

const user = await User.findOne({
resetToken:req.params.token,
resetTokenExpiry:{$gt:Date.now()}
});

if(!user){
req.flash("error","Token expired");
return res.redirect("/forgot-password");
}

res.render("users/reset.ejs",{token:req.params.token});

};


// save new password
module.exports.resetPassword = async (req,res)=>{

const user = await User.findOne({
resetToken:req.params.token,
resetTokenExpiry:{$gt:Date.now()}
});

if(!user){
req.flash("error","Token expired");
return res.redirect("/forgot-password");
}

await user.setPassword(req.body.password);

user.resetToken = undefined;
user.resetTokenExpiry = undefined;

await user.save();

req.flash("success","Password updated successfully");
res.redirect("/login");

};