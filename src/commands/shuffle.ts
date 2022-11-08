import { GuildMember, MessageEmbed } from "discord.js";
import { commandHandler, discord } from "..";

export class HellionCommand extends commandHandler.HellionCommandListener {
    constructor() {
        super();
        this.name = "shuffle";
        this.category = "Music";
        this.description = "Shuffles the songs in the queue.";
        this.alias = ["random", "sh"];
    }

    public async run(event: commandHandler.HellionCommandEvent, data: any): Promise<void> {
        let member = event.member as GuildMember;
        if (!member.voice.channel) {
            await event.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(0xff0000)
                        .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-roundsquare.png" })
                        .setTitle("Hellion // Shuffle")
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
                        .setTitle("Hellion // Shuffle")
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
                            .setTitle("Hellion // Shuffle")
                            .setDescription("You're not on the same voice chat as me.")
                    ]
                });
                return;
            }

            music.shuffle();
            await event.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(data.embedColor)
                        .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-roundsquare.png" })
                        .setTitle("Hellion // Shuffle")
                        .setDescription("The songs in the queue have been shuffled.")
                ]
            });
        }

    }
}