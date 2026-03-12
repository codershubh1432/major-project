//new code
const User = require("../models/user");
const crypto = require("crypto");
const nodemailer = require("nodemailer");



// Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: "a4bb25001@smtp-brevo.com",
    pass: process.env.EMAIL_PASS
  }
});

// SIGNUP FORM
module.exports.renderSignupForm = (req, res) => {
  res.render("users/signup.ejs");
};

// SIGNUP
module.exports.signup = async (req, res, next) => {
  try {
    let { username, email, password } = req.body;

    const newUser = new User({ email, username });
    const registeredUser = await User.register(newUser, password);

    req.login(registeredUser, (err) => {
      if (err) {
        return next(err);
      }
      req.flash("success", "Welcome to Wanderlust!");
      res.redirect("/listings");
    });

  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/signup");
  }
};

// LOGIN FORM
module.exports.renderLoginForm = (req, res) => {
  res.render("users/login.ejs");
};

// LOGIN
module.exports.login = async (req, res) => {
  req.flash("success", "Welcome back to Wanderlust!");
  let redirectUrl = res.locals.redirectUrl || "/listings";
  res.redirect(redirectUrl);
};

// LOGOUT
module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "You are logged out!");
    res.redirect("/listings");
  });
};



// ===============================
// FORGOT PASSWORD SYSTEM
// ===============================

// Render forgot password page
module.exports.renderForgotForm = (req, res) => {
  res.render("users/forgot.ejs");
};


// Send reset email
module.exports.sendResetEmail = async (req, res) => {

  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    req.flash("error", "Email not registered");
    return res.redirect("/forgot-password");
  }

  const token = crypto.randomBytes(32).toString("hex");

  user.resetToken = token;
  user.resetTokenExpiry = Date.now() + 3600000; // 1 hour

  await user.save();

  const resetLink = `${process.env.BASE_URL}/reset-password/${token}`;

  await transporter.sendMail({
    to: user.email,
    from: process.env.EMAIL_USER,
    subject: "Password Reset",
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>This link will expire in 1 hour.</p>
    `
  });

  req.flash("success", "Reset link sent to your email");
  res.redirect("/login");
};



// Render reset password page
module.exports.renderResetForm = async (req, res) => {

  const user = await User.findOne({
    resetToken: req.params.token,
    resetTokenExpiry: { $gt: Date.now() }
  });

  if (!user) {
    req.flash("error", "Token expired or invalid");
    return res.redirect("/forgot-password");
  }

  res.render("users/reset.ejs", { token: req.params.token });
};



// Save new password
module.exports.resetPassword = async (req, res) => {

  const user = await User.findOne({
    resetToken: req.params.token,
    resetTokenExpiry: { $gt: Date.now() }
  });

  if (!user) {
    req.flash("error", "Token expired or invalid");
    return res.redirect("/forgot-password");
  }

  await user.setPassword(req.body.password);

  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;

  await user.save();

  req.flash("success", "Password updated successfully");
  res.redirect("/login");
};