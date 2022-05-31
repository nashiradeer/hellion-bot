import { GuildMember, MessageEmbed } from "discord.js";
import { commandHandler, discord } from "..";

export class HellionCommand extends commandHandler.HellionCommandListener {
    constructor() {
        super();
        this.name = "playingnow";
        this.category = "Music";
        this.description = "Show the music playing and the time.";
        this.alias = ["np", "now"];
    }

    public async run(event: commandHandler.HellionCommandEvent, data: any): Promise<void> {
        let member = event.member as GuildMember;
        if (!member.voice.channel) {
            event.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(0xff0000)
                        .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                        .setTitle("Hellion Warden // Playing Now")
                        .setDescription("You aren't in a voice channel.")
                ]
            });
            return;
        }

        let music = (data as discord.HellionWardenData).music.get(event.guild?.id || '');

        if (!music) {
            event.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(0xff0000)
                        .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                        .setTitle("Hellion Warden // Playing Now")
                        .setDescription("I aren't playing anything.")
                ]
            });
        }
        else {
            if (music.voiceChannel.id != member.voice.channelId) {
                event.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                            .setTitle("Hellion Warden // Playing Now")
                            .setDescription("You aren't in the same voice channel of me.")
                    ]
                });
                return;
            }

            let m = music.nowPlaying();
            let nib = Math.round(m.current / (m.duration / 30));
            let progressbar = `╣${"▓".repeat(nib)}${"░".repeat(30 - nib)}╠`;
            event.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(0x260041)
                        .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                        .setTitle("Hellion Warden // Playing Now")
                        .setDescription(`**[${m.pos + 1}]** ${m.title} **(${m.requestedBy.user.tag})**\n\`\`${this.time2string(m.current)} / ${this.time2string(m.duration)}\`\`\n${progressbar}`)
                ]
            });
        }
    }

    private time2string(ms: number): string {
        return `${(Math.floor(ms / (1000 * 60 * 60))).toString().padStart(2, '0')}:${(Math.floor(ms / (1000 * 60)) % 60).toString().padStart(2, '0')}:${(Math.floor(ms / 1000) % 60).toString().padStart(2, '0')}`;
    }
}