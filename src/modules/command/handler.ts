import { Client, User, Message, TextChannel, GuildMember, Guild, DMChannel, PartialDMChannel, NewsChannel, ThreadChannel, CommandInteraction, CommandInteractionOptionResolver, MessagePayload, InteractionReplyOptions, ReplyMessageOptions } from 'discord.js';
import { EventEmitter } from 'events';
import { readdirSync } from 'fs';
import { resolve } from 'path';
import { APIInteractionGuildMember } from 'discord.js/node_modules/discord-api-types';
import { parse } from 'shell-quote';
import { Routes, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import { REST } from '@discordjs/rest';
import { SlashCommandBuilder } from '@discordjs/builders';
import { discord } from '../..';
import { HellionCommandArgs } from '.';

export declare interface HellionCommandHandler
{
    on(event: 'ready', listener: () => void): this;
    once(event: 'ready', listener: () => void): this;

    on(event: 'error', listener: (err: Error) => void): this;
    once(event: 'error', listener: (err: Error) => void): this;

    on(event: 'debug', listener: (type: 'info'|'debug'|'warn', message: string) => void): this;
    once(event: 'debug', listener: (type: 'info'|'debug'|'warn', message: string) => void): this;

    on(event: 'cmdError', listener: (command: string, err: Error) => void): this;
    once(event: 'cmdError', listener: (command: string, err: Error) => void): this;

    on(event: 'cmdDebug', listener: (command: string, type: 'info'|'debug'|'warn', message: string) => void): this;
    once(event: 'cmdDebug', listener: (command: string, type: 'info'|'debug'|'warn', message: string) => void): this;
}

export class HellionCommandHandler extends EventEmitter
{
    private _commands: HellionCommandListeners;

    constructor()
    {
        super();

        this._commands = {};
    }

    public async init(commanddir: string): Promise<void>
    {
        this.emit('debug', 'info', "Scanning for commands...");
        let commandCount = 0;

        for (let p of readdirSync(commanddir))
        {
            try
            {
                if (!p.endsWith('.js'))
                {
                    this.emit('debug', 'warn', `File isn't a JavaScript '${p}'`);
                    continue;
                }

                this.emit('debug', 'debug', `Importing ${p}...`);

                let hellionCommand: HellionCommandListener = new (await import(resolve(commanddir, p))).HellionCommand;
                
                if (!hellionCommand.name)
                    throw new Error("HellionCommand name can't be empty");

                this.emit('debug', 'debug', `Command imported: ${hellionCommand.name}`);

                this._commands[hellionCommand.name] = hellionCommand;
                
                for (let name of hellionCommand.alias)
                {
                    this.emit('debug', 'debug', `Registering alias ${name} for ${hellionCommand.name}...`);
                    this._commands[name] = hellionCommand;
                }

                commandCount++;
            }
            catch (e)
            {
                this.emit('debug', 'warn', `Load error in the command '${p}': ${e}`);
            }
        }
        
        this.emit('debug', 'info', `Commands loaded ${commandCount}.`);
        this.emit('ready');
    }

    public async initSlashCommand(clientId: string, token: string)
    {
        this.emit('debug', 'info', "Creating Slash Commands...");
        let slashCommands: RESTPostAPIApplicationCommandsJSONBody[] = [];

        for (let cmdName in this._commands)
        {
            let cmd = this._commands[cmdName];
            if (cmdName != cmd.name)
            {
                this.emit('debug', 'debug', `Skipping '${cmdName}' because is a alias...`);
                continue;
            }

            this.emit('debug', 'debug', `Creating Slash Command for '${cmdName}'...`);
            let command = new SlashCommandBuilder()
                .setName(cmd.name)
                .setDescription(cmd.description);
            
            this.emit('debug', 'debug', `Parsing arguments for '${cmdName}'...`);
            for (let arg of cmd.usage)
            {
                switch (arg.type)
                {
                    case 'STRING':
                        command.addStringOption(option => option.setName(arg.name)
                            .setDescription(arg.description)
                            .setRequired(arg.required));
                        break;
                    case 'NUMBER':
                        command.addNumberOption(option => option.setName(arg.name)
                            .setDescription(arg.description)
                            .setRequired(arg.required));
                        break;
                    case 'BOOLEAN':
                        command.addBooleanOption(option => option.setName(arg.name)
                            .setDescription(arg.description)
                            .setRequired(arg.required));
                        break;
                    default:
                        this.emit('debug', 'warn', `Unknown argument type '${arg.type}' in '${cmdName}'`);
                }
            }
            
            slashCommands.push(command.toJSON());
        }

        this.emit('debug', 'info', "Initializing DiscordJS REST...");
        let rest = new REST({ version: '9' }).setToken(token);

        this.emit('debug', 'info', "Registering commands in Discord...");
        await rest.put(
			Routes.applicationCommands(clientId),
			{ body: slashCommands }
		);
    }

    public async run(client: Client, message: Message, prefix: string, data: any)
    {
        let args = message.content.trim().slice(prefix.length).split(' ');
        this.runMessage(client, message, args.shift().toLowerCase(), args, data);
    }

    public async runMessage(client: Client, message: Message, command: string, args: string[], data: any)
    {
        this.emit('debug', 'debug', `Preparing message command '${command}'...`);
        let cmd = this._commands[command];

        if (!cmd)
        {
            this.emit('debug', 'warn', `Message command not found: '${command}'`);
            return;
        }

        this.emit('debug', 'debug', `Creating event for message command '${command}'...`);
        let event = new HellionCommandEvent(this, cmd.name, new HellionCommandArgs(args, cmd.usage), message, {
            client: client,
            channel: message.channel,
            user: message.author,
            guild: message.guild,
            member: message.member,
            createdAt: message.createdAt,
            createdTimestamp: message.createdTimestamp
        });

        this.emit('debug', 'info', `Running message command '${command}'...`);
        cmd.run(event, data);
    }

    public async runInteraction(client: Client, command: CommandInteraction, data: discord.HellionWardenData)
    {
        this.emit('debug', 'debug', `Preparing interaction command '${command.commandName}'...`);
        let cmd = this._commands[command.commandName];

        if (!cmd)
        {
            this.emit('debug', 'warn', `Interaction command not found: '${command.commandName}'`);
            return;
        }

        this.emit('debug', 'debug', `Creating event for interaction command '${command.commandName}'...`);
        let event = new HellionCommandEvent(this, cmd.name, new HellionCommandArgs(command.options as CommandInteractionOptionResolver, cmd.usage), command as HellionCommandReply, {
            client: client,
            channel: command.channel,
            user: command.user,
            guild: command.guild,
            member: command.member,
            createdAt: command.createdAt,
            createdTimestamp: command.createdTimestamp
        });

        this.emit('debug', 'info', `Running interaction command '${command.commandName}'...`);
        cmd.run(event, data);
    }
}

export interface HellionCommandEventOptions
{
    client: Client;
    user: User;
    channel: TextChannel | DMChannel | PartialDMChannel | NewsChannel | ThreadChannel;
    guild?: Guild;
    member?: GuildMember | APIInteractionGuildMember;
    createdTimestamp: number;
    createdAt: Date;
}

export class HellionCommandEvent
{
    private _handler: HellionCommandHandler;
    private _replyHandler: HellionCommandReply;

    public command: string;
    public client: Client;
    public args: HellionCommandArgs;
    public user: User;
    public channel: TextChannel | DMChannel | PartialDMChannel | NewsChannel | ThreadChannel;
    public guild?: Guild;
    public member?: GuildMember | APIInteractionGuildMember;
    
    public createdTimestamp: number;
    public createdAt: Date;

    constructor(handler: HellionCommandHandler, command: string, args: HellionCommandArgs, reply: HellionCommandReply, options: HellionCommandEventOptions)
    {
        this._handler = handler;
        this.args = args;
        this.command = command;
        this.client = options.client;
        this.user = options.user;
        this.channel = options.channel;
        this.guild = options.guild;
        this.member = options.member;
        this.createdTimestamp = options.createdTimestamp;
        this.createdAt = this.createdAt;
        this._replyHandler = reply;
    }

    public reply(options: string|MessagePayload|InteractionReplyOptions|ReplyMessageOptions): Promise<Message>
    {
        return this._replyHandler.reply(options);  
    }

    public info(message: string): void
    {
        this._handler.emit('cmdDebug', this.command, 'info', message);
    }

    public warn(message: string): void
    {
        this._handler.emit('cmdDebug', this.command, 'warn', message);
    }

    public debug(message: string): void
    {
        this._handler.emit('cmdDebug', this.command, 'debug', message);
    }

    public error(err: Error): void
    {
        this._handler.emit('cmdError', this.command, err);
    }
}

export interface HellionCommandReply
{
    reply(options: string|MessagePayload|InteractionReplyOptions|ReplyMessageOptions): Promise<Message>;
}   

interface HellionCommandListeners
{
    [command: string]: HellionCommandListener;
}

export class HellionCommandListener
{
    public name: string;
    public alias: string[];
    public description: string;
    public category: string;
    public usage: HellionCommandUsage[];

    constructor()
    {
        this.name = "";
        this.alias = [];
        this.description = "";
        this.category = "";
        this.usage = [];
    }

    public async run(event: HellionCommandEvent, data: any): Promise<void>
    {
        throw new Error("Method not implemented");
    }
}

export interface HellionCommandUsage
{
    name: string;
    index: number;
    description: string;
    required: boolean;
    type: HellionCommandType;
}

export type HellionCommandType = 'STRING' | 'NUMBER' | 'BOOLEAN';