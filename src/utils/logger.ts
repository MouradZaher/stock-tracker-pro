/**
 * Structured Logging Utility
 * Provides type-safe logging with different levels and contexts
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export const LogLevel = {
    DEBUG: 'debug' as const,
    INFO: 'info' as const,
    WARN: 'warn' as const,
    ERROR: 'error' as const,
};

interface LogContext {
    component?: string;
    action?: string;
    userId?: string;
    [key: string]: any;
}

class Logger {
    private isDevelopment: boolean;
    private minLevel: LogLevel;

    constructor() {
        this.isDevelopment = import.meta.env.DEV;
        this.minLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;
    }

    private shouldLog(level: LogLevel): boolean {
        const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
        const currentLevelIndex = levels.indexOf(level);
        const minLevelIndex = levels.indexOf(this.minLevel);
        return currentLevelIndex >= minLevelIndex;
    }

    private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
        const timestamp = new Date().toISOString();
        const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
    }

    private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
        if (!this.shouldLog(level)) return;

        const formattedMessage = this.formatMessage(level, message, context);

        switch (level) {
            case LogLevel.DEBUG:
                console.debug(formattedMessage, error || '');
                break;
            case LogLevel.INFO:
                console.info(formattedMessage, error || '');
                break;
            case LogLevel.WARN:
                console.warn(formattedMessage, error || '');
                break;
            case LogLevel.ERROR:
                console.error(formattedMessage, error || '');
                // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
                break;
        }
    }

    debug(message: string, context?: LogContext): void {
        this.log(LogLevel.DEBUG, message, context);
    }

    info(message: string, context?: LogContext): void {
        this.log(LogLevel.INFO, message, context);
    }

    warn(message: string, context?: LogContext): void {
        this.log(LogLevel.WARN, message, context);
    }

    error(message: string, error?: Error, context?: LogContext): void {
        this.log(LogLevel.ERROR, message, context, error);
    }

    /**
     * Performance logging
     */
    performance(label: string, duration: number, context?: LogContext): void {
        this.info(`Performance: ${label} took ${duration.toFixed(2)}ms`, context);
    }

    /**
     * API request logging
     */
    apiRequest(method: string, url: string, context?: LogContext): void {
        this.debug(`API Request: ${method} ${url}`, context);
    }

    apiResponse(method: string, url: string, status: number, duration: number, context?: LogContext): void {
        const message = `API Response: ${method} ${url} - ${status} (${duration.toFixed(2)}ms)`;
        if (status >= 400) {
            this.warn(message, context);
        } else {
            this.debug(message, context);
        }
    }

    /**
     * User action logging
     */
    userAction(action: string, context?: LogContext): void {
        this.info(`User Action: ${action}`, context);
    }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Performance measurement utility
 */
export const measurePerformance = async <T>(
    label: string,
    fn: () => Promise<T> | T,
    context?: LogContext
): Promise<T> => {
    const start = performance.now();
    try {
        const result = await fn();
        const duration = performance.now() - start;
        logger.performance(label, duration, context);
        return result;
    } catch (error) {
        const duration = performance.now() - start;
        logger.error(`${label} failed after ${duration.toFixed(2)}ms`, error as Error, context);
        throw error;
    }
};
