const joi = require('joi');

// Schema for creating or updating a Listing
module.exports.listingSchema = joi.object({
  listing: joi.object({
    title: joi.string().required().messages({
      'string.empty': 'Title is required.'
    }),

    category: joi.string().required().messages({
      'string.empty': 'Category is required.'
    }),

    description: joi.string().required().messages({
      'string.empty': 'Description is required.'
    }),
    location: joi.string().required().messages({
      'string.empty': 'Location is required.'
    }),
    country: joi.string().required().messages({
      'string.empty': 'Country is required.'
    }),
    price: joi.number().required().min(0).messages({
      'number.base': 'Price must be a number.',
      'number.min': 'Price must be greater than or equal to 0.'
    }),
    image: joi.object({
      url: joi.string().allow('', null),
      filename: joi.string().allow('', null)
    }).allow(null).optional(),
    geometry: joi.object({
      type: joi.string().valid('Point').optional(),
      coordinates: joi.array().items(joi.number()).optional()
    }).optional()
  }).required()
});

// Schema for Reviews
module.exports.reviewSchema = joi.object({
  review: joi.object({
    rating: joi.number().min(0).max(5).messages({
      'number.base': 'Rating must be a number.',
      'number.min': 'Rating must be at least 0.',
      'number.max': 'Rating must be at most 5.'
    }),
    comment: joi.string().required().messages({
      'string.empty': 'Comment cannot be empty.'
    })
  }).required()
});
