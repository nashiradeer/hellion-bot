import { Client, Message } from 'discord.js';
import { HellionWardenExtensions } from '../index';
import { EventEmitter } from 'events';
import { readdirSync } from 'fs';
import { resolve } from 'path';

export declare interface HellionCommandHandler
{
    on(event: 'ready', listener: () => void): this;
    on(event: 'discover', listener: (commandName: string) => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: 'cmdError', listener: (commandName: string, err: Error) => void): this;
}

export interface HellionCommandArray
{
    [index: string]: HellionCommand;
}

export class HellionCommandHandler extends EventEmitter
{
    private commands: HellionCommandArray;
    private ready: boolean;

    constructor()
    {
        console.log("[COMMAND HANDLER]: Initializing...");

        super();
        
        this.commands = {};

        this.ready = false;
    }

    public async init(commanddir: string): Promise<void>
    {
        console.log("[COMMAND HANDLER] Loading the directory...");

        if (this.ready) throw new Error("CommandHandler is already ready to be used");

        for (let p of readdirSync(commanddir)) {
            try
            {
                let hellionCommand: HellionCommand = (await import(resolve(commanddir, p))).hellionCommand;
                
                this.emit('discover', hellionCommand.name);

                this.commands[hellionCommand.name] = hellionCommand;
                console.log("[COMMAND HANDLER] Registered command '" + hellionCommand.name + "'...");

                for (let name of hellionCommand.alias)
                {
                    this.commands[name] = hellionCommand;
                    console.log("[COMMAND HANDLER] Registered alias '" + name + "' for command '" + hellionCommand.name + "'...");
                }
            }
            catch (e)
            {
                this.emit('error', e);
            }
        }

        console.log("[COMMAND HANDLER] Initialized.");

        this.ready = true;

        this.emit('ready');
    }
}

export interface HellionCommand
{
    name: string;
    alias: string[];
    description: string;
    usage: string;
    run(client: Client, message: Message, args: string[], ext: HellionWardenExtensions): void;
}