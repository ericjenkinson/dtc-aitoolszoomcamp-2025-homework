import React, { useEffect, useRef, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { EditorView, Decoration, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view';
import { StateField, StateEffect } from '@codemirror/state';

// Effect to update cursors
const setCursorsEffect = StateEffect.define();

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

// Define Widget Class outside component
class RemoteCursorWidget extends WidgetType {
    constructor(color, name) {
        super();
        this.color = color;
        this.name = name;
    }

    eq(other) {
        return other.color === this.color && other.name === this.name;
    }

    toDOM() {
        const el = document.createElement("span");
        el.className = "remote-cursor";
        el.style.borderLeftColor = this.color;

        const label = document.createElement("div");
        label.className = "remote-cursor-label";
        label.textContent = this.name;
        label.style.backgroundColor = this.color;
        el.appendChild(label);
        return el;
    }

    ignoreEvent() {
        return true;
    }
}

export function Editor({ file, onChange, remoteCursors = [], onCursorChange }) {
    // remoteCursors is Array<{userId, position, color, name}>

    const viewRef = useRef(null);

    // Helper to build decorations (returns Array of Sets)
    const buildCursorSets = (cursors, docLength) => {
        const sets = [];

        for (const cursor of cursors) {
            const specs = [];
            try {
                let pos = cursor.position;
                if (pos === null || pos === undefined || typeof pos !== 'number') continue;

                pos = Math.min(Math.max(0, pos), docLength);

                // Selection
                if (cursor.selection &&
                    typeof cursor.selection.from === 'number' &&
                    typeof cursor.selection.to === 'number' &&
                    cursor.selection.from !== cursor.selection.to) {

                    const from = Math.min(Math.max(0, cursor.selection.from), docLength);
                    const to = Math.min(Math.max(0, cursor.selection.to), docLength);

                    if (from < to) {
                        specs.push(Decoration.mark({
                            attributes: { style: `background-color: ${cursor.color}40` },
                            class: "remote-selection"
                        }).range(from, to));
                    }
                }

                // Cursor Widget
                specs.push(Decoration.widget({
                    widget: new RemoteCursorWidget(cursor.color, cursor.name),
                    side: 1
                }).range(pos));

                // Sort specs for THIS cursor/user only
                specs.sort((a, b) => {
                    if (a.from === b.from) return a.to - b.to;
                    return a.from - b.from;
                });

                if (specs.length > 0) {
                    try {
                        sets.push(Decoration.set(specs));
                    } catch (err) {
                        console.error('Decoration.set failed for cursor:', cursor.userId, err);
                        // Optionally, you could push Decoration.none here if you want to explicitly add an empty set
                        // sets.push(Decoration.none);
                    }
                }
            } catch (e) {
                console.error('Cursor render error:', e);
            }
        }
        return sets;
    };

    // Cursor Extension (StateField<DecorationSet[]>)
    const cursorExtension = useMemo(() => {
        return StateField.define({
            create() { return []; }, // Start with empty array of sets
            update(sets, tr) {
                // 1. Check for cursor update effect
                for (const effect of tr.effects) {
                    if (effect.is(setCursorsEffect)) {
                        return buildCursorSets(effect.value, tr.state.doc.length);
                    }
                }
                // 2. Map existing decorations
                return sets.map(set => set.map(tr.changes));
            },
            // Use computeN to provide multiple sets
            provide: f => EditorView.decorations.computeN([f], state => state.field(f))
        });
    }, []);

    const extensions = useMemo(() => {
        const exts = [darkTheme, cursorExtension];

        if (file?.language === 'javascript') {
            exts.push(javascript({ jsx: true }));
        } else if (file?.language === 'python') {
            exts.push(python());
        }
        return exts;
    }, [file?.language, cursorExtension]);

    // Dispatch cursor updates
    useEffect(() => {
        if (viewRef.current) {
            viewRef.current.dispatch({
                effects: setCursorsEffect.of(remoteCursors)
            });
        }
    }, [remoteCursors]);

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
                onCreateEditor={(view) => {
                    viewRef.current = view;
                }}
                onChange={(val) => {
                    onChange(val);
                }}
                onUpdate={(viewUpdate) => {
                    if (onCursorChange) {
                        const state = viewUpdate.state;
                        const head = state.selection.main.head; // Offset
                        const anchor = state.selection.main.anchor; // Offset

                        // For Status Line
                        const line = state.doc.lineAt(head);
                        const newLine = line.number;
                        const newCol = head - line.from + 1;

                        if (viewUpdate.selectionSet) {
                            onCursorChange({
                                line: newLine,
                                col: newCol,
                                position: head, // Offset
                                selection: {
                                    from: Math.min(head, anchor),
                                    to: Math.max(head, anchor)
                                }
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
