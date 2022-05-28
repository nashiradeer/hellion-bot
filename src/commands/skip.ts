import { GuildMember, MessageEmbed } from "discord.js";
import { commandHandler, discord } from "..";

export class HellionCommand extends commandHandler.HellionCommandListener {
    constructor() {
        super();
        this.name = "skip";
        this.category = "Music";
        this.description = "Skip the current music playing.";
        this.alias = ["s"];
    }

    public async run(event: commandHandler.HellionCommandEvent, data: any): Promise<void> {
        let member = event.member as GuildMember;
        if (!member.voice.channel) {
            event.reply({
                fetchEdit: true,
                embeds: [
                    new MessageEmbed()
                        .setColor(0xff0000)
                        .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user.avatarURL() })
                        .setTitle("Hellion Warden // Skip")
                        .setDescription("You aren't in a voice channel.")
                ]
            });
            return;
        }

        let music = (data as discord.HellionWardenData).music.get(event.guild.id);

        if (!music) {
            event.reply({
                fetchEdit: true,
                embeds: [
                    new MessageEmbed()
                        .setColor(0xff0000)
                        .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user.avatarURL() })
                        .setTitle("Hellion Warden // Skip")
                        .setDescription("I aren't playing anything.")
                ]
            });
        }
        else {
            if (music.voiceChannel.id != member.voice.channelId) {
                event.reply({
                    fetchEdit: true,
                    embeds: [
                        new MessageEmbed()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user.avatarURL() })
                            .setTitle("Hellion Warden // Skip")
                            .setDescription("You aren't in the same voice channel of me.")
                    ]
                });
                return;
            }

            await event.replyHandler.defer();
            let m = await music.skip();
            event.reply({
                fetchEdit: true,
                embeds: [
                    new MessageEmbed()
                        .setColor(0x260041)
                        .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user.avatarURL() })
                        .setTitle("Hellion Warden // Skip")
                        .setDescription(`Skipped to: ${m.title} **[${m.requestedBy.user.tag}]**`)
                ]
            });
        }
    }
}