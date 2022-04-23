import { commandHandler } from '.';
import { Client, ClientOptions, CommandInteraction, Interaction, Message } from 'discord.js';
import { EventEmitter } from 'events';
import { resolve } from 'path';

export interface HellionWardenData
{
}

export declare interface HellionWarden
{
    on(event: 'ready', listener: () => void): this;
    once(event: 'ready', listener: () => void): this;

    on(event: 'logged', listener: () => void): this;
    once(event: 'logged', listener: () => void): this;

    on(event: 'error', listener: (err: Error) => void): this;
    once(event: 'error', listener: (err: Error) => void): this;

    on(event: 'debug', listener: (type: 'info'|'debug'|'warn', message: string) => void): this;
    once(event: 'debug', listener: (type: 'info'|'debug'|'warn', message: string) => void): this;
}

export class HellionWarden extends EventEmitter
{
    private _data: HellionWardenData;
    private _client: Client;
    private _token: string;

    public readonly prefix: string;
    public readonly commandHandler: commandHandler.HellionCommandHandler;

    constructor(token: string, prefix: string = "h!", options?: ClientOptions)
    {
        super();

        // Initialize
        this.emit('debug', 'info', "Initializing...");

        this._token = token;

        this._data = {
        };

        // Initialize Discord Client
        this.emit('debug', 'info', "Initializing Discord Client...");

        this._client = new Client(options || { intents: [ 'GUILDS', 'GUILD_MESSAGES' ]});

        // Register Discord Client events
        this.emit('debug', 'debug', "Registering Discord Client events...");

        this._client.on('messageCreate', this.message);

        this._client.on('interactionCreate', this.interaction);

        this._client.once('ready', () => {
            this.emit('logged');
        });

        // Initialize Command Handler
        this.emit('debug', 'info', "Initializing Command Handler...");
        this.commandHandler = new commandHandler.HellionCommandHandler(this._client, resolve(__dirname, 'commands'));

        this.commandHandler.once('ready', () => {
            this.emit('ready');
        });
    }

    private async message(message: Message): Promise<void>
    {
        if (message.author.bot) return;
        if (!message.content.startsWith(this.prefix)) return;
        if (!message.guild) return;
        
        this.emit('debug', 'debug', 'Running command from a message.');
        this.commandHandler.run(message, this.prefix, this._data);
    }

    private async interaction(interact: Interaction)
    {
        if (interact.isCommand())
        {
            this.emit('debug', 'debug', 'Running command from a interaction.');
            this.commandHandler.runInteraction(interact as CommandInteraction, this._data);
        }
    }

    public async login(): Promise<void> {
        await this._client.login(this._token);
    }
}