import React, { useEffect, useRef, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { EditorView, Decoration, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { StateField, StateEffect } from '@codemirror/state';

// Effects for remote cursors
const addCursor = StateEffect.define();
const moveCursor = StateEffect.define();
const removeCursor = StateEffect.define();

// Theme for the editor to match our dark mode
const darkTheme = EditorView.theme({
    "&": {
        fontSize: "14px",
        height: "100%",
    },
    ".cm-content": {
        fontFamily: "'Fira Code', monospace",
    },
    ".cm-gutters": {
        backgroundColor: "#1e1e1e",
        color: "#858585",
        border: "none"
    },
    ".cm-activeLineGutter": {
        backgroundColor: "transparent",
        color: "#c6c6c6"
    },
    ".remote-cursor": {
        borderLeft: "2px solid",
        marginLeft: "-1px",
        opacity: "0.7"
    },
    ".remote-cursor-label": {
        position: "absolute",
        fontSize: "10px",
        color: "white",
        padding: "0 2px",
        borderRadius: "2px",
        top: "-15px",
        whiteSpace: "nowrap"
    }
}, { dark: true });

export function Editor({ file, onChange, remoteCursors = [], onCursorChange }) {
    // remoteCursors is Array<{userId, position, color, name}>

    const extensions = useMemo(() => {
        const exts = [darkTheme];

        if (file?.language === 'javascript') {
            exts.push(javascript({ jsx: true }));
        } else if (file?.language === 'python') {
            exts.push(python());
        }

        // Remote cursors decoration field
        const cursorField = StateField.define({
            create() { return Decoration.none; },
            update(cursors, tr) {
                // Check for effects to update cursors
                // Note: This is a simplified way. In a real app we might pass the array via props and update the field via an effect.
                // For this version with @uiw/react-codemirror, re-creating extensions might be okay or we use a ViewPlugin.
                return cursors.map(tr.changes);
            },
            provide: f => EditorView.decorations.from(f)
        });

        // ViewPlugin for remote cursors handled via props
        const remoteCursorPlugin = ViewPlugin.fromClass(class {
            constructor(view) {
                this.decorations = this.buildDecorations(remoteCursors);
            }

            update(update) {
                // map existing decorations through changes
                // this.decorations = this.decorations.map(update.changes);
                // But actually we want to rebuild if props changed. 
                // Since extensions are re-computed when props change (if we put remoteCursors in dependency), 
                // we can just rebuild.
                this.decorations = this.buildDecorations(remoteCursors);
            }

            buildDecorations(cursors) {
                const specs = [];
                for (const cursor of cursors) {
                    if (cursor.position === null || cursor.position === undefined) continue;

                    specs.push(Decoration.widget({
                        widget: new class extends Object {
                            toDOM() {
                                const el = document.createElement("span");
                                el.className = "remote-cursor";
                                el.style.borderLeftColor = cursor.color;

                                const label = document.createElement("div");
                                label.className = "remote-cursor-label";
                                label.textContent = cursor.name;
                                label.style.backgroundColor = cursor.color;
                                el.appendChild(label);
                                return el;
                            }
                        },
                        side: 1
                    }).range(cursor.position));
                }
                return Decoration.set(specs, true); // true = sorted
            }
        }, {
            decorations: v => v.decorations
        });

        exts.push(remoteCursorPlugin);

        return exts;
    }, [file?.language, remoteCursors]);

    if (!file) {
        return <div className="p-4 text-gray-500">No file selected. Create or open a file to start editing.</div>;
    }

    return (
        <div style={{ height: 'calc(100vh - 60px)', width: '100%', overflow: 'auto' }}>
            <CodeMirror
                value={file.content}
                height="100%"
                theme="dark"
                extensions={extensions}
                onChange={(val) => {
                    onChange(val);
                }}
                onUpdate={(viewUpdate) => {
                    if (onCursorChange) {
                        const state = viewUpdate.state;
                        const head = state.selection.main.head;
                        const line = state.doc.lineAt(head);
                        const newLine = line.number;
                        const newCol = head - line.from + 1;

                        // We could check if it changed here, but React state setter handles equality check mostly.
                        // However, onUpdate fires often. Let's just pass it up. 
                        // The issue is likely that passing a new function `setCursorPosition` or object causes re-subscription.
                        // Actually, setCursorPosition is stable.
                        // But maybe CodeMirror is re-mounting? 
                        // Let's debounce or just ensure we don't spam.
                        // Better: Check if selection changed.
                        if (viewUpdate.selectionSet) {
                            onCursorChange({
                                line: newLine,
                                col: newCol
                            });
                        }
                    }
                }}
                basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    highlightActiveLine: true,
                }}
            />
        </div>
    );
}
