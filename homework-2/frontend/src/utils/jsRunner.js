/**
 * Executes JavaScript code and captures console output.
 * @param {string} code - The JavaScript code to execute.
 * @returns {Promise<{results: any, output: string[], error: string|null}>}
 */
export async function runJavascript(code) {
    const logs = [];

    // Create a proxy console to capture logs
    const mockConsole = {
        log: (...args) => logs.push(args.map(a => String(a)).join(' ')),
        error: (...args) => logs.push('Error: ' + args.map(a => String(a)).join(' ')),
        warn: (...args) => logs.push('Warn: ' + args.map(a => String(a)).join(' ')),
        info: (...args) => logs.push('Info: ' + args.map(a => String(a)).join(' '))
    };

    try {
        // Create a function that takes 'console' as an argument to shadow the global console
        // We wrap the code in an async IZA (Immediately Invoked implementation) if needed, 
        // but simple 'new Function' works for synchronous return values.
        // To support 'await' at top level, we can wrap it in an async function.

        const wrappedCode = `
            return (async () => {
                ${code}
            })();
        `;

        const func = new Function('console', wrappedCode);
        const result = await func(mockConsole);

        return {
            result: result,
            output: logs,
            error: null
        };
    } catch (err) {
        return {
            result: null,
            output: logs,
            error: err.toString()
        };
    }
}
