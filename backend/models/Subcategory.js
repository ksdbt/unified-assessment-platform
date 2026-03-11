const mongoose = require('mongoose');

const SubcategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a subcategory name'],
        trim: true
    },
    categoryId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Category',
        required: true
    },
    description: String,
    icon: String,
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create a compound index so names must be unique within a category
SubcategorySchema.index({ name: 1, categoryId: 1 }, { unique: true });

module.exports = mongoose.model('Subcategory', SubcategorySchema);
