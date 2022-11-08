import { GuildMember, MessageEmbed } from "discord.js";
import { commandHandler, discord } from "..";

export class HellionCommand extends commandHandler.HellionCommandListener {
    constructor() {
        super();
        this.name = "playnow";
        this.category = "Music";
        this.description = "Play the music now, skipping all the others.";
        this.alias = ["pn"];
        this.usage = [
            {
                name: "music",
                index: -1,
                description: "A song or playlist you want played.",
                required: true,
                type: 'STRING'
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
                        .setTitle("Hellion // Play Now")
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
                        .setTitle("Hellion // Play Now")
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
                            .setTitle("Hellion // Play Now")
                            .setDescription("You're not on the same voice chat as me.")
                    ]
                });
                return;
            }

            await event.replyHandler.defer();
            let link = event.args.getByIndex(0);

            if (!link) {
                await event.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-roundsquare.png" })
                            .setTitle("Hellion // Play Now")
                            .setDescription("You need to provide a song or playlist to play.")
                    ]
                });
                return;
            }
            try {
                let res = await music.playNow(link, event.member as GuildMember);
                if (res.count > 1) {
                    await event.reply({
                        embeds: [
                            new MessageEmbed()
                                .setColor(data.embedColor)
                                .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-roundsquare.png" })
                                .setTitle("Hellion // Enqueued")
                                .setDescription(`Enqueued a total of ${res.count} songs to the queue.`)
                        ]
                    });

                    await music.textChannel.send({
                        embeds: [
                            new MessageEmbed()
                                .setColor(data.embedColor)
                                .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-roundsquare.png" })
                                .setTitle("Hellion // Play Now")
                                .setDescription(`${res.title} **[${res.requestedBy.user.tag}]**`)
                        ]
                    }).then((m) => {
                        setTimeout(() => m.delete(), 30000);
                    });
                }
                else {
                    await event.reply({
                        embeds: [
                            new MessageEmbed()
                                .setColor(data.embedColor)
                                .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-roundsquare.png" })
                                .setTitle("Hellion // Play Now")
                                .setDescription(`${res.title} **[${res.requestedBy.user.tag}]**`)
                        ]
                    });
                }
            }
            catch (err) {
                event.error(err);
                await event.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-roundsquare.png" })
                            .setTitle("Hellion // Play Now")
                            .setDescription("Could not find this song or playlist. Please check if this song is available or has no age restriction.")
                    ]
                });
            }
        }
    }
}