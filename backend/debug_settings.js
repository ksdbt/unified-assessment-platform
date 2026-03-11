try {
    console.log('Starting simplified verification...');
    const mongoose = require('mongoose');
    console.log('Mongoose loaded');
    const PlatformSettings = require('./models/PlatformSettings');
    console.log('PlatformSettings module loaded');
    console.log('Keys:', Object.keys(PlatformSettings));

    if (PlatformSettings.getSettings && PlatformSettings.upsertSettings) {
        console.log('Functions exported correctly');
    } else {
        console.log('Functions NOT exported correctly');
    }
} catch (err) {
    console.error('Error caught in simplified script:', err);
}
