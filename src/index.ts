import { PackageMeta, HellionWardenConfig } from './app';
import { HellionCommandHandler } from './modules/command';
import { Client, Message } from 'discord.js';

import { resolve } from 'path';

export interface HellionWardenExtensions
{
    musicdata: Map<string, any>;
}

export class HellionWarden
{
    public readonly INFO: PackageMeta;

    private readonly CONFIG: HellionWardenConfig;

    private ext: HellionWardenExtensions;
    private commandHandler: HellionCommandHandler; 
    private client: Client;

    constructor(info: PackageMeta, config: HellionWardenConfig)
    {
        console.log("[DISCORD]: Initializing...");

        this.INFO = info;
        this.CONFIG = config;

        this.ext = {
            musicdata: new Map<string, any>()
        };
        
        console.log("[DISCORD]: Creating a Discord Client...");

        this.client = new Client({ intents: [ "GUILD_MESSAGES", "GUILDS" ]});

        console.log("[DISCORD]: Registering events to Discord...");

        this.client.on('messageCreate', this.message);

        this.client.once('ready', () => {
            console.log("[DISCORD] Logged in '" + this.client.user.tag + "'");
        });

        console.log("[DISCORD]: Creating the command handler...");

        this.commandHandler = new HellionCommandHandler();

        console.log("[DISCORD]: Registering events to command handler...");

        this.commandHandler.once('ready', () => {
            this.client.login(this.CONFIG.token);
        });

        this.commandHandler.on('error', (err) => {
            console.error(err);
        });

        this.commandHandler.init(resolve(__dirname, "commands"));
    }

    private async message(message: Message)
    {
        if (message.author.bot) return;
        if (!message.content.startsWith(this.CONFIG.prefix)) return;
        if (!message.guild) return;
    
        let args = message.content.trim().slice(this.CONFIG.prefix.length).split(' ');
        let command = args.shift().toLowerCase();
    
        if (!this.commands[command]) return;
    
        console.log("[MESSAGE] Executing command '" + command + "'...");
        this.commands[command](this.client, message, args, this.ext);
    }

    public login()
    {
        this.client.login(this.CONFIG.token);
    }
}