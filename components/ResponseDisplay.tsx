import React from 'react';
import { QueryResult, QueryClassification } from '../types';

interface ResponseDisplayProps {
  result: QueryResult;
}

const styles: { [key: string]: React.CSSProperties } = {
    card: {
        backgroundColor: 'var(--surface-color)',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        border: '1px solid var(--border-color)',
    },
    querySection: {
        marginBottom: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    },
    queryText: {
        margin: 0,
        fontWeight: 500,
        fontSize: '1.1em',
    },
    responseHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '10px',
        borderTop: '1px solid var(--border-color)',
        paddingTop: '15px'
    },
    geminiLogo: {
        width: '24px',
        height: '24px',
    },
    responseTitle: {
        margin: 0,
        fontWeight: 'bold',
        fontSize: '1em',
    },
    metadata: {
        display: 'flex',
        gap: '10px',
        fontSize: '0.8em',
        alignItems: 'center',
        marginLeft: 'auto'
    },
    tag: {
        padding: '3px 8px',
        borderRadius: '12px',
        color: '#fff',
        fontWeight: 500,
    },
    trivialTag: {
        backgroundColor: '#34a853',
    },
    complexTag: {
        backgroundColor: '#4285f4',
    },
    modelTag: {
        backgroundColor: '#777',
    },
    answer: {
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        color: 'var(--text-muted-color)',
        maxHeight: '400px',
        overflowY: 'auto',
        paddingRight: '10px',
        margin: 0,
        fontFamily: 'inherit'
    },
    error: {
        color: '#ea4335',
        fontWeight: 'bold',
    },
};

const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ result }) => {
    const classificationStyle = result.classification === QueryClassification.TRIVIAL
        ? styles.trivialTag
        : styles.complexTag;

    return (
        <article style={styles.card} aria-labelledby={`query-${result.id}`}>
            <div style={styles.querySection}>
                <p style={styles.queryText} id={`query-${result.id}`}>
                   <span style={{color: 'var(--text-muted-color)'}}>You:</span> {result.query}
                </p>
            </div>
            <div style={styles.responseHeader}>
                 <svg style={styles.geminiLogo} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.0002 8.74834C11.6669 8.74834 11.3335 8.88168 11.0835 9.13168C10.8335 9.38168 10.7002 9.71501 10.7002 10.125C10.7002 10.535 10.8335 10.8683 11.0835 11.1183C11.3335 11.3683 11.6669 11.5 12.0002 11.5C12.3335 11.5 12.6669 11.3683 12.9169 11.1183C13.1669 10.8683 13.3002 10.535 13.3002 10.125C13.3002 9.71501 13.1669 9.38168 12.9169 9.13168C12.6669 8.88168 12.3335 8.74834 12.0002 8.74834ZM8.5502 12.5C8.1002 12.5 7.71186 12.6517 7.3852 12.955C7.05853 13.2583 6.9002 13.63 6.9002 14.07C6.9002 14.51 7.05853 14.8817 7.3852 15.185C7.71186 15.4883 8.1002 15.64 8.5502 15.64C9.0002 15.64 9.38853 15.4883 9.7152 15.185C10.0419 14.8817 10.2002 14.51 10.2002 14.07C10.2002 13.63 10.0419 13.2583 9.7152 12.955C9.38853 12.6517 9.0002 12.5 8.5502 12.5ZM12.0002 2C16.9502 2 21.0002 6.05 21.0002 11C21.0002 15.95 16.9502 20 12.0002 20C9.3702 20 7.00019 18.98 5.25019 17.34L3.8002 18.79C3.6102 18.98 3.3602 19.08 3.0502 19.08C2.4702 19.08 2.0002 18.61 2.0002 18.03V12.5C2.0002 12.19 2.1102 11.94 2.3302 11.75L3.4302 10.65C2.5302 9.04 2.0002 7.14 2.0002 5C2.0002 4.16 2.1202 3.35 2.3602 2.58L1.0302 1.25C0.6802 0.9 0.8102 0.299998 1.2502 0.039998C1.6902 -0.22 2.3002 -0.09 2.5802 0.36L5.2202 3.01C6.8802 2.35 8.7602 2 12.0002 2Z" fill="var(--primary-color)"/></svg>
                <h3 style={styles.responseTitle}>Gemini Response</h3>
                <div style={styles.metadata}>
                    <span style={{ ...styles.tag, ...classificationStyle }} title="Query Classification">{result.classification}</span>
                    <span style={{ ...styles.tag, ...styles.modelTag }} title="Model Used">{result.modelUsed}</span>
                </div>
            </div>
            {result.error ? (
                <p style={styles.error}>{result.error}</p>
            ) : (
                <pre style={styles.answer}>{result.answer}</pre>
            )}
        </article>
    );
};

export default ResponseDisplay;
