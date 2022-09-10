import { GuildMember, EmbedBuilder, OAuth2Scopes } from "discord.js";
import { commandHandler, discord } from "..";

export class HellionCommand extends commandHandler.HellionCommandListener {
    constructor() {
        super();
        this.name = "invite";
        this.category = "Information";
        this.description = "Get a invite URL to add the bot in your guild.";
    }

    public async run(event: commandHandler.HellionCommandEvent, data: discord.HellionWardenData): Promise<void> {
        if (!data.botpublic && event.user.id != data.botowner) {
            event.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                        .setTitle("Hellion Warden // Invite")
                        .setDescription("The invite generation is disabled in this bot, request a invite URL to the bot owner.")
                ]
            });
            return;
        }

        event.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x260041)
                    .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                    .setTitle("Hellion Warden // Invite")
                    .setDescription(event.client.generateInvite({
                        scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
                        permissions: [
                            "AttachFiles",
                            "Connect",
                            "EmbedLinks",
                            "ManageMessages",
                            "SendMessages",
                            "Speak",
                            "UseExternalEmojis",
                            "ViewChannel"
                        ]
                    }))
            ]
        });
    }
}