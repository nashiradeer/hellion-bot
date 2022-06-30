import { Client, User, Message, GuildMember, Guild, CommandInteraction, CommandInteractionOptionResolver, MessagePayload, InteractionReplyOptions, ReplyMessageOptions, InteractionDeferReplyOptions, TextBasedChannel } from 'discord.js';
import { EventEmitter } from 'events';
import { readdirSync } from 'fs';
import { resolve } from 'path';
import { Routes, RESTPostAPIApplicationCommandsJSONBody, APIApplicationCommandOptionChoice, APIInteractionGuildMember } from 'discord.js/node_modules/discord-api-types/v9';
import { REST } from '@discordjs/rest';
import { SlashCommandBuilder } from '@discordjs/builders';
import { discord } from '../..';
import { HellionCommandArgs } from '.';

export declare interface HellionCommandHandler {
    on(event: 'ready', listener: () => void): this;
    once(event: 'ready', listener: () => void): this;

    on(event: 'error', listener: (err: Error) => void): this;
    once(event: 'error', listener: (err: Error) => void): this;

    on(event: 'debug', listener: (type: 'info' | 'debug' | 'warn', message: string) => void): this;
    once(event: 'debug', listener: (type: 'info' | 'debug' | 'warn', message: string) => void): this;

    on(event: 'cmdError', listener: (command: string, err: Error) => void): this;
    once(event: 'cmdError', listener: (command: string, err: Error) => void): this;

    on(event: 'cmdDebug', listener: (command: string, type: 'info' | 'debug' | 'warn', message: string) => void): this;
    once(event: 'cmdDebug', listener: (command: string, type: 'info' | 'debug' | 'warn', message: string) => void): this;
}

export class HellionCommandHandler extends EventEmitter {
    private _commands: HellionCommandListeners;

    constructor() {
        super();

        this._commands = {};
    }

    public async init(commanddir: string): Promise<void> {
        this.emit('debug', 'info', "Scanning for commands...");
        let commandCount = 0;

        for (let p of readdirSync(commanddir)) {
            try {
                if (!p.endsWith('.js')) {
                    this.emit('debug', 'warn', `File isn't a JavaScript '${p}'`);
                    continue;
                }

                this.emit('debug', 'debug', `Importing ${p}...`);

                let hellionCommand: HellionCommandListener = new (await import(resolve(commanddir, p))).HellionCommand;

                if (!hellionCommand.name)
                    throw new Error("HellionCommand name can't be empty");

                this.emit('debug', 'debug', `Command imported: ${hellionCommand.name}`);

                this._commands[hellionCommand.name] = hellionCommand;

                for (let name of hellionCommand.alias) {
                    this.emit('debug', 'debug', `Registering alias ${name} for ${hellionCommand.name}...`);
                    this._commands[name] = hellionCommand;
                }

                commandCount++;
            }
            catch (e) {
                this.emit('debug', 'warn', `Load error in the command '${p}': ${e}`);
            }
        }

        this.emit('debug', 'info', `Commands loaded ${commandCount}.`);
        this.emit('ready');
    }

    public async initSlashCommand(clientId: string, token: string) {
        this.emit('debug', 'info', "Creating Slash Commands...");
        let slashCommands: RESTPostAPIApplicationCommandsJSONBody[] = [];

        for (let cmdName in this._commands) {
            let cmd = this._commands[cmdName];
            if (cmdName != cmd.name) {
                this.emit('debug', 'debug', `Skipping '${cmdName}' because is a alias...`);
                continue;
            }

            this.emit('debug', 'debug', `Creating Slash Command for '${cmdName}'...`);
            let command = new SlashCommandBuilder()
                .setName(cmd.name)
                .setDescription(cmd.description);

            this.emit('debug', 'debug', `Parsing arguments for '${cmdName}'...`);
            for (let arg of cmd.usage) {
                switch (arg.type) {
                    case 'STRING':
                        let choicesStr: APIApplicationCommandOptionChoice<string>[] = [];
                        if (arg.choices)
                            for (let choice of arg.choices)
                                choicesStr.push({ name: choice.name, value: choice.value as string });
                        command.addStringOption(option => option.setName(arg.name)
                            .setDescription(arg.description)
                            .setRequired(arg.required)
                            .addChoices(...choicesStr));
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
                    case 'INTEGER':
                        let choicesInt: APIApplicationCommandOptionChoice<number>[] = [];
                        if (arg.choices)
                            for (let choice of arg.choices)
                                choicesInt.push({ name: choice.name, value: choice.value as number });
                        command.addIntegerOption(option => option.setName(arg.name)
                            .setDescription(arg.description)
                            .setRequired(arg.required)
                            .addChoices(...choicesInt));
                        break;
                    case 'USER':
                        command.addUserOption(option => option.setName(arg.name)
                            .setDescription(arg.description)
                            .setRequired(arg.required));
                        break;
                    case 'CHANNEL':
                        command.addChannelOption(option => option.setName(arg.name)
                            .setDescription(arg.description)
                            .setRequired(arg.required));
                        break;
                    case 'ROLE':
                        command.addRoleOption(option => option.setName(arg.name)
                            .setDescription(arg.description)
                            .setRequired(arg.required));

                        break;
                    case 'MENTIONABLE':
                        command.addMentionableOption(option => option.setName(arg.name)
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

    public async run(client: Client, message: Message, prefix: string, data: any) {
        let args = message.content.trim().slice(prefix.length).split(' ');
        await this.runMessage(client, message, args.shift()?.toLowerCase() || '', args, data);
    }

    public async runMessage(client: Client, message: Message, command: string, args: string[], data: any) {
        try {
            this.emit('debug', 'debug', `Preparing message command '${command}'...`);
            let cmd = this._commands[command];

            if (!cmd) {
                this.emit('debug', 'warn', `Message command not found: '${command}'`);
                return;
            }

            this.emit('debug', 'debug', `Creating event for message command '${command}'...`);
            let event = new HellionCommandEvent(this, cmd.name, new HellionCommandArgs(args, cmd.usage), new HellionReplyHandler(message), {
                client: client,
                channel: message.channel,
                user: message.author,
                guild: message.guild,
                member: message.member,
                createdAt: message.createdAt,
                createdTimestamp: message.createdTimestamp
            });

            this.emit('debug', 'info', `Running message command '${command}'...`);
            await cmd.run(event, data);
        }
        catch (e) {
            this.emit('cmdError', command, e);
        }
    }

    public async runInteraction(client: Client, command: CommandInteraction, data: discord.HellionWardenData) {
        try {
            this.emit('debug', 'debug', `Preparing interaction command '${command.commandName}'...`);
            let cmd = this._commands[command.commandName];

            if (!cmd) {
                this.emit('debug', 'warn', `Interaction command not found: '${command.commandName}'`);
                return;
            }

            this.emit('debug', 'debug', `Creating event for interaction command '${command.commandName}'...`);
            let event = new HellionCommandEvent(this, cmd.name, new HellionCommandArgs(command.options as CommandInteractionOptionResolver, cmd.usage), new HellionReplyHandler(command),
                {
                    client: client,
                    channel: command.channel,
                    user: command.user,
                    guild: command.guild,
                    member: command.member,
                    createdAt: command.createdAt,
                    createdTimestamp: command.createdTimestamp
                });

            this.emit('debug', 'info', `Running interaction command '${command.commandName}'...`);
            await cmd.run(event, data);
        }
        catch (e) {
            this.emit('cmdError', command, e);
        }
    }

    public searchCommands(searchTerm: string | null | undefined): HellionCommandListener[] {
        let commands: HellionCommandListener[] = [];
        for (let cmd in this._commands) {
            if (cmd === this._commands[cmd].name) commands.push(this._commands[cmd]);
        }
        if (!searchTerm) return commands;
        searchTerm = searchTerm.toLowerCase();
        let command = this._commands[searchTerm];
        if (!command) {
            return commands.filter((v) => v.category.toLowerCase() == searchTerm);
        } else {
            return [command];
        }
    }
}

export interface HellionCommandEventOptions {
    client: Client;
    user: User;
    channel: TextBasedChannel | null;
    guild?: Guild | null;
    member?: GuildMember | APIInteractionGuildMember | null;
    createdTimestamp: number;
    createdAt: Date;
}

export class HellionCommandEvent {
    public handler: HellionCommandHandler;
    public replyHandler: HellionReplyHandler;

    public command: string;
    public client: Client;
    public args: HellionCommandArgs;
    public user: User;
    public channel: TextBasedChannel | null;
    public guild?: Guild | null;
    public member?: GuildMember | APIInteractionGuildMember | null;

    public createdTimestamp: number;
    public createdAt: Date;

    constructor(handler: HellionCommandHandler, command: string, args: HellionCommandArgs, reply: HellionReplyHandler, options: HellionCommandEventOptions) {
        this.handler = handler;
        this.args = args;
        this.command = command;
        this.client = options.client;
        this.user = options.user;
        this.channel = options.channel;
        this.guild = options.guild;
        this.member = options.member;
        this.createdTimestamp = options.createdTimestamp;
        this.createdAt = this.createdAt;
        this.replyHandler = reply;
    }

    public reply(options: ReplyMessageOptions & (string | MessagePayload | InteractionReplyOptions)): Promise<Message | null> {
        return this.replyHandler.reply(options);
    }

    public info(message: string): void {
        this.handler.emit('cmdDebug', this.command, 'info', message);
    }

    public warn(message: string): void {
        this.handler.emit('cmdDebug', this.command, 'warn', message);
    }

    public debug(message: string): void {
        this.handler.emit('cmdDebug', this.command, 'debug', message);
    }

    public error(err: Error): void {
        this.handler.emit('cmdError', this.command, err);
    }
}

export class HellionReplyHandler {
    private _handler: Message | CommandInteraction;
    private _deferred: boolean;
    private _message: Message;

    constructor(handler: Message | CommandInteraction) {
        this._handler = handler;
        this._deferred = false;
    }

    public async defer(options?: InteractionDeferReplyOptions): Promise<void> {
        if (this._handler instanceof CommandInteraction) {
            await this._handler.deferReply(options);
            this._deferred = true;
        }
        else {
            await this._handler.channel.sendTyping();
        }
    }

    public async reply(message: ReplyMessageOptions & (string | MessagePayload | InteractionReplyOptions)): Promise<Message | null> {
        if (!this._deferred) {
            let msg = await this._handler.reply(message);
            if (msg instanceof Message) {
                this._message = msg;
                return msg;
            }
        }
        else {
            await (this._handler as CommandInteraction).editReply(message);
        }
        return null;
    }

    public async edit(message: string | MessagePayload): Promise<Message | null> {
        if (this._message) {
            return await this._message.edit(message);
        }
        else if (this._handler instanceof CommandInteraction) {
            let msg = await this._handler.editReply(message);
            if (msg instanceof Message)
                return msg;
            else
                return null;
        }
        else {
            return null;
        }
    }
}

export interface HellionCommandListeners {
    [command: string]: HellionCommandListener;
}

export class HellionCommandListener {
    public name: string;
    public alias: string[];
    public description: string;
    public category: string;
    public usage: HellionCommandUsage[];

    constructor() {
        this.name = "";
        this.alias = [];
        this.description = "";
        this.category = "";
        this.usage = [];
    }

    public async run(event: HellionCommandEvent, data: any): Promise<void> {
        throw new Error("Method not implemented");
    }
}

export interface HellionCommandUsage {
    name: string;
    index: number;
    description: string;
    required: boolean;
    type: HellionCommandType;
    choices?: HellionCommandChoice[];
}

export interface HellionCommandChoice {
    name: string;
    value: string | number;
}

export type HellionCommandType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'INTEGER' | 'USER' | 'CHANNEL' | 'ROLE' | 'MENTIONABLE';