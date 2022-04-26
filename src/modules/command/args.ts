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
            if (usage[i].index >= 0 && usage[i].required && !args[usage[i].index])
                throw new Error("Required argument isn't provided");
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
            this._args.push({
                index: (usage[i].index < 0) ? 0 : usage[i].index,
                name: usage[i].name,
                type: usage[i].type,
                value: `${args.get(usage[i].name).value}`
            });
        }
    }

    public getByName(name: string): string|number|boolean
    {
        for(let arg of this._args)
        {
            if (arg.name == name)
                return arg.value;
        }
        return null;
    }

    public getByIndex(index: number): string|number|boolean
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