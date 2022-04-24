import { Client, User, Message, TextChannel, GuildMember, Guild, DMChannel, PartialDMChannel, NewsChannel, ThreadChannel, CommandInteraction } from 'discord.js';
import { discord } from '..';
import { EventEmitter } from 'events';
import { readdirSync } from 'fs';
import { resolve } from 'path';
import { APIInteractionGuildMember } from 'discord.js/node_modules/discord-api-types';
import { parse } from 'shell-quote';
import { Routes, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import { REST } from '@discordjs/rest';
import { SlashCommandBuilder } from '@discordjs/builders';

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
    private _slashCommands: RESTPostAPIApplicationCommandsJSONBody[];
    private _client: Client;

    constructor(client: Client, commanddir: string)
    {
        super();
    
        this.emit('debug', 'info', "Initializing...");

        this._client = client;
        this._commands = {};
        this._slashCommands = [];

        this._init(commanddir)
        .then(() => {
            this.emit('ready');
        })
        .catch((err) => {
            this.emit('error', err);
        });
    }

    private async _init(commanddir: string): Promise<void>
    {
        this.emit('debug', 'info', "Scanning for commands...");
        let slashCommands: RESTPostAPIApplicationCommandsJSONBody[] = [];

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
                
                this.emit('debug', 'debug', `Creating Slash Command ${p}...`);
                let command = new SlashCommandBuilder()
                    .setName(hellionCommand.name)
                    .setDescription(hellionCommand.description);
                
                for (let arg of hellionCommand.usage)
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
                            this.emit('debug', 'warn', `Unknown argument type '${arg.type}' in '${p}'`);
                    }
                }
                
                slashCommands.push(command.toJSON());
            }
            catch (e)
            {
                this.emit('debug', 'warn', `Load error in the command '${p}': ${e}`);
            }
        }
        
        this.emit('ready');
    }

    public async registerSlash()
    {
        let rest = new REST({ version: '9' }).setToken(this._client.token);

        this.emit('debug', 'info', "Registering commands in Discord...");
        await rest.put(
			Routes.applicationCommands(this._client.application.id),
			{ body: this._slashCommands },
		);
    }

    public async run(message: Message, prefix: string, data: discord.HellionWardenData)
    {
        let args = parse(message.content.trim().slice(prefix.length)) as string[];
        this.runMessage(message, args.shift().toLowerCase(), args, data);
    }

    public async runMessage(message: Message, command: string, args: string[], data: discord.HellionWardenData)
    {
        this.emit('debug', 'debug', `Preparing message command '${command}'...`);
        let cmd = this._commands[command];

        if (!cmd)
        {
            this.emit('debug', 'warn', `Message command not found: '${command}'`);
            return;
        }

        let hellionArgs: HellionCommandArgs = {};
        
        this.emit('debug', 'debug', `Parsing args for message command '${command}'...`);
        for(let i = 0; i < args.length; i++)
        {
            hellionArgs[cmd.usage[i].name] = args[i];
        }

        this.emit('debug', 'debug', `Creating event for message command '${command}'...`);
        let event = new HellionCommandEvent(this, hellionArgs, {
            channel: message.channel,
            user: message.author,
            guild: message.guild,
            member: message.member
        });

        this.emit('debug', 'info', `Running message command '${command}'...`);
        cmd.run(this._client, event, data);
    }

    public async runInteraction(command: CommandInteraction, data: discord.HellionWardenData)
    {
        this.emit('debug', 'debug', `Preparing interaction command '${command.commandName}'...`);
        let cmd = this._commands[command.commandName];

        if (!cmd)
        {
            this.emit('debug', 'warn', `Interaction command not found: '${command.commandName}'`);
            return;
        }

        let hellionArgs: HellionCommandArgs = {};
        
        this.emit('debug', 'debug', `Parsing args for interaction command '${command.commandName}'...`);
        for(let i = 0; i < cmd.usage.length; i++)
        {
            let value = command.options.get(cmd.usage[i].name);

            if (!value) continue;
            if (!value.value) continue;

            hellionArgs[cmd.usage[i].name] = value.value;
        }

        this.emit('debug', 'debug', `Creating event for interaction command '${command.commandName}'...`);
        let event = new HellionCommandEvent(this, hellionArgs, {
            channel: command.channel,
            user: command.user,
            guild: command.guild,
            member: command.member
        });

        this.emit('debug', 'info', `Running interaction command '${command.commandName}'...`);
        cmd.run(this._client, event, data);
    }
}

export interface HellionCommandEventOptions
{
    user: User;
    channel: TextChannel | DMChannel | PartialDMChannel | NewsChannel | ThreadChannel;
    guild?: Guild;
    member?: GuildMember | APIInteractionGuildMember;
}

export class HellionCommandEvent
{
    private _handler: HellionCommandHandler;

    public args: HellionCommandArgs;
    public user: User;
    public channel: TextChannel | DMChannel | PartialDMChannel | NewsChannel | ThreadChannel;
    public guild?: Guild;;
    public member?: GuildMember | APIInteractionGuildMember;

    constructor(handler: HellionCommandHandler, args: HellionCommandArgs, options: HellionCommandEventOptions)
    {
        this._handler = handler;
        this.args = args;
        this.user = options.user;
        this.channel = options.channel;
        this.guild = options.guild;
        this.member = options.member;
    }

    public info(message: string): void
    {
        this._handler.emit('cmdDebug', 'info', message);
    }

    public warn(message: string): void
    {
        this._handler.emit('cmdDebug', 'warn', message);
    }

    public debug(message: string): void
    {
        this._handler.emit('cmdDebug', 'debug', message);
    }

    public error(err: Error): void
    {
        this._handler.emit('cmdError', err);
    }
}

interface HellionCommandListeners
{
    [command: string]: HellionCommandListener;
}

export interface HellionCommandArgs
{
    [index: string]: string | number | boolean;
}

export interface HellionCommandParameter
{
    name: string;
    required: boolean;
    type: 'STRING' | 'NUMBER' | 'BOOLEAN';
    description: string;
}

export class HellionCommandListener
{
    public name: string;
    public alias: string[];
    public description: string;
    public usage: HellionCommandParameter[];

    constructor()
    {
        this.name = "";
        this.alias = [];
        this.description = "";
        this.usage = [];
    }

    public async run(client: Client, event: HellionCommandEvent, data: discord.HellionWardenData): Promise<void>
    {

    }
}