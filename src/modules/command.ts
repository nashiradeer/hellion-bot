import { Base, Client, Message } from 'discord.js';
import { HellionWardenExtensions } from '../index';
import { EventEmitter } from 'events';

export declare interface HellionCommandHandler
{
    on(event: 'ready', listener: () => void): this;
    on(event: 'discover', listener: (commandName: string) => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
}

export class HellionCommandHandler extends EventEmitter
{
    constructor(commanddir: string)
    {
        super();
  
    }

    private 
}

export interface HellionCommand
{
    name: string;
    alias: string[];
    description: string;
    usage: string;
    run(client: Client, message: Message, args: string[], ext: HellionWardenExtensions): void;
}