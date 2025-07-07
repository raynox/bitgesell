const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();
const Joi = require('joi');
const DATA_PATH = path.join(__dirname, '../../../data/items.json');

const itemSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'name cannot be empty',
      'string.max': 'name must be 100 characters or less',
      'any.required': 'name is required'
    }),

  category: Joi.string()
    .max(50)
    .required()
    .messages({
      'string.max': 'category must be 50 characters or less'
    }),
  
  price: Joi.number()
    .positive()
    .required()
    .messages({
      'number.base': 'price must be a number',
      'number.positive': 'price must be positive',
      'any.required': 'price is required'
    }),
});

async function readData() {
  const raw = await fs.readFile(DATA_PATH);
  return JSON.parse(raw);
}

// GET /api/items
router.get('/', async (req, res, next) => {
  try {
    const data = await readData();
    const { limit = 10, page = 1, q } = req.query;
    let results = data;

    // Search functionality
    if (q) {
      // Search in both name and category
      results = results.filter(item => 
        item.name.toLowerCase().includes(q.toLowerCase()) ||
        item.category.toLowerCase().includes(q.toLowerCase())
      );
    }

    // Calculate pagination
    const totalItems = results.length;
    const totalPages = Math.ceil(totalItems / parseInt(limit));
    const currentPage = parseInt(page);
    const offset = (currentPage - 1) * parseInt(limit);

    // Apply pagination
    const paginatedResults = results.slice(offset, offset + parseInt(limit));

    // Return paginated response with metadata
    res.json({
      items: paginatedResults,
      pagination: {
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage: parseInt(limit),
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/items/:id
router.get('/:id', async (req, res, next) => {
  try {
    const data = await readData();
    const item = data.find(i => i.id === parseInt(req.params.id));
    if (!item) {
      const err = new Error('Item not found');
      err.status = 404;
      throw err;
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /api/items
router.post('/', async (req, res, next) => {
  try {
      // Validate payload
      const item = req.body;
      const { error } = itemSchema.validate(item, {
        abortEarly: false,
        stripUnknown: true
      });
      
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        });
      }
    
    const data = await readData();
    item.id = Date.now();
    data.push(item);
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

module.exports = router;