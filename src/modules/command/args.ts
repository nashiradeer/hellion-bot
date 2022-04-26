import { CommandInteractionOptionResolver } from "discord.js";
import { HellionCommandUsage, HellionCommandType } from '.';

export class HellionCommandArgs
{
    private _args: HellionCommandParsedArgs[];

    constructor(args: string[]|CommandInteractionOptionResolver, usage: HellionCommandUsage[])
    {
        this._args = [];

        if (args instanceof CommandInteractionOptionResolver)
            this.parseDiscordJS(args, usage);
        else
            this.parseString(args, usage);
    }

    private parseString(args: string[], usage: HellionCommandUsage[]): void
    {
        for (let i = 0; i < usage.length; i++)
        {
            if (usage[i].index >= 0 && !args[usage[i].index])
                continue;
            this._args.push({
                index: ((usage[i].index < 0) ? 0 : usage[i].index),
                name: usage[i].name,
                type: usage[i].type,
                value: ((usage[i].index < 0) ? args.join(' ') : args[usage[i].index])
            });
        }
    }

    private parseDiscordJS(args: CommandInteractionOptionResolver, usage: HellionCommandUsage[]): void
    {
        for (let i = 0; i < usage.length; i++)
        {
            let arg = args.get(usage[i].name);
            if (!arg)
                continue;
            this._args.push({
                index: (usage[i].index < 0) ? 0 : usage[i].index,
                name: usage[i].name,
                type: usage[i].type,
                value: `${arg.value}`
            });
        }
    }

    public getByName(name: string): string
    {
        for(let arg of this._args)
        {
            if (arg.name == name)
                return arg.value;
        }
        return null;
    }

    public getByIndex(index: number): string
    {
        for(let arg of this._args)
        {
            if (arg.index == index)
                return arg.value;
        }
        return null;
    }
}

export interface HellionCommandParsedArgs
{
    index: number;
    name: string;
    type: HellionCommandType;
    value: string;
}   