import { Client, ClientOptions, CommandInteraction, Interaction, Message } from 'discord.js';
import { EventEmitter } from 'events';
import { commandHandler, player } from '.';
import { resolve } from 'path';

export interface HellionWardenData
{
    music: Map<string, player.HellionMusicPlayer>;
    prefix: string;
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

    public prefix: string;
    public handler: commandHandler.HellionCommandHandler;

    constructor(token: string, prefix: string = "h!", options?: ClientOptions)
    {
        super();

        // Initialize
        this._token = token;
        this.prefix = prefix;
        this._data = {
            music: new Map<string, player.HellionMusicPlayer>(),
            prefix: prefix
        };

        // Initialize Discord Client
        this._client = new Client(options || { intents: [ 'GUILDS', 'GUILD_MESSAGES', 'GUILD_VOICE_STATES' ]});

        // Register Discord Client events
        this._client.on('messageCreate', (message) => this.message(message));
        this._client.on('interactionCreate', (interaction) => this.interaction(interaction));
        this._client.once('ready', () => {
            this.emit('logged');
            this._client.user.setActivity("with Nashira Deer", { type: 'LISTENING' });
        });

        // Initialize Command Handler
        this.handler = new commandHandler.HellionCommandHandler();
    }

    private async message(message: Message): Promise<void>
    {
        if (message.author.bot) return;
        if (!message.content.startsWith(this.prefix)) return;
        if (!message.guild) return;
        
        this.emit('debug', 'debug', 'Running command from a message.');
        this.handler.run(this._client, message, this.prefix, this._data);
    }


    private async interaction(interaction: Interaction): Promise<void>
    {
        if (interaction.isCommand())
        {
            this.emit('debug', 'debug', 'Running command from a interaction.');
            this.handler.runInteraction(this._client, interaction as CommandInteraction, this._data);
        }
    }

    public async start(): Promise<void>
    {
        this.emit('debug', 'info', "Initializing Command Handler...");
        await this.handler.init(resolve(__dirname, 'commands'));

        this.emit('debug', 'info', "Logging to Discord...");
        await this._client.login(this._token);

        this.emit('debug', 'info', "Registering Slash Commands...");
        await this.handler.initSlashCommand(this._client.user.id, this._token);
    }
}