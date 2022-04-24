import { HellionLoggerFormatter, HellionLoggerMessage, HellionLoggerLevel } from "..";

export class HellionColorizeFormatter extends HellionLoggerFormatter
{
    public formatColor(level: HellionLoggerLevel): string {
        switch (level.toLowerCase())
        {
            case "error": return "\u001b[31m";
            case "warn": return "\u001b[33m";
            case "info": return "\u001b[32m";
            case "debug": return "\u001b[34m";
            default: return "\u001b[0m";
        }
    }

    public format(message: HellionLoggerMessage, ...props: any[]): string
    {
        message.message = this.formatMessage(message.message, props);
        return this.formatColor(message.level) +
            "[" + this.formatTimestamp(message.timestamp) +
            "] (" + message.label +
            "/" + this.formatLevel(message.level) +
            "): " + this.formatMessage(message.message, ...props) + "\u001b[0m\n";
    }
}