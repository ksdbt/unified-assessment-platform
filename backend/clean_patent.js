const fs = require('fs');
const path = require('path');

const filesToClean = [
    'services/XAIEngine.js',
    'services/PatternAnalysisEngine.js',
    'services/LoggingEngine.js',
    'services/BehavioralAnalysisService.js',
    'services/AQIEngine.js',
    'services/AnomalyEngine.js',
    'routes/admin.js',
    'models/Submission.js',
    'models/Assessment.js',
    'models/ActivityLog.js',
    'controllers/submissionController.js',
    'controllers/auditController.js',
    'controllers/adminController.js'
];

const basePath = 'c:/Users/KEERTHIKA/Downloads/unified-assessment-platform-release_01/unified-assessment-platform-release_01/backend';

filesToClean.forEach(file => {
    const fullPath = path.join(basePath, file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');

        // Remove "Patent Feature \d*:?", "Patent Feature:", "Patent Claim \d*:?", "Patent Claim:", "Patent Requirement:"
        content = content.replace(/Patent\s+Feature\s*\d*:?\s*/gi, '');
        content = content.replace(/Patent\s+Claim\s*\d*:?\s*/gi, '');
        content = content.replace(/Patent\s+Requirement:\s*/gi, '');
        content = content.replace(/PATENT\s+CLAIM:\s*/gi, '');

        // Specific ones
        content = content.replace(/\(Patent Demo\)/g, '(Demo)');
        content = content.replace(/Demo assessment for patent features/g, 'Demo assessment');
        content = content.replace(/\(as per patent request\)/g, '');
        content = content.replace(/\(Patent Alignment\)/g, '');
        content = content.replace(/PRECISE PATENT FORMULA:/g, 'PRECISE FORMULA:');

        // Remaining "Patent " or "Patent:" occurrences
        content = content.replace(/Patent:\s*/gi, '');
        content = content.replace(/Patent Feature/gi, 'Security Feature');

        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Cleaned ${file}`);
    }
});
