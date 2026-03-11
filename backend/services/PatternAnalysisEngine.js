const SubmissionModel = require('../models/Submission');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const UserModel = require('../models/user');

/**
 * Suspicious Pattern Analysis Module
 * Detects:
 * 1. Rapid Submission Clusters (Cheating Rings)
 * 2. Impossible Travel (IP Hopping)
 *
 * NOTE: MongoDB aggregation pipelines have been replaced with
 * In-memory queries + JavaScript grouping. Same logic, different API.
 */
class PatternAnalysisEngine {

    async runAnalysis() {
        // Architecture Gap: Simulated Serverless/Microservice Execution
        // Instead of running in-process, we trigger a "Serverless Worker"
        return new Promise((resolve, reject) => {
            try {
                const { Worker } = require('worker_threads');
                const path = require('path');
                const worker = new Worker(path.join(__dirname, '../workers/patternWorker.js'));

                worker.on('message', (msg) => {
                    console.log(`[Serverless-Sim] Worker ${worker.threadId} returned: ${msg}`);
                    resolve();
                });
                worker.on('error', reject);
                worker.on('exit', (code) => {
                    if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
                });

                console.log('[Serverless-Sim] Spawning pattern analysis worker thread...');
            } catch (err) {
                // Fallback to in-process if threads are not available
                console.warn('[Serverless-Sim] Worker threads unavailable, falling back to in-process');
                this.detectRapidSubmissionClusters();
                this.detectImpossibleTravel();
                resolve();
            }
        });
    }

    /**
     * Detects if multiple students submit the same assessment within a very short window (2 min).
     * Cheating Ring detection.
     */
    async detectRapidSubmissionClusters() {
        try {
            const windowMs = 2 * 60 * 1000; // 2 minutes
            const thresholdStudents = 3;
            const hourMs = 60 * 60 * 1000;

            // Fetch recent submissions (last hour)
            const recentSubs = await SubmissionModel.getRecentSubmissions(hourMs);

            // Group by assessmentId → time-block (2-minute buckets)
            const groups = {};
            for (const sub of recentSubs) {
                const ts = new Date(sub.submittedAt).getTime();
                const bucket = Math.floor(ts / windowMs) * windowMs;
                const key = `${sub.assessmentId}||${bucket}`;
                if (!groups[key]) groups[key] = { assessmentId: sub.assessmentId, bucket, students: [] };
                groups[key].students.push(sub.studentName);
            }

            for (const group of Object.values(groups)) {
                if (group.students.length >= thresholdStudents) {
                    await this.raisePatternAlert(
                        'CHEATING_RING_DETECTED',
                        `Assessment ${group.assessmentId} had ${group.students.length} submissions within 2 mins. Students: ${group.students.join(', ')}`
                    );
                }
            }
        } catch (error) {
            console.error('Pattern Analysis Error (Clusters):', error);
        }
    }

    /**
     * Detects if a user logs in from > 3 distinct IPs within 1 hour.
     */
    async detectImpossibleTravel() {
        try {
            const hourMs = 60 * 60 * 1000;
            const since = new Date(Date.now() - hourMs).toISOString();

            const { logs } = await ActivityLog.listLogs(
                { createdAtGte: since },
                1,
                10000
            );

            const loginLogs = logs.filter(l =>
                l.action === 'USER_LOGIN'
            );

            // Group by user → distinct IPs
            const userIPs = {};
            for (const log of loginLogs) {
                if (!userIPs[log.user]) userIPs[log.user] = new Set();
                userIPs[log.user].add(log.ip);
            }

            for (const [userName, ips] of Object.entries(userIPs)) {
                if (ips.size >= 3) {
                    await this.raisePatternAlert(
                        'IMPOSSIBLE_TRAVEL',
                        `User ${userName} logged in from ${ips.size} distinct IPs in the last hour.`
                    );
                }
            }
        } catch (error) {
            console.error('Pattern Analysis Error (Travel):', error);
        }
    }

    async raisePatternAlert(type, message) {
        try {
            const admins = await UserModel.listUsers({ role: 'admin' });

            // Deduplicate
            const fullMsg = `[PATTERN: ${type}] ${message}`;
            const exists = await Notification.findOneByMessage(fullMsg);
            if (exists) return;

            const notifications = admins.map(admin => ({
                recipient: admin.id,
                message: fullMsg,
                type: 'warning',
                onModel: 'User',
                relatedId: admins[0]?.id
            }));

            if (notifications.length > 0) {
                await Notification.createManyNotifications(notifications);
            }
            console.log(`PATTERN ALERT: ${type} - ${message}`);
        } catch (error) {
            console.error('Failed to raise pattern alert', error);
        }
    }
}

module.exports = new PatternAnalysisEngine();
