const express = require("express");
// const router = express.Router();
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const {isLoggedIn, isOwner, validateListing} = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer  = require("multer");
const {storage} = require("../cloudConfig.js");
const upload = multer({ storage });

router
.route("/")
.get( wrapAsync(listingController.index))
.post(
  isLoggedIn,
  upload.single("image"), 
   validateListing,
  wrapAsync(listingController.createListing)
);

//New route
router.get("/new", isLoggedIn, listingController.renderNewForm);

router.get("/filter/:category", async (req, res) => {
  const { category } = req.params;
  const allListings = await Listing.find({ category });
  res.render("listings/index", {  allListings,
    category,
    currentUser: req.user,           
    mapToken: process.env.MAP_TOKEN  
  });
});

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



router.route("/:id")
.get(wrapAsync(listingController.showListing))
.put(isLoggedIn, isOwner, upload.single("image"),  validateListing, wrapAsync(listingController.updateListing))
.delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing)
);


//Edit route
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm)
);



module.exports = router;