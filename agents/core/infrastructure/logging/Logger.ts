/**
 * Logging Infrastructure
 * 
 * Provides structured logging for the agent system
 */

export enum LogLevel {
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

export class Logger {
  private config: LoggerConfig;
  private context: string;
  private logs: LogEntry[];
  private maxLogs: number;

  constructor(context: string = 'System', config?: Partial<LoggerConfig>) {
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

  error(message: string, metadata?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.ERROR, message, metadata, error);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  trace(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.TRACE, message, metadata);
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, any>, error?: Error): void {
    if (level > this.config.level) {
      return; // Skip logging if level is below configured threshold
    }

    const entry: LogEntry = {
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

  private addToLogs(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Maintain log size limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  private logToConsole(entry: LogEntry): void {
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

  private logToFile(entry: LogEntry): void {
    // File logging implementation would go here
    // For now, this is a placeholder
  }

  getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let filteredLogs = level !== undefined 
      ? this.logs.filter(log => log.level <= level)
      : this.logs;

    if (limit) {
      filteredLogs = filteredLogs.slice(-limit);
    }

    return filteredLogs;
  }

  clearLogs(): void {
    this.logs = [];
  }

  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  getLevel(): LogLevel {
    return this.config.level;
  }

  createChildLogger(childContext: string): Logger {
    const fullContext = `${this.context}:${childContext}`;
    return new Logger(fullContext, this.config);
  }

  getStats(): {
    totalLogs: number;
    errorCount: number;
    warnCount: number;
    infoCount: number;
    debugCount: number;
    traceCount: number;
  } {
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
  time(label: string): () => void {
    const start = Date.now();
    
    return () => {
      const duration = Date.now() - start;
      this.debug(`Timer ${label}: ${duration}ms`);
    };
  }

  /**
   * Measure execution time of an async function
   */
  async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.debug(`${label} completed in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`${label} failed after ${duration}ms`, undefined, error);
      throw error;
    }
  }
}