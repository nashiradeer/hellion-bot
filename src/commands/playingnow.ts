import { GuildMember, MessageEmbed } from "discord.js";
import { commandHandler, discord } from "..";

export class HellionCommand extends commandHandler.HellionCommandListener {
    constructor() {
        super();
        this.name = "playingnow";
        this.category = "Music";
        this.description = "See the song being played right now.";
        this.alias = ["np", "now"];
    }

    public async run(event: commandHandler.HellionCommandEvent, data: any): Promise<void> {
        let member = event.member as GuildMember;
        if (!member.voice.channel) {
            await event.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(0xff0000)
                        .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-roundsquare.png" })
                        .setTitle("Hellion // Playing Now")
                        .setDescription("You aren't on a voice chat.")
                ]
            });
            return;
        }

        let music = (data as discord.HellionWardenData).music.get(event.guild?.id || '');

        if (!music) {
            await event.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(0xff0000)
                        .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-roundsquare.png" })
                        .setTitle("Hellion // Playing Now")
                        .setDescription("I'm not playing anything at the moment.")
                ]
            });
        }
        else {
            if (music.voiceChannel.id != member.voice.channelId) {
                await event.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-roundsquare.png" })
                            .setTitle("Hellion // Playing Now")
                            .setDescription("You're not on the same voice chat as me.")
                    ]
                });
                return;
            }

            let m = music.nowPlaying();
            let nib = Math.round(m.current / (m.duration / 30));
            let progressbar = `╣${"▓".repeat(nib)}${"░".repeat(30 - nib)}╠`;
            await event.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(data.embedColor)
                        .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-roundsquare.png" })
                        .setTitle("Hellion // Playing Now")
                        .setDescription(`**[${m.pos + 1}]** ${m.title} **(${m.user})**\n\`\`${this.time2string(m.current)} / ${this.time2string(m.duration)}\`\`\n${progressbar}`)
                ]
            });
        }
    }

    private time2string(ms: number): string {
        return `${(Math.floor(ms / (1000 * 60 * 60))).toString().padStart(2, '0')}:${(Math.floor(ms / (1000 * 60)) % 60).toString().padStart(2, '0')}:${(Math.floor(ms / 1000) % 60).toString().padStart(2, '0')}`;
    }
}