import React, { useState, useRef, useEffect } from 'react';
import { getSmartAnswer } from './services/geminiService';
import { QueryResult, QueryClassification } from './types';
import ResponseDisplay from './components/ResponseDisplay';

const styles = {
    container: {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
    },
    header: {
        textAlign: 'center' as const,
        marginBottom: '40px',
    },
    title: {
        fontSize: '2.5em',
        fontWeight: '700',
        color: 'var(--primary-color)',
        margin: '0 0 10px 0',
    },
    // FIX: An object literal cannot have multiple properties with the same name. Removed duplicate 'margin' property.
    subtitle: {
        fontSize: '1.1em',
        color: 'var(--text-muted-color)',
        maxWidth: '600px',
        margin: '0 auto',
    },
    form: {
        display: 'flex',
        gap: '10px',
        marginBottom: '40px',
        alignItems: 'flex-end',
    },
    textarea: {
        flexGrow: 1,
        padding: '15px',
        fontSize: '1em',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--surface-color)',
        color: 'var(--text-color)',
        resize: 'none' as const,
        overflowY: 'hidden' as const,
        minHeight: '54px',
        fontFamily: 'inherit',
    },
    button: {
        padding: '0 20px',
        height: '54px',
        fontSize: '1em',
        fontWeight: '500',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: 'var(--primary-color)',
        color: '#fff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s',
    },
    buttonDisabled: {
        backgroundColor: '#555',
        cursor: 'not-allowed',
    },
    spinner: {
        border: '3px solid rgba(255, 255, 255, 0.3)',
        borderTop: '3px solid #fff',
        borderRadius: '50%',
        width: '20px',
        height: '20px',
        animation: 'spin 1s linear infinite',
    },
    resultsContainer: {},
    emptyState: {
        textAlign: 'center' as const,
        color: 'var(--text-muted-color)',
        padding: '40px 0',
        border: '2px dashed var(--border-color)',
        borderRadius: '8px',
    }
};


const App: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<QueryResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [query]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || isLoading) return;

        setIsLoading(true);
        const userQuery = query.trim();
        const optimisticId = `temp-${Date.now()}`;

        // Optimistically add a placeholder to the UI
        const optimisticResult: QueryResult = {
            id: optimisticId,
            query: userQuery,
            classification: QueryClassification.COMPLEX, // placeholder
            modelUsed: 'Thinking...',
            answer: '...',
        };
        setResults(prev => [optimisticResult, ...prev]);
        setQuery('');

        try {
            const resultData = await getSmartAnswer(userQuery);
            const newResult: QueryResult = {
                id: `id-${Date.now()}`,
                query: userQuery,
                ...resultData,
            };
            setResults(prev => prev.map(r => r.id === optimisticId ? newResult : r));
        } catch (error) {
            console.error(error);
            const errorResult: QueryResult = {
                id: `id-${Date.now()}`,
                query: userQuery,
                classification: QueryClassification.TRIVIAL, // default
                modelUsed: 'N/A',
                answer: '',
                error: 'An unexpected error occurred. Check the console for more details.',
            };
            setResults(prev => prev.map(r => r.id === optimisticId ? errorResult : r));
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as any);
        }
    };

    return (
        <main style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>Gemini Smart Router</h1>
                <p style={styles.subtitle}>
                    Enter a query below. The system will classify it as 'Trivial' or 'Complex' and route it to the optimal Gemini model for a response.
                </p>
            </header>

            <form onSubmit={handleSubmit} style={styles.form}>
                <textarea
                    ref={textareaRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={styles.textarea}
                    placeholder="e.g., What is the capital of France?"
                    rows={1}
                    disabled={isLoading}
                    aria-label="Query Input"
                />
                <button type="submit" style={{...styles.button, ...(isLoading ? styles.buttonDisabled : {})}} disabled={isLoading}>
                    {isLoading ? <div style={styles.spinner}></div> : 'Ask'}
                </button>
            </form>

            <section style={styles.resultsContainer} aria-live="polite">
                {results.length === 0 ? (
                    <div style={styles.emptyState}>
                        <p>Your smart responses will appear here.</p>
                    </div>
                ) : (
                    results.map((result) => (
                        <ResponseDisplay key={result.id} result={result} />
                    ))
                )}
            </section>
        </main>
    );
};

export default App;