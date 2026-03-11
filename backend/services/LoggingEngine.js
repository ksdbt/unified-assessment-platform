const crypto = require('crypto');
const ActivityLog = require('../models/ActivityLog');
const cryptoUtils = require('../utils/cryptoUtils');

/**
 * Cryptographic Hash-Chained Audit Logging
 * currentHash = SHA256(previousHash + action + userId + timestamp + metadata + details)
 */
class LoggingEngine {

    async log(req, action, details, metadata = {}, resourceId = null, retryCount = 0) {
        try {
            // 1. Get the last log entry to fetch previous hash and sequence
            const lastLog = await ActivityLog.getLastLog();

            const previousHash = lastLog ? lastLog.currentHash : 'GENESIS_HASH';
            const sequenceIndex = lastLog ? lastLog.sequenceIndex + 1 : 0;
            const timestamp = new Date().toISOString();
            const userId = (req.user && (req.user.id || req.user._id)) ? (req.user.id || req.user._id).toString() : 'ANONYMOUS';

            // 2. Metadata string (sort keys for consistency)
            const metadataStr = JSON.stringify(metadata, Object.keys(metadata).sort());

            // 3. Calculate Current Hash
            const dataToHash = `${previousHash}|${action}|${userId}|${timestamp}|${metadataStr}|${details}`;
            const currentHash = crypto.createHash('sha256').update(dataToHash).digest('hex');

            // 4. Save log to database
            const logEntry = await ActivityLog.createLog({
                user: req.user ? req.user.name : 'Anonymous',
                userId: req.user ? (req.user.id || req.user._id) : null,
                role: req.user ? req.user.role : 'unknown',
                action,
                details,
                metadata,
                resourceId,
                ip: req.ip || (req.connection && req.connection.remoteAddress) || 'unknown',
                userAgent: req.headers ? req.headers['user-agent'] : 'unknown',
                previousHash,
                currentHash,
                sequenceIndex,
                createdAt: timestamp
            });

            return logEntry;
        } catch (error) {
            // Handle duplicate key error (concurrency collision)
            const isDupKey = error.code === 11000 || (error.writeErrors && error.writeErrors.some(e => e.code === 11000)) || error.message.includes('E11000');
            if (isDupKey && retryCount < 5) {
                // Wait a tiny bit and retry
                await new Promise(resolve => setTimeout(resolve, 100 * (retryCount + 1)));
                return this.log(req, action, details, metadata, resourceId, retryCount + 1);
            }
            console.error('LoggingEngine Error:', error);
        }
    }

    /**
     * Verify integrity of the hash chain by re-reading all logs from the database.
     * Returns { valid: boolean, brokenIndex: number }
     */
    async verifyIntegrity() {
        console.log('Starting Integrity Check...');
        const allLogs = await ActivityLog.getAllLogsOrdered();
        console.log(`Checking ${allLogs.length} logs...`);

        let isValid = true;
        let brokenIndex = -1;

        let previousHash = 'GENESIS_HASH';
        let expectedIndex = 0;

        for (const doc of allLogs) {
            // Check sequence gap
            if (doc.sequenceIndex !== expectedIndex) {
                isValid = false;
                brokenIndex = expectedIndex;
                console.error(`Sequence Gap Detected at index ${expectedIndex}`);
                break;
            }

            // Check previous hash link
            if (doc.previousHash !== previousHash) {
                isValid = false;
                brokenIndex = doc.sequenceIndex;
                console.error(`Hash Link Broken at index ${doc.sequenceIndex}`);
                break;
            }

            // Re-calculate hash to detect tampering
            const userId = doc.userId ? doc.userId.toString() : 'ANONYMOUS';
            const metadataStr = JSON.stringify(doc.metadata || {}, Object.keys(doc.metadata || {}).sort());
            const timestamp = new Date(doc.createdAt).toISOString();

            const dataToHash = `${previousHash}|${doc.action}|${userId}|${timestamp}|${metadataStr}|${doc.details}`;
            const recalculated = crypto.createHash('sha256').update(dataToHash).digest('hex');

            if (recalculated !== doc.currentHash) {
                isValid = false;
                brokenIndex = doc.sequenceIndex;
                console.error(`Data Tampering Detected at index ${doc.sequenceIndex}`);
                break;
            }

            previousHash = doc.currentHash;
            expectedIndex++;
        }

        if (isValid) {
            console.log('Integrity Verification PASSED.');
        } else {
            console.log(`Integrity Verification FAILED at index ${brokenIndex}`);
        }
        return { valid: isValid, brokenIndex };
    }

    /**
     * Aggregates all hashes from a specific day into a single Merkle Root.
     * Innovation: Secure Daily Checkpoints.
     */
    async generateDailyMerkleRoot(dateStr) {
        const start = new Date(dateStr);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateStr);
        end.setHours(23, 59, 59, 999);

        const logs = await ActivityLog.ActivityLog.find({
            createdAt: { $gte: start, $lte: end }
        }).sort('sequenceIndex');

        if (logs.length === 0) return null;

        const hashes = logs.map(l => l.currentHash);
        const root = cryptoUtils.calculateRoot(hashes);

        console.log(`[Merkle] Root for ${dateStr}: ${root}`);
        return root;
    }
}

module.exports = new LoggingEngine();
