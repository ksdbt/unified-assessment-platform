const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true });
        res.status(200).json({ success: true, count: categories.length, data: categories });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get subcategories for a category
// @route   GET /api/categories/:categoryId/subcategories
// @access  Public
exports.getSubcategories = async (req, res) => {
    try {
        const subcategories = await Subcategory.find({
            categoryId: req.params.categoryId,
            isActive: true
        });
        res.status(200).json({ success: true, count: subcategories.length, data: subcategories });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Create a category (Admin only in future)
// @route   POST /api/categories
// @access  Public (for now)
exports.createCategory = async (req, res) => {
    try {
        const category = await Category.create(req.body);
        res.status(201).json({ success: true, data: category });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Create a subcategory
// @route   POST /api/categories/:categoryId/subcategories
// @access  Public (for now)
exports.createSubcategory = async (req, res) => {
    try {
        req.body.categoryId = req.params.categoryId;
        const subcategory = await Subcategory.create(req.body);
        res.status(201).json({ success: true, data: subcategory });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
