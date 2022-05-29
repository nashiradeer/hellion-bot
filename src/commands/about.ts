import { MessageEmbed, version } from "discord.js";
import { commandHandler, HellionWardenInformation, discord } from "..";

export class HellionCommand extends commandHandler.HellionCommandListener {
    constructor() {
        super();
        this.name = "about";
        this.category = "Information";
        this.description = "Get a short about of the bot.";
    }

    public async run(event: commandHandler.HellionCommandEvent, data: any): Promise<void> {
        event.reply({
            embeds: [
                new MessageEmbed()
                    .setColor(0x260041)
                    .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                    .setThumbnail(event.client.user?.avatarURL() || '')
                    .setTitle("Hellion Warden // About")
                    .setDescription(
                        `Prefix: ${(data as discord.HellionWardenData).prefix}\n` +
                        `Version: v${HellionWardenInformation.VERSION}`)
                    .addField("NodeJS Information",
                        `Version: ${process.version}\n` +
                        `Uptime: ${this.getTime(process.uptime())}\n` +
                        `Operation System: ${process.platform}\n` +
                        `Architecture: ${process.arch}`
                        , true)
                    .addField("Discord.JS Information",
                        `Version: v${version}\n` +
                        `Uptime: ${this.getTime((event.client.uptime || 0) / 1000)}\n` +
                        `API Latency: ${event.client.ws.ping}ms\n` +
                        `Latency: ${Date.now() - event.createdTimestamp}ms`
                        , true)
            ]
        });
    }

    private getTime(secs: number): string {
        if (secs >= 86400) {
            let t = Math.floor(secs / 60 / 60 / 24);
            if (t > 1) return `${Math.floor(t)} days`;
            else return `${Math.floor(t)} day`;
        }
        if (secs >= 3600) {
            let t = Math.floor(secs / 60 / 60);
            if (t > 1) return `${Math.floor(t)} hours`;
            else return `${Math.floor(t)} hour`;
        }
        if (secs >= 60) {
            let t = Math.floor(secs / 60);
            if (t > 1) return `${Math.floor(t)} mins`;
            else return `${Math.floor(t)} min`;
        }
        if (secs > 1) return `${Math.floor(secs)} secs`;
        else return `${Math.floor(secs)} sec`;
    }
}