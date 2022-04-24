export type HellionLoggerLevel = 'debug' | 'info' | 'warn' | 'error';

export interface HellionLoggerMessage
{
    timestamp: Date;
    level: HellionLoggerLevel;
    label: string;
    message: string;
}

export class HellionLoggerTransporter
{
    protected _formatter: HellionLoggerFormatter;
    protected _level: HellionLoggerLevel;
    protected _levelNumber: number;

    constructor(formatter: HellionLoggerFormatter, level: HellionLoggerLevel)
    {
        this._formatter = formatter;
        this._level = level;
        this._levelNumber = HellionLoggerFormatter.getLevelNumber(level);
    }

    public setFormatter(formatter: HellionLoggerFormatter)
    {
        this._formatter = formatter;
    }

    public getFormatter(): HellionLoggerFormatter
    {
        return this._formatter;
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

    public log(message: HellionLoggerMessage, ...props: any[]): void
    {
        if (HellionLoggerFormatter.getLevelNumber(message.level) <= this._levelNumber)
            this.write(this._formatter.format(message, ...props));
    }

    protected write(message: string)
    {
        throw new Error("Method not implemented");
    }
}

export class HellionLoggerFormatter
{
    public static getLevelNumber(level: HellionLoggerLevel)
    {
        switch (level.toLowerCase())
        {
            case "error": return 0;
            case "warn": return 1;
            case "info": return 2;
            case "debug": return 3;
            default: return 4;
        }
    }

    public formatTimestamp(date: Date): string
    {
        return date.getUTCFullYear().toString().padStart(4, '0') + "-" +
            date.getUTCMonth().toString().padStart(2, '0') + "-" +
            date.getUTCDate().toString().padStart(2, '0') + " " +
            date.getUTCHours().toString().padStart(2, '0') + ":" +
            date.getUTCMinutes().toString().padStart(2, '0') + ":" +
            date.getUTCSeconds().toString().padStart(2, '0');
    }

    public formatMessage(message: string, ...props: any[]): string
    {
        for (let prop of props)
        {
            if (prop instanceof Error && prop.stack)
                message += " " + prop.stack;
            else 
                message += " " + prop.toString();
        }
        return message;
    }

    public formatLevel(level: HellionLoggerLevel)
    {
        switch(level.toLowerCase())
        {
            case "error": return "ERROR";
            case "warn": return "WARN";
            case "info": return "INFO";
            case "debug": return "DEBUG";
            default: return "UNKNOWN";
        }
    }

    public format(message: HellionLoggerMessage, ...props: any[]): string
    {
        message.message = this.formatMessage(message.message, props);
        return "[" + this.formatTimestamp(message.timestamp) +
            "] (" + message.label +
            "/" + this.formatLevel(message.level) +
            "): " + this.formatMessage(message.message, ...props) + "\n";
    }
}