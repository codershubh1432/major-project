// router;const express = require("express");
// // const router = express.Router();
// const ExpressError = require("../utils/ExpressError.js");
// const router = express.Router({ mergeParams: true });
// const wrapAsync = require("../utils/wrapAsync.js");
// const Listing = require("../models/listing.js");
// const {isLoggedIn, isOwner, validateListing} = require("../middleware.js");
// const listingController = require("../controllers/listings.js");
// const multer  = require("multer");
// const {storage} = require("../cloudConfig.js");
// const upload = multer({ storage });

// router
// .route("/")
// .get( wrapAsync(listingController.index))
// .post(
//   isLoggedIn,
//   upload.single("image"), 
//    validateListing,
//   wrapAsync(listingController.createListing)
// );

// //New route
// router.get("/new", isLoggedIn, listingController.renderNewForm);

// router.get("/filter/:category", async (req, res) => {
//   const { category } = req.params;
//   const allListings = await Listing.find({ category });
//   res.render("listings/index", {  allListings,
//     category,
//     currentUser: req.user,           
//     mapToken: process.env.MAP_TOKEN  
//   });
// });

// router.get("/search", wrapAsync(async (req, res) => {
//   const q = req.query.q || "";

//   if (!q.trim()) {
//     req.flash("error", "Search cannot be empty!");
//     return res.redirect("/listings");
//   }

//   const listings = await Listing.find({
//     $or: [
//       { title: { $regex: q, $options: "i" } },
//       { location: { $regex: q, $options: "i" } }
//     ]
//   });

//   res.render("listings/search", { listings, q });
// }));



// router.route("/:id")
// .get(wrapAsync(listingController.showListing))
// .put(isLoggedIn, isOwner, upload.single("image"),  validateListing, wrapAsync(listingController.updateListing))
// .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing)
// );

// // Book page for specific listing - GET /listings/:id/book
// // Book page for specific listing - GET /listings/:id/book
// router.get("/:id/book", wrapAsync(async (req, res) => {
//   const { id } = req.params;
//   const listing = await Listing.findById(id);
//   if (!listing) {
//     throw new ExpressError(404, "Listing not found");
//   }
//   res.render("listings/book", { 
//     listing,
//     razorpayKey: process.env.RAZORPAY_KEY_ID   // ✅ send key to EJS
//   });
// }));



// //Edit route
// router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm)
// );

// // razorpay route
// console.log("Razorpay Key ID:", process.env.RAZORPAY_KEY_ID);
// console.log("Razorpay Key Secret:", process.env.RAZORPAY_KEY_SECRET ? "SET" : "NOT SET");

// const razorpay = require("../utils/razorpay");
// router.post("/:id/create-order", isLoggedIn, async (req, res) => {
//   try {
//     const listing = await Listing.findById(req.params.id);

//     if (!listing) {
//       return res.status(404).json({ error: "Listing not found" });
//     }

//     if (!listing.price || isNaN(listing.price)) {
//       return res.status(400).json({ error: "Invalid listing price" });
//     }

//     const options = {
//       amount: listing.price * 100, // convert to paise
//       currency: "INR",
//       receipt: `receipt_${listing._id}`,
//     };

//     const order = await razorpay.orders.create(options);

//     res.json(order);
//   } catch (err) {
//     console.error("Razorpay Error:", err);
//     res.status(500).json({ error: err.message });
//   }
// });







// module.exports = router;

const express = require("express");
const router = express.Router({ mergeParams: true });
const multer = require("multer");

const ExpressError = require("../utils/ExpressError.js");
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const listingController = require("../controllers/listings.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });
const razorpay = require("../utils/razorpay");

// ------------------ ROUTES ------------------ //

// GET all listings
router.route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.single("image"),
    validateListing,
    wrapAsync(listingController.createListing)
  );

// Render new listing form
router.get("/new", isLoggedIn, listingController.renderNewForm);

// Filter listings by category
router.get("/filter/:category", wrapAsync(async (req, res) => {
  const { category } = req.params;
  const allListings = await Listing.find({ category });
  res.render("listings/index", {  
    allListings,
    category,
    currentUser: req.user,           
    mapToken: process.env.MAP_TOKEN  
  });
}));

// Search listings
router.get("/search", wrapAsync(async (req, res) => {
  const q = req.query.q || "";
  if (!q.trim()) {
    req.flash("error", "Search cannot be empty!");
    return res.redirect("/listings");
  }

  const listings = await Listing.find({
    $or: [
      { title: { $regex: q, $options: "i" } },
      { location: { $regex: q, $options: "i" } }
    ]
  });

  res.render("listings/search", { listings, q });
}));

// GET single listing
router.route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(isLoggedIn, isOwner, upload.single("image"), validateListing, wrapAsync(listingController.updateListing))
  .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

// Render edit form
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));

// ------------------ BOOKING PAGE ------------------ //
router.get("/:id/book", wrapAsync(async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    throw new ExpressError(404, "Listing not found");
  }

  res.render("listings/book", { 
    listing,
    razorpayKey: process.env.RAZORPAY_KEY_ID  // Send key to EJS
  });
}));

// ------------------ RAZORPAY ORDER ------------------ //
router.post("/:id/create-order", isLoggedIn, wrapAsync(async (req, res) => {
  try {
    console.log("Razorpay Key ID:", process.env.RAZORPAY_KEY_ID);
    console.log("Razorpay Key Secret:", process.env.RAZORPAY_KEY_SECRET ? "SET" : "NOT SET");

    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      console.log("Listing not found for ID:", req.params.id);
      return res.status(404).json({ error: "Listing not found" });
    }

    if (!listing.price || isNaN(listing.price)) {
      console.log("Invalid listing price:", listing.price);
      return res.status(400).json({ error: "Invalid listing price" });
    }

    const options = {
      amount: listing.price * 100, // convert to paise
      currency: "INR",
      receipt: `receipt_${listing._id}`,
    };

    const order = await razorpay.orders.create(options);

    console.log("Razorpay order created:", order);
    res.json(order);

  } catch (err) {
    console.error("Razorpay Error:", err);
    res.status(500).json({ error: err.message });
  }
}));

module.exports = router;

