import { GuildMember, EmbedBuilder } from "discord.js";
import { commandHandler, discord } from "..";

export class HellionCommand extends commandHandler.HellionCommandListener {
    constructor() {
        super();
        this.name = "shuffle";
        this.category = "Music";
        this.description = "Randomize the queue order and skip to next the random music.";
        this.alias = ["random", "sh"];
    }

    public async run(event: commandHandler.HellionCommandEvent, data: any): Promise<void> {
        let member = event.member as GuildMember;
        if (!member.voice.channel) {
            event.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                        .setTitle("Hellion Warden // Shuffle")
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
                        .setTitle("Hellion Warden // Shuffle")
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
                            .setTitle("Hellion Warden // Shuffle")
                            .setDescription("You aren't in the same voice channel of me.")
                    ]
                });
                return;
            }

            music.shuffle();
            event.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x260041)
                        .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                        .setTitle("Hellion Warden // Shuffle")
                        .setDescription("The music order from the queue has been shuffled.")
                ]
            });
        }

    }
}