import { HellionLoggerFormatter, HellionLoggerMessage } from "..";

export class HellionJSONFormatter extends HellionLoggerFormatter
{
    public format(message: HellionLoggerMessage, ...props: any[]): string {
        return JSON.stringify({
            timestamp: this.formatTimestamp(message.timestamp),
            level: message.level.toLowerCase(),
            label: message.label,
            message: this.formatMessage(message.message, ...props)
        });
    }
}