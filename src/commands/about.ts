import { MessageEmbed, version } from "discord.js";
import { commandHandler, HellionWardenInformation, discord } from "..";

export class HellionCommand extends commandHandler.HellionCommandListener {
    constructor() {
        super();
        this.name = "about";
        this.category = "Information";
        this.description = "See information about Hellion.";
    }

    public async run(event: commandHandler.HellionCommandEvent, data: any): Promise<void> {
        let hdata = data as discord.HellionWardenData;

        await event.reply({
            embeds: [
                new MessageEmbed()
                    .setColor(hdata.embedColor)
                    .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                    .setThumbnail(hdata.iconUrl)
                    .setTitle("Hellion // About")
                    .setDescription(
                        `Prefix: ${hdata.prefix}\n` +
                        `Version: v${HellionWardenInformation.VERSION}\n` +
                        `Support: hellion@deersoftware.dev`)
                    .addFields([
                        {
                            name: "Node.js",
                            value: `Version: ${process.version}\n` +
                                `Uptime: ${this.getTime(process.uptime())}\n` +
                                `Memory: ${(process.memoryUsage.rss() / 1024 / 1024).toFixed(2)} MB`,
                            inline: true
                        },
                        {
                            name: "Discord.js",
                            value: `Version: v${version}\n` +
                                `API Latency: ${event.client.ws.ping}ms\n` +
                                `Latency: ${Date.now() - event.createdTimestamp}ms`,
                            inline: true
                        }
                    ])
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