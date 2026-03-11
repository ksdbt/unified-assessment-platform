const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin'],
    default: 'student'
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  instituteCode: String,
  avatar: String,
  profile: {
    phone: String,
    address: String,
    department: String,
    specialization: String,
    experience: Number,
    bio: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  geminiKey: {
    type: String,
    select: false
  },
  typingBaseline: {
    mean: Number,
    stdDev: Number,
    samples: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// --- CRUD Wrapper (for compatibility with existing controllers) ---

const User = mongoose.model('User', UserSchema);

const createUser = async (data) => {
  return await User.create(data);
};

const getUserById = async (id, includePassword = false) => {
  const query = User.findById(id);
  if (includePassword) query.select('+password');
  return await query;
};

const getUserByEmail = async (email, includePassword = false) => {
  const query = User.findOne({ email: email.toLowerCase().trim() });
  if (includePassword) query.select('+password');
  return await query;
};

const updateUser = async (id, updates) => {
  return await User.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true
  });
};

const deleteUser = async (id) => {
  return await User.findByIdAndDelete(id);
};

const listUsers = async (filters = {}) => {
  return await User.find(filters).sort('-createdAt');
};

const countUsers = async (filters = {}) => {
  return await User.countDocuments(filters);
};

const comparePassword = async (plain, hashed) => {
  return await bcrypt.compare(plain, hashed);
};

const hashPassword = async (plain) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(plain, salt);
};

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  updateUser,
  deleteUser,
  listUsers,
  countUsers,
  hashPassword,
  comparePassword,
  User // Exporting raw model too
};