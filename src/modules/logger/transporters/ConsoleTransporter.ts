import { HellionLoggerTransporter, HellionLoggerFormatter, HellionLoggerLevel } from "..";
import { Writable } from 'stream';
import { HellionLoggerMessage } from "../base";

export class ConsoleTransporter extends HellionLoggerTransporter
{
    constructor(formatter: HellionLoggerFormatter, level: HellionLoggerLevel)
    {
        super(formatter, level);
    }

    public log(message: HellionLoggerMessage, ...props: any[]): void
    {
        let levelNum = HellionLoggerFormatter.getLevelNumber(message.level);
        if (levelNum <= 1)
        {
            process.stderr.write(this._formatter.format(message, ...props));
        }
        else if (levelNum <= this._levelNumber)
        {
            process.stdout.write(this._formatter.format(message, ...props));
        }
    }
}