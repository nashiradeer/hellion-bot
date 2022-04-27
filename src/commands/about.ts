import { MessageEmbed, version } from "discord.js";
import { commandHandler, HellionWardenInformation, discord } from "..";

export class HellionCommand extends commandHandler.HellionCommandListener
{
    constructor()
    {
        super();
        this.name = "about";
        this.category = "Information";
        this.description = "Get a short about of the bot.";
    }

    public async run(event: commandHandler.HellionCommandEvent, data: any): Promise<void>
    {
        event.reply({
            embeds: [
                new MessageEmbed()
                    .setColor(0x260041)
                    .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user.avatarURL() })
                    .setThumbnail(event.client.user.avatarURL())
                    .setTitle("Hellion Warden // About")
                    .setDescription(
                        `Prefix: ${(data as discord.HellionWardenData).prefix}\n` +
                        `Version: ${HellionWardenInformation.VERSION}`)
                    .addField("NodeJS Information",
                        `Version: ${process.version}\n` + 
                        `Uptime: ${Math.floor(process.uptime() / 60)} mins\n` +
                        `Operation System: ${process.platform}\n` +
                        `Architecture: ${process.arch}`
                        , true)
                    .addField("Discord.JS Information",
                        `Version: ${version}\n` +
                        `Uptime: ${Math.floor(event.client.uptime / 1000 / 60)} mins\n` +
                        `API Latency: ${event.client.ws.ping}ms\n` + 
                        `Latency: ${Date.now() - event.createdTimestamp}ms`
                        , true)
            ]
        });
    }
}