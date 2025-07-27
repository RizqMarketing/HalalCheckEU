/**
 * Logging Infrastructure
 *
 * Provides structured logging for the agent system
 */
export declare enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
    TRACE = 4
}
export interface LogEntry {
    timestamp: Date;
    level: LogLevel;
    message: string;
    context?: string;
    metadata?: Record<string, any>;
    error?: Error;
}
export interface LoggerConfig {
    level: LogLevel;
    context?: string;
    enableConsole?: boolean;
    enableFile?: boolean;
    filePath?: string;
    maxFileSize?: number;
    maxFiles?: number;
}
export declare class Logger {
    private config;
    private context;
    private logs;
    private maxLogs;
    constructor(context?: string, config?: Partial<LoggerConfig>);
    error(message: string, metadata?: Record<string, any>, error?: Error): void;
    warn(message: string, metadata?: Record<string, any>): void;
    info(message: string, metadata?: Record<string, any>): void;
    debug(message: string, metadata?: Record<string, any>): void;
    trace(message: string, metadata?: Record<string, any>): void;
    private log;
    private addToLogs;
    private logToConsole;
    private logToFile;
    getLogs(level?: LogLevel, limit?: number): LogEntry[];
    clearLogs(): void;
    setLevel(level: LogLevel): void;
    getLevel(): LogLevel;
    createChildLogger(childContext: string): Logger;
    getStats(): {
        totalLogs: number;
        errorCount: number;
        warnCount: number;
        infoCount: number;
        debugCount: number;
        traceCount: number;
    };
    /**
     * Performance timing utility
     */
    time(label: string): () => void;
    /**
     * Measure execution time of an async function
     */
    measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T>;
}
//# sourceMappingURL=Logger.d.ts.map