"use strict";
/**
 * Logging Infrastructure
 *
 * Provides structured logging for the agent system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
    LogLevel[LogLevel["TRACE"] = 4] = "TRACE";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor(context = 'System', config) {
        this.context = context;
        this.config = {
            level: LogLevel.INFO,
            enableConsole: true,
            enableFile: false,
            maxFileSize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
            ...config
        };
        this.logs = [];
        this.maxLogs = 1000;
    }
    error(message, metadata, error) {
        this.log(LogLevel.ERROR, message, metadata, error);
    }
    warn(message, metadata) {
        this.log(LogLevel.WARN, message, metadata);
    }
    info(message, metadata) {
        this.log(LogLevel.INFO, message, metadata);
    }
    debug(message, metadata) {
        this.log(LogLevel.DEBUG, message, metadata);
    }
    trace(message, metadata) {
        this.log(LogLevel.TRACE, message, metadata);
    }
    log(level, message, metadata, error) {
        if (level > this.config.level) {
            return; // Skip logging if level is below configured threshold
        }
        const entry = {
            timestamp: new Date(),
            level,
            message,
            context: this.context,
            metadata,
            error
        };
        // Add to in-memory logs
        this.addToLogs(entry);
        // Console logging
        if (this.config.enableConsole) {
            this.logToConsole(entry);
        }
        // File logging would be implemented here
        if (this.config.enableFile) {
            this.logToFile(entry);
        }
    }
    addToLogs(entry) {
        this.logs.push(entry);
        // Maintain log size limit
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
    }
    logToConsole(entry) {
        const timestamp = entry.timestamp.toISOString();
        const levelStr = LogLevel[entry.level].padEnd(5);
        const context = entry.context.padEnd(20);
        let logMessage = `${timestamp} [${levelStr}] ${context} ${entry.message}`;
        if (entry.metadata) {
            logMessage += ` ${JSON.stringify(entry.metadata)}`;
        }
        switch (entry.level) {
            case LogLevel.ERROR:
                console.error(logMessage);
                if (entry.error) {
                    console.error(entry.error);
                }
                break;
            case LogLevel.WARN:
                console.warn(logMessage);
                break;
            case LogLevel.INFO:
                console.info(logMessage);
                break;
            case LogLevel.DEBUG:
            case LogLevel.TRACE:
                console.log(logMessage);
                break;
        }
    }
    logToFile(entry) {
        // File logging implementation would go here
        // For now, this is a placeholder
    }
    getLogs(level, limit) {
        let filteredLogs = level !== undefined
            ? this.logs.filter(log => log.level <= level)
            : this.logs;
        if (limit) {
            filteredLogs = filteredLogs.slice(-limit);
        }
        return filteredLogs;
    }
    clearLogs() {
        this.logs = [];
    }
    setLevel(level) {
        this.config.level = level;
    }
    getLevel() {
        return this.config.level;
    }
    createChildLogger(childContext) {
        const fullContext = `${this.context}:${childContext}`;
        return new Logger(fullContext, this.config);
    }
    getStats() {
        const stats = {
            totalLogs: this.logs.length,
            errorCount: 0,
            warnCount: 0,
            infoCount: 0,
            debugCount: 0,
            traceCount: 0
        };
        this.logs.forEach(log => {
            switch (log.level) {
                case LogLevel.ERROR:
                    stats.errorCount++;
                    break;
                case LogLevel.WARN:
                    stats.warnCount++;
                    break;
                case LogLevel.INFO:
                    stats.infoCount++;
                    break;
                case LogLevel.DEBUG:
                    stats.debugCount++;
                    break;
                case LogLevel.TRACE:
                    stats.traceCount++;
                    break;
            }
        });
        return stats;
    }
    /**
     * Performance timing utility
     */
    time(label) {
        const start = Date.now();
        return () => {
            const duration = Date.now() - start;
            this.debug(`Timer ${label}: ${duration}ms`);
        };
    }
    /**
     * Measure execution time of an async function
     */
    async measureAsync(label, fn) {
        const start = Date.now();
        try {
            const result = await fn();
            const duration = Date.now() - start;
            this.debug(`${label} completed in ${duration}ms`);
            return result;
        }
        catch (error) {
            const duration = Date.now() - start;
            this.error(`${label} failed after ${duration}ms`, undefined, error);
            throw error;
        }
    }
}
exports.Logger = Logger;
//# sourceMappingURL=Logger.js.map