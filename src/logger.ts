import chalk from 'chalk';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_CONFIG: Record<LogLevel, { badge: string; color: (s: string) => string; labelColor: (s: string) => string }> = {
    debug: { badge: '⚙', color: chalk.gray, labelColor: chalk.bgGray.white },
    info: { badge: '●', color: chalk.cyan, labelColor: chalk.bgCyan.black },
    warn: { badge: '▲', color: chalk.yellow, labelColor: chalk.bgYellow.black },
    error: { badge: '✖', color: chalk.red, labelColor: chalk.bgRed.white },
};

function timestamp(): string {
    const now = new Date();
    return chalk.dim(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
}

export class Logger {
    private scope: string;

    constructor(scope: string) {
        this.scope = scope;
    }

    private log(level: LogLevel, message: string, extra?: Record<string, unknown>): void {
        const config = LEVEL_CONFIG[level];
        const prefix = `${timestamp()} ${config.color(config.badge)} ${config.labelColor(` ${level.toUpperCase()} `)} ${chalk.magenta(`[${this.scope}]`)}`;
        const line = `${prefix} ${config.color(message)}`;

        if (level === 'error') {
            console.error(line);
        } else if (level === 'warn') {
            console.warn(line);
        } else {
            console.error(line); // MCP servers write logs to stderr to keep stdout clean for protocol
        }

        if (extra && Object.keys(extra).length > 0) {
            for (const [key, value] of Object.entries(extra)) {
                const formatted = typeof value === 'object' ? JSON.stringify(value) : String(value);
                console.error(`${' '.repeat(12)}${chalk.dim('┃')} ${chalk.dim(key + ':')} ${chalk.white(formatted)}`);
            }
        }
    }

    debug(message: string, extra?: Record<string, unknown>): void {
        this.log('debug', message, extra);
    }

    info(message: string, extra?: Record<string, unknown>): void {
        this.log('info', message, extra);
    }

    warn(message: string, extra?: Record<string, unknown>): void {
        this.log('warn', message, extra);
    }

    error(message: string, extra?: Record<string, unknown>): void {
        this.log('error', message, extra);
    }

    /** Print a decorated section header */
    header(title: string): void {
        const line = chalk.cyan('━'.repeat(50));
        console.error('');
        console.error(`  ${line}`);
        console.error(`  ${chalk.cyan.bold('')} ${chalk.bold.white(title)}`);
        console.error(`  ${line}`);
        console.error('');
    }

    /** Log a progress step (for multi-stage operations) */
    step(current: number, total: number, message: string): void {
        const pct = Math.round((current / total) * 100);
        const bar = progressBar(pct, 20);
        console.error(`${timestamp()} ${chalk.blue('→')} ${chalk.magenta(`[${this.scope}]`)} ${bar} ${chalk.white(message)}`);
    }

    /** Log a tool invocation start */
    toolStart(toolName: string, params?: Record<string, unknown>): void {
        const paramStr = params
            ? Object.entries(params)
                .filter(([, v]) => v !== undefined)
                .map(([k, v]) => `${chalk.dim(k)}=${chalk.yellow(String(v))}`)
                .join(' ')
            : '';
        console.error(`${timestamp()} ${chalk.green('▶')} ${chalk.bgGreen.black(' TOOL ')} ${chalk.green.bold(toolName)} ${paramStr}`);
    }

    /** Log a tool invocation completion */
    toolEnd(toolName: string, durationMs: number, resultSummary?: string): void {
        const dur = durationMs < 1000
            ? `${Math.round(durationMs)}ms`
            : `${(durationMs / 1000).toFixed(2)}s`;
        const summary = resultSummary ? chalk.dim(` - ${resultSummary}`) : '';
        console.error(`${timestamp()} ${chalk.green('✔')} ${chalk.bgGreen.black(' DONE ')} ${chalk.green.bold(toolName)} ${chalk.dim(`(${dur})`)}${summary}`);
    }

    /** Log a tool invocation failure */
    toolError(toolName: string, durationMs: number, errorMessage: string): void {
        const dur = durationMs < 1000
            ? `${Math.round(durationMs)}ms`
            : `${(durationMs / 1000).toFixed(2)}s`;
        console.error(`${timestamp()} ${chalk.red('✖')} ${chalk.bgRed.white(' FAIL ')} ${chalk.red.bold(toolName)} ${chalk.dim(`(${dur})`)} ${chalk.red(errorMessage)}`);
    }

    /** Print a key-value stat line */
    stat(label: string, value: string | number): void {
        console.error(`${'  '.repeat(2)}${chalk.dim('•')} ${chalk.dim(label + ':')} ${chalk.white.bold(String(value))}`);
    }

    /** Print a success banner */
    success(message: string): void {
        console.error(`${timestamp()} ${chalk.green('✔')} ${chalk.green.bold(message)}`);
    }
}

function progressBar(percent: number, width: number): string {
    const filled = Math.round((percent / 100) * width);
    const empty = width - filled;
    const bar = chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
    const pctStr = chalk.white.bold(`${percent}%`.padStart(4));
    return `${chalk.dim('[')}${bar}${chalk.dim(']')} ${pctStr}`;
}

export const log = new Logger('server');
