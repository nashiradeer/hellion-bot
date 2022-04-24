import { HellionLoggerTransporter, HellionLoggerFormatter, HellionLoggerLevel } from "..";
import { createWriteStream, WriteStream } from 'fs';

export class HellionFileTransporter extends HellionLoggerTransporter
{
    private _stream: WriteStream;

    constructor(filename: string, formatter: HellionLoggerFormatter, level: HellionLoggerLevel)
    {
        super(formatter, level);
        this._stream = createWriteStream(filename, { flags: 'a', encoding: 'utf-8' });
    }

    protected write(message: string): void {
        this._stream.write(message);
    }
}