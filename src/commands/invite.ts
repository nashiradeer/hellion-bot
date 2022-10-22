import { GuildMember, MessageEmbed } from "discord.js";
import { commandHandler, discord } from "..";

export class HellionCommand extends commandHandler.HellionCommandListener {
    constructor() {
        super();
        this.name = "invite";
        this.category = "Information";
        this.description = "Get an invite link from the bot to your server.";
    }

    public async run(event: commandHandler.HellionCommandEvent, data: discord.HellionWardenData): Promise<void> {
        if (!data.botpublic && event.user.id != data.botowner) {
            await event.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(0xff0000)
                        .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                        .setTitle("Hellion // Invite")
                        .setDescription("Getting invite links for this bot is disabled.")
                ]
            });
            return;
        }

        await event.reply({
            embeds: [
                new MessageEmbed()
                    .setColor(data.embedColor)
                    .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                    .setTitle("Hellion // Invite")
                    .setDescription(event.client.generateInvite({
                        scopes: ["bot", "applications.commands"],
                        permissions: [
                            "ATTACH_FILES",
                            "CONNECT",
                            "EMBED_LINKS",
                            "MANAGE_MESSAGES",
                            "SEND_MESSAGES",
                            "SPEAK",
                            "USE_EXTERNAL_EMOJIS",
                            "VIEW_CHANNEL"
                        ]
                    }))
            ]
        });
    }
}