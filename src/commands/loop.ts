import { GuildMember, MessageEmbed } from "discord.js";
import { commandHandler, discord } from "..";

export class HellionCommand extends commandHandler.HellionCommandListener {
    constructor() {
        super();
        this.name = "loop";
        this.category = "Music";
        this.description = "View or configure the type of loop Music Player should use.";
        this.alias = ["l"];
        this.usage = [
            {
                name: "type",
                index: 0,
                description: "The type of loop that Music Player should use.",
                required: false,
                type: 'STRING',
                choices: [
                    {
                        name: 'None',
                        value: "none"
                    },
                    {
                        name: 'Music',
                        value: "music"
                    },
                    {
                        name: 'Queue',
                        value: "queue"
                    }
                ]
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
                        .setTitle("Hellion // Loop")
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
                        .setTitle("Hellion // Loop")
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
                            .setTitle("Hellion // Loop")
                            .setDescription("You're not on the same voice chat as me.")
                    ]
                });
                return;
            }

            switch (event.args.getByIndex(0)?.trim().toLowerCase()) {
                case 'q':
                case 'queue':
                    music.setLoop('queue');
                    await event.reply({
                        embeds: [
                            new MessageEmbed()
                                .setColor(data.embedColor)
                                .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-roundsquare.png" })
                                .setTitle("Hellion // Loop")
                                .setDescription("The entire queue is now in a loop.")
                        ]
                    });
                    break;
                case 'm':
                case 'music':
                    music.setLoop('music');
                    await event.reply({
                        embeds: [
                            new MessageEmbed()
                                .setColor(data.embedColor)
                                .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-roundsquare.png" })
                                .setTitle("Hellion // Loop")
                                .setDescription("The current song is now looping.")
                        ]
                    });
                    break;
                case 'n':
                case 'none':
                    music.setLoop('none');
                    await event.reply({
                        embeds: [
                            new MessageEmbed()
                                .setColor(data.embedColor)
                                .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-roundsquare.png" })
                                .setTitle("Hellion // Loop")
                                .setDescription("The loop has been disabled.")
                        ]
                    });
                    break;
                default:
                    await event.reply({
                        embeds: [
                            new MessageEmbed()
                                .setColor(data.embedColor)
                                .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-roundsquare.png" })
                                .setTitle("Hellion // Loop")
                                .setDescription(`**Current loop type:** ${music.getLoop()}\n**Loop type options:** '\`music\`', '\`queue\`', '\`none\`'.`)
                        ]
                    });
                    break;
            }
        }

    }
}