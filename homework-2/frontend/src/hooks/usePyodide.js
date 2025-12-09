import { useState, useEffect, useRef } from 'react';

export function usePyodide() {
    const [isReady, setIsReady] = useState(false);
    const pyodideRef = useRef(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadPyodide = async () => {
            const initialize = async () => {
                try {
                    const pyodide = await window.loadPyodide({
                        indexURL: "/pyodide/"
                    });
                    pyodideRef.current = pyodide;
                    setIsReady(true);
                } catch (e) {
                    console.error("Pyodide init error", e);
                    setError(e.toString());
                }
            };

            if (window.loadPyodide) {
                await initialize();
                return;
            }

            let script = document.querySelector('script[src="/pyodide/pyodide.js"]');

            if (!script) {
                script = document.createElement('script');
                script.src = "/pyodide/pyodide.js";
                script.async = true;
                document.body.appendChild(script);
            }

            script.addEventListener('load', initialize);

            script.addEventListener('error', () => setError("Failed to load Pyodide script"));
        };

        loadPyodide();
    }, []);

    const runPython = async (code) => {
        if (!pyodideRef.current) throw new Error("Pyodide is not loaded yet");

        // reset stdout
        let output = [];
        pyodideRef.current.setStdout({ batched: (msg) => output.push(msg) });
        pyodideRef.current.setStderr({ batched: (msg) => output.push(msg) });

        try {
            await pyodideRef.current.loadPackagesFromImports(code);
            const result = await pyodideRef.current.runPythonAsync(code);
            return {
                output: output.join('\n'),
                result: result !== undefined ? String(result) : null
            };
        } catch (err) {
            return {
                output: output.join('\n'),
                error: err.toString()
            };
        }
    };

    return { isReady, runPython, error };
}
