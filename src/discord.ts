import { ActivityType, Client, ClientOptions, IntentsBitField, Interaction } from 'discord.js';
import { EventEmitter } from 'events';
import { HellionVersion } from '.';
import { HellionDebugCommand } from './debug/command';
import { HellionDebugButton, HellionDebugChannel, HellionDebugComponent, HellionDebugMentionable, HellionDebugRole, HellionDebugString, HellionDebugUser } from './debug/components';
import { HellionDebugMessageContext } from './debug/messagecontext';
import { HellionDebugModal, HellionDebugModalSubmit } from './debug/modal';
import { HellionDebugUserContext } from './debug/usercontext';
import { HellionHandler } from './handler';
import { HellionI18n } from './handler/i18n';

export interface HellionOptions {
    successColor?: string | null;
    failColor?: string | null;
    infoColor?: string | null;
    iconUrl?: string | null;
    debug?: boolean | null;
    localeDir?: string | null;
}

export interface HellionContext {
    localeDir: string;
    successColor: number;
    failColor: number;
    infoColor: number;
    iconUrl: string;
    logoUrl: string;
    logoName: string;
}

export declare interface Hellion {
    on(event: 'ready', listener: (username: string) => void): this;
    on(event: 'debug', listener: (message: string, ...meta) => void): this;
    on(event: 'info', listener: (message: string, ...meta) => void): this;
    on(event: 'error', listener: (message: string, ...meta) => void): this;

    once(event: 'ready', listener: (username: string) => void): this;
    once(event: 'debug', listener: (message: string, ...meta) => void): this;
    once(event: 'info', listener: (message: string, ...meta) => void): this;
    once(event: 'error', listener: (message: string, ...meta) => void): this;
}

export class Hellion extends EventEmitter {
    public static readonly REQUIRED_INTENTS: IntentsBitField = new IntentsBitField([]);

    public handler: HellionHandler;

    private _context: HellionContext;
    private _client: Client;

    constructor(options?: ClientOptions & HellionOptions) {
        super();

        // Initialize context
        this._context = {
            successColor: parseInt(options?.successColor || "4bb580", 16),
            infoColor: parseInt(options?.infoColor || "4e74f7", 16),
            failColor: parseInt(options?.failColor || "ee4040", 16),
            iconUrl: options?.iconUrl ?? "https://www.deersoftware.dev/assets/images/hellion.png",
            logoName: "DeerSoftware 2022-2023. All Rights Reserved.",
            logoUrl: "https://www.deersoftware.dev/assets/images/deersoftware-roundsquare.png",
            localeDir: options?.localeDir ?? "/usr/share/hellion/locale"
        };

        // Initialize Hellion Handler
        const i18n = new HellionI18n();
        this.handler = new HellionHandler(this._context, i18n);

        // Initialize debug commands
        if (options?.debug) {
            this.handler.register(new HellionDebugCommand());
            this.handler.register(new HellionDebugUserContext());
            this.handler.register(new HellionDebugMessageContext());
            this.handler.register(new HellionDebugComponent());
            this.handler.register(new HellionDebugButton());
            this.handler.register(new HellionDebugString());
            this.handler.register(new HellionDebugRole());
            this.handler.register(new HellionDebugUser());
            this.handler.register(new HellionDebugMentionable());
            this.handler.register(new HellionDebugChannel());
            this.handler.register(new HellionDebugModal());
            this.handler.register(new HellionDebugModalSubmit());
        }

        // Initialize Discord.js Client
        this._client = new Client(options || { intents: Hellion.REQUIRED_INTENTS });

        // Register Discord.js events
        this._client.once('ready', async () => {
            this.emit('ready', `${this._client.user?.username}#${this._client.user?.discriminator}`);
            setInterval(async () => {
                const messages = [
                    "with DeerSoftware",
                    `in ${await this.guildSize()} guilds`,
                    `using Hellion v${HellionVersion}`
                ];
                this._client.user?.setActivity(messages[Math.floor(Math.random() * messages.length)], { type: ActivityType.Listening });
            }, 60000);
        });

        this._client.on('interactionCreate', (interaction: Interaction) => this.handler.eventHandler(interaction));
    }

    public async start(token: string): Promise<void> {
        this.emit('debug', "Loading translations...");
        await this.handler.i18n.loadDir(this._context.localeDir);

        this.emit('debug', "Logging into Discord...");
        await this._client.login(token);

        this.emit('debug', "Registering application commands...");
        await this.handler.registerCommands(this._client);
    }

    private async guildSize(): Promise<number> {
        return (await this._client.shard?.fetchClientValues('guilds.cache.size'))?.reduce((acc: number, cur: number) => acc + cur, 0) as number || this._client.guilds.cache.size;
    }
}