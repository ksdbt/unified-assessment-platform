// Ports the local execution logic from WebWeave
export const compileCodeLocally = async ({ language, code, input }) => {
    switch (language?.toLowerCase()) {
        case 'javascript':
        case 'js':
            return executeJavaScript(code, input);
        case 'python':
        case 'python3':
            return executePython(code, input);
        case 'java':
            return executeJava(code, input);
        case 'cpp':
        case 'c++':
        case 'c':
            return executeCpp(code, input);
        default:
            return {
                output: '',
                error: `Language '${language}' is not supported in local execution mode.`,
                status: 'Unsupported'
            };
    }
};

const executeJavaScript = (code, input) => {
    try {
        const startTime = performance.now();
        const logs = [];
        const errors = [];
        let inputLines = input ? input.split('\n').map(l => l.trim()) : [];
        let inputIndex = 0;

        const mockConsole = {
            log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
            error: (...args) => errors.push(args.map(a => String(a)).join(' ')),
            warn: (...args) => logs.push('Warning: ' + args.map(a => String(a)).join(' ')),
        };

        const mockPrompt = () => (inputIndex < inputLines.length ? inputLines[inputIndex++] : '');

        const context = {
            console: mockConsole,
            prompt: mockPrompt,
            Math, Date, JSON, parseInt, parseFloat, Array, Object, String, Number, Boolean, RegExp, Error
        };

        const func = new Function(...Object.keys(context), code);
        func(...Object.values(context));

        const executionTime = performance.now() - startTime;

        return {
            output: logs.length > 0 ? logs.join('\n') : 'Executed successfully (no output)',
            error: errors.length > 0 ? errors.join('\n') : undefined,
            executionTime,
            status: 'Success'
        };
    } catch (err) {
        return { output: '', error: `Runtime Error: ${err.message}`, status: 'Error' };
    }
};

// Simulation-based executors for other languages (similar to WebWeave)
const executePython = (code, input) => {
    // Basic regex-based simulation for teaching purposes
    const logs = [];
    const lines = code.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('print(')) {
            const content = trimmed.slice(6, -1).replace(/['"]/g, '');
            logs.push(content);
        }
    }
    return { output: logs.join('\n') || 'Python simulated execution successful', status: 'Simulated' };
};

const executeJava = (code, input) => {
    const logs = [];
    const matches = code.match(/System\.out\.println\s*\((.*?)\)/g);
    if (matches) {
        matches.forEach(m => logs.push(m.slice(19, -2).replace(/['"]/g, '')));
    }
    return { output: logs.join('\n') || 'Java simulated execution successful', status: 'Simulated' };
};

const executeCpp = (code, input) => {
    const logs = [];
    const matches = code.match(/cout\s*<<\s*"(.*?)"/g);
    if (matches) {
        matches.forEach(m => logs.push(m.match(/"(.*?)"/)[1]));
    }
    return { output: logs.join('\n') || 'C++ simulated execution successful', status: 'Simulated' };
};
