import { ActivityType, Client, ClientOptions, IntentsBitField } from 'discord.js';
import { EventEmitter } from 'events';
import { HellionVersion } from '.';

export interface HellionOptions {
    successColor?: string | null;
    failColor?: string | null;
    infoColor?: string | null;
    iconUrl?: string | null;
}

export interface HellionContext {
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
            logoUrl: "https://www.deersoftware.dev/assets/images/deersoftware-roundsquare.png"
        };

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
    }

    public async start(token: string): Promise<void> {
        this.emit('debug', "Logging into Discord...");
        await this._client.login(token);
    }

    private async guildSize(): Promise<number> {
        return (await this._client.shard?.fetchClientValues('guilds.cache.size'))?.reduce((acc: number, cur: number) => acc + cur, 0) as number || this._client.guilds.cache.size;
    }
}