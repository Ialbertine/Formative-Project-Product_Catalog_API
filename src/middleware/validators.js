const Joi = require('joi');

const productSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.empty': 'Product name is required',
  }),
  description: Joi.string().required().messages({
    'string.empty': 'Product description is required',
  }),
  price: Joi.number().required().messages({
    'any.required': 'Product price is required',
    'number.base': 'Product price must be a number',
  }),
  stock: Joi.number().integer().required().messages({
    'any.required': 'Product stock is required',
    'number.base': 'Product stock must be a number',
    'number.integer': 'Product stock must be an integer',
  }),
  // Adding the missing fields that were causing validation errors
  image: Joi.string().messages({
    'string.base': 'Image must be a valid path string',
  }),
  category: Joi.string().messages({
    'string.base': 'Category must be a valid ID string',
  }),
  variants: Joi.array().items(
    Joi.object({
      size: Joi.string(),
      color: Joi.string(),
      stock: Joi.number().integer()
    })
  ).messages({
    'array.base': 'Variants must be an array',
  }),
  createdAt: Joi.date(),
  updatedAt: Joi.date()
});

const categorySchema = Joi.object({
  name: Joi.string().required().messages({
    'string.empty': 'Category name is required',
  }),
});

const validateProduct = (req, res, next) => {
  const { error } = productSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({ errors: error.details.map(err => err.message) });
  }

  next();
};

const validateCategory = (req, res, next) => {
  const { error } = categorySchema.validate(req.body);

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  next();
};

module.exports = { 
  validateProduct, 
  validateCategory,
};