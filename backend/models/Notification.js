const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['info', 'warning', 'error', 'success'],
        default: 'info'
    },
    relatedId: mongoose.Schema.Types.ObjectId,
    onModel: {
        type: String,
        enum: ['User', 'Assessment', 'Submission']
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Notification = mongoose.model('Notification', NotificationSchema);

// --- Compatibility Wrappers ---

const createNotification = async (data) => {
    return await Notification.create(data);
};

const createManyNotifications = async (notifications) => {
    return await Notification.insertMany(notifications);
};

const listNotifications = async (recipientId, unreadOnly = false) => {
    const query = { recipient: recipientId };
    if (unreadOnly) query.isRead = false;
    return await Notification.find(query).sort('-createdAt');
};

const listNotificationsByType = async (types = [], messageRegex = null) => {
    const query = {};
    if (types.length > 0) query.type = { $in: types };
    if (messageRegex) query.message = { $regex: messageRegex, $options: 'i' };

    return await Notification.find(query).sort('-createdAt').limit(50);
};

const findOneByMessage = async (message) => {
    return await Notification.findOne({ message });
};

const markRead = async (id) => {
    return await Notification.findByIdAndUpdate(id, { isRead: true });
};

module.exports = {
    createNotification,
    createManyNotifications,
    listNotifications,
    listNotificationsByType,
    findOneByMessage,
    markRead,
    Notification
};
