
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
}

class SecureLogger {
  private isDevelopment = import.meta.env.DEV;
  
  private sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }
    
    const sanitized = { ...data };
    const sensitiveFields = ['password', 'token', 'email', 'user_id', 'id'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        if (this.isDevelopment) {
          sanitized[field] = `[${field.toUpperCase()}_REDACTED]`;
        } else {
          delete sanitized[field];
        }
      }
    }
    
    return sanitized;
  }
  
  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: context ? this.sanitizeData(context) : undefined
    };
    
    if (this.isDevelopment) {
      console[level === 'debug' ? 'log' : level](
        `[${entry.timestamp}] ${level.toUpperCase()}: ${message}`,
        entry.context || ''
      );
    } else if (level === 'error' || level === 'warn') {
      // In production, only log errors and warnings
      console[level](message);
    }
  }
  
  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }
  
  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }
  
  error(message: string, context?: Record<string, any>) {
    this.log('error', message, context);
  }
  
  debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, context);
  }
}

export const secureLogger = new SecureLogger();
