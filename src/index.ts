import { PackageMeta, HellionWardenConfig } from './app';
import { Client, Message } from 'discord.js';

import { readdirSync } from 'fs';
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
    private commands: object;
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

        console.log("[DISCORD]: Registering commands...");

        for (let p of readdirSync(resolve(__dirname, "commands"))) {
            let script = require(resolve(__dirname, "commands", p));

            for (let name of script.command.names)
            {
                this.commands[name] = script.run;
                console.log("[DISCORD] Registered command '" + name + "'...");
            }
        }       

        console.log("[DISCORD]: Registering events...");

        this.client.on('messageCreate', this.message);

        this.client.once('ready', () => {
            console.log("[DISCORD] Logged in '" + this.client.user.tag + "'");
        });
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