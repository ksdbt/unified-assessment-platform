const fs = require('fs');
const path = require('path');
const LoggingEngine = require('./LoggingEngine');

/**
 * Transparency Ledger Service
 * Simulated "Public Blockchain" for Merkle Proofs
 * Innovation Phase 3: Decentralized Audit Roots
 */
class TransparencyLedger {
    constructor() {
        this.ledgerPath = path.join(__dirname, '../data/public_ledger.json');
        this.ensureLedgerExists();
    }

    ensureLedgerExists() {
        const dir = path.dirname(this.ledgerPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(this.ledgerPath)) {
            fs.writeFileSync(this.ledgerPath, JSON.stringify([], null, 2));
        }
    }

    /**
     * "Publishes" a daily Merkle Root to the public ledger.
     * Mimics an immutable record.
     */
    async publishDailyRoot(dateStr) {
        try {
            const root = await LoggingEngine.generateDailyMerkleRoot(dateStr);
            if (!root) return null;

            const ledger = JSON.parse(fs.readFileSync(this.ledgerPath, 'utf8'));

            // Check if already published
            const exists = ledger.find(entry => entry.date === dateStr);
            if (exists) return exists;

            const entry = {
                date: dateStr,
                merkleRoot: root,
                publishedAt: new Date().toISOString(),
                verificationHash: require('crypto').createHash('sha256').update(dateStr + root).digest('hex')
            };

            ledger.push(entry);
            fs.writeFileSync(this.ledgerPath, JSON.stringify(ledger, null, 2));
            console.log(`[Ledger] Daily Merkle Root published for ${dateStr}: ${root}`);
            return entry;
        } catch (error) {
            console.error('[Ledger] Publication failed:', error);
            throw error;
        }
    }

    getLedger() {
        return JSON.parse(fs.readFileSync(this.ledgerPath, 'utf8'));
    }
}

module.exports = new TransparencyLedger();
