const crypto = require('crypto');

/**
 * Merkle Tree Utility for Audit Log Verification
 * Innovation Phase 3: Decentralized Audit Roots
 */
class MerkleTreeUtility {
    /**
     * Builds a Merkle Tree from an array of hashes and returns the root.
     */
    calculateRoot(hashes) {
        if (!hashes || hashes.length === 0) return null;
        if (hashes.length === 1) return hashes[0];

        let level = hashes;
        while (level.length > 1) {
            const nextLevel = [];
            for (let i = 0; i < level.length; i += 2) {
                const left = level[i];
                const right = (i + 1 < level.length) ? level[i + 1] : left;
                const combined = crypto.createHash('sha256').update(left + right).digest('hex');
                nextLevel.push(combined);
            }
            level = nextLevel;
        }
        return level[0];
    }

    /**
     * Delta Logging Helper
     * Compares two objects and returns the differences
     */
    calculateDelta(oldData, newData) {
        const delta = {};
        const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);

        for (const key of allKeys) {
            if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
                delta[key] = {
                    before: oldData[key],
                    after: newData[key]
                };
            }
        }
        return Object.keys(delta).length > 0 ? delta : null;
    }
}

module.exports = new MerkleTreeUtility();
