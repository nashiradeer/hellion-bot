import { Client, ClientOptions, CommandInteraction, Interaction, Message } from 'discord.js';
import { EventEmitter } from 'events';

export interface HellionWardenData
{
    musicdata: Map<string, any>;
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
    //public readonly commandHandler: commandHandler.HellionCommandHandler;

    constructor(token: string, prefix: string = "h!", options?: ClientOptions)
    {
        super();

        // Initialize
        this._token = token;
        this.prefix = prefix;
        this._data = {
            musicdata: new Map<string, any>()
        };

        // Initialize Discord Client
        this._client = new Client(options || { intents: [ 'GUILDS', 'GUILD_MESSAGES', 'GUILD_VOICE_STATES' ]});

        // Register Discord Client events
        this._client.on('messageCreate', (message) => this.message(message));
        this._client.on('interactionCreate', (interaction) => this.interaction(interaction));
        this._client.once('ready', () => {
            this.emit('logged');
        });

        // Initialize Command Handler
    }

    private async message(message: Message): Promise<void>
    {
        if (message.author.bot) return;
        if (!message.content.startsWith(this.prefix)) return;
        if (!message.guild) return;
        
        this.emit('debug', 'debug', 'Running command from a message.');
        //this.commandHandler.run(message, this.prefix, this._data);
    }


    private async interaction(interaction: Interaction)
    {
        if (interaction.isCommand())
        {
            this.emit('debug', 'debug', 'Running command from a interaction.');
            //this.commandHandler.runInteraction(interaction as CommandInteraction, this._data);
        }
    }

    public async login(): Promise<void> {
        await this._client.login(this._token);
    }
}