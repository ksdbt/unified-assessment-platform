const express = require('express');
const router = express.Router();
const {
    getCategories,
    getSubcategories,
    createCategory,
    createSubcategory
} = require('../controllers/CategoryController');

router.route('/')
    .get(getCategories)
    .post(createCategory);

router.route('/:categoryId/subcategories')
    .get(getSubcategories)
    .post(createSubcategory);

module.exports = router;
