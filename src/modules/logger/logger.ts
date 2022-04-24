import { HellionLoggerLevel, HellionLoggerMessage, HellionLoggerFormatter, HellionLoggerTransporter } from ".";

interface HellionLoggerPool 
{
    [label: string]: HellionLogger;
}

export interface HellionLoggerTransporterPool
{
    [label: string]: HellionLoggerTransporter;
}

export interface HellionLoggerOptions
{
    level?: HellionLoggerLevel;
    transporters?: HellionLoggerTransporterPool;
}

export class HellionLogger
{
    // Static

    private static _loggers: HellionLoggerPool = {};
    private static _transporters: HellionLoggerTransporterPool = {}; 

    public static getLogger(label: string, options?: HellionLoggerOptions): HellionLogger
    {
        if (!label)
            throw new TypeError("Invalid logger label");

        if (this._loggers[label])
            return this._loggers[label];
        
        let opt = options || {};
        opt.transporters = opt.transporters || this._transporters;
        return this._loggers[label] = new HellionLogger(label, opt);
    }

    public static addTransporter(name: string, transporter: HellionLoggerTransporter): void
    {
        this._transporters[name] = transporter;
    }

    public static getTransporter(name: string): HellionLoggerTransporter
    {
        return this._transporters[name];
    }

    public static delTransporter(name: string): void
    {
        this._transporters[name] = undefined;
    }

    public static clearTransporters(): void
    {
        this._transporters = {};
    }

    // Instance
    
    private _transporters: HellionLoggerTransporterPool;
    private _level: HellionLoggerLevel;
    private _levelNumber: number;
    private _label: string;

    private constructor(label: string, options?: HellionLoggerOptions)
    {
        this._label = label;
        let opt = options || {};
        this._level = opt.level || 'debug';
        this._levelNumber = HellionLoggerFormatter.getLevelNumber(this._level);
        this._transporters = opt.transporters || {};
    }

    public addTransporter(name: string, transporter: HellionLoggerTransporter): void
    {
        this._transporters[name] = transporter;
    }

    public getTransporter(name: string): HellionLoggerTransporter
    {
        return this._transporters[name];
    }

    public delTransporter(name: string): void
    {
        this._transporters[name] = undefined;
    }

    public clearTransporters(): void
    {
        this._transporters = {};
    }

    public setLevel(level: HellionLoggerLevel): void
    {
        this._level = level;
        this._levelNumber = HellionLoggerFormatter.getLevelNumber(level);
    }

    public getLevel(): HellionLoggerLevel
    {
        return this._level;
    }

    public log(level: HellionLoggerLevel, message: string, ...props: any[])
    {
        if (HellionLoggerFormatter.getLevelNumber(level) <= this._levelNumber)
        {
            for (let transporter of Object.values(this._transporters))
            {
                transporter.log({label: this._label, level, message, timestamp: new Date()}, ...props);
            }
        }
    }

    public debug(message: string, ...props: any[]): void
    {
        this.log('debug', message, ...props);
    }

    public info(message: string, ...props: any[]): void
    {
        this.log('info', message, ...props);
    }

    public warn(message: string, ...props: any[]): void
    {
        this.log('warn', message, ...props);
    }

    public error(message: string, ...props: any[]): void
    {
        this.log('error', message, ...props);
    }
}
