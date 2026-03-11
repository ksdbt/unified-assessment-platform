const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// @route GET /api/notifications
router.get('/', protect, async (req, res) => {
    try {
        const notifications = await Notification.listNotifications(req.user.id);
        res.json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route PUT /api/notifications/:id/read
router.put('/:id/read', protect, async (req, res) => {
    try {
        await Notification.markRead(req.params.id);
        res.json({ success: true, message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route PUT /api/notifications/read-all
router.put('/read-all', protect, async (req, res) => {
    try {
        const notifications = await Notification.listNotifications(req.user.id, false);
        await Promise.all(notifications.map(n => Notification.markRead(n.id)));
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
