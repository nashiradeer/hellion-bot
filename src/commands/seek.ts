import { GuildMember, EmbedBuilder } from "discord.js";
import { commandHandler, discord } from "..";

export class HellionCommand extends commandHandler.HellionCommandListener {
    constructor() {
        super();
        this.name = "seek";
        this.category = "Music";
        this.description = "Seek the current music.";
        this.usage = [
            {
                index: 0,
                name: "secs",
                description: "Time in seconds to seek.",
                required: true,
                type: "INTEGER"
            }
        ];
    }

    public async run(event: commandHandler.HellionCommandEvent, data: any): Promise<void> {
        let member = event.member as GuildMember;
        if (!member.voice.channel) {
            event.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                        .setTitle("Hellion Warden // Seek")
                        .setDescription("You aren't in a voice channel.")
                ]
            });
            return;
        }

        let music = (data as discord.HellionWardenData).music.get(event.guild?.id || '');

        if (!music) {
            event.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                        .setTitle("Hellion Warden // Seek")
                        .setDescription("I aren't playing anything.")
                ]
            });
        }
        else {
            if (music.voiceChannel.id != member.voice.channelId) {
                event.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                            .setTitle("Hellion Warden // Seek")
                            .setDescription("You aren't in the same voice channel of me.")
                    ]
                });
                return;
            }

            await event.replyHandler.defer();
            let numstr = event.args.getByIndex(0);
            if (!numstr) {
                event.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                            .setTitle("Hellion Warden // Seek")
                            .setDescription("You aren't using a valid number.")
                    ]
                });
                return;
            }
            let seektime = parseInt(numstr as string);

            if (isNaN(seektime) || !isFinite(seektime)) {
                event.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                            .setTitle("Hellion Warden // Seek")
                            .setDescription("You aren't using a valid number.")
                    ]
                });
                return;
            }

            if (seektime < 0 && seektime >= Math.floor(music.nowPlaying().duration / 1000)) {
                event.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                            .setTitle("Hellion Warden // Seek")
                            .setDescription("Seek time is out of bounds.")
                    ]
                });
                return;
            }

            await music.seek(seektime);

            event.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x260041)
                        .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                        .setTitle("Hellion Warden // Seek")
                        .setDescription("Seeking the current music.")
                ]
            });
        }
    }
}