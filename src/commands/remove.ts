import { GuildMember, MessageEmbed } from "discord.js";
import { commandHandler, discord } from "..";

export class HellionCommand extends commandHandler.HellionCommandListener {
    constructor() {
        super();
        this.name = "remove";
        this.category = "Music";
        this.description = "Remove a song from the queue.";
        this.alias = ["rm"];
        this.usage = [
            {
                index: 0,
                name: "queue",
                description: "The number of the song to remove.",
                required: true,
                type: "INTEGER"
            }
        ];
    }

    public async run(event: commandHandler.HellionCommandEvent, data: any): Promise<void> {
        let member = event.member as GuildMember;
        if (!member.voice.channel) {
            await event.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(0xff0000)
                        .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-roundsquare.png" })
                        .setTitle("Hellion // Remove")
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
                        .setTitle("Hellion // Remove")
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
                            .setTitle("Hellion // Remove")
                            .setDescription("You're not on the same voice chat as me.")
                    ]
                });
                return;
            }

            await event.replyHandler.defer();
            let numstr = event.args.getByIndex(0);
            if (!numstr) {
                await event.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-roundsquare.png" })
                            .setTitle("Hellion // Remove")
                            .setDescription("You must use a valid number.")
                    ]
                });
                return;
            }
            let queuenum = parseInt(numstr as string) - 1;

            if (isNaN(queuenum) || !isFinite(queuenum)) {
                await event.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-roundsquare.png" })
                            .setTitle("Hellion // Remove")
                            .setDescription("You must use a valid number.")
                    ]
                });
                return;
            }

            let m = music.remove(queuenum);

            if (!m) {
                await event.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-roundsquare.png" })
                            .setTitle("Hellion // Remove")
                            .setDescription("There's no item with this number in the queue.")
                    ]
                });
                return;
            }

            await event.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(data.embedColor)
                        .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-roundsquare.png" })
                        .setTitle("Hellion // Remove")
                        .setDescription(`Removed: ${m.title} **[${m.user}]**`)
                ]
            });
        }
    }
}