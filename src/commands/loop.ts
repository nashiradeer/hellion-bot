import { GuildMember, MessageEmbed } from "discord.js";
import { commandHandler, discord } from "..";

export class HellionCommand extends commandHandler.HellionCommandListener {
    constructor() {
        super();
        this.name = "loop";
        this.category = "Music";
        this.description = "Toggle music or queue loop in the Music Player.";
        this.alias = ["l"];
        this.usage = [
            {
                name: "type",
                index: 0,
                description: "Loop type to be used.",
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
            event.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(0xff0000)
                        .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                        .setTitle("Hellion // Loop")
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
                        .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                        .setTitle("Hellion // Loop")
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
                            .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                            .setTitle("Hellion // Loop")
                            .setDescription("You aren't in the same voice channel of me.")
                    ]
                });
                return;
            }

            switch (event.args.getByIndex(0)?.trim().toLowerCase()) {
                case 'q':
                case 'queue':
                    music.setLoop('queue');
                    event.reply({
                        embeds: [
                            new MessageEmbed()
                                .setColor(data.embedColor)
                                .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                                .setTitle("Hellion // Loop")
                                .setDescription("Looping all the queue.")
                        ]
                    });
                    break;
                case 'm':
                case 'music':
                    music.setLoop('music');
                    event.reply({
                        embeds: [
                            new MessageEmbed()
                                .setColor(data.embedColor)
                                .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                                .setTitle("Hellion // Loop")
                                .setDescription("Looping the current music.")
                        ]
                    });
                    break;
                case 'n':
                case 'none':
                    music.setLoop('none');
                    event.reply({
                        embeds: [
                            new MessageEmbed()
                                .setColor(data.embedColor)
                                .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                                .setTitle("Hellion // Loop")
                                .setDescription("Loop have been disabled.")
                        ]
                    });
                    break;
                default:
                    event.reply({
                        embeds: [
                            new MessageEmbed()
                                .setColor(data.embedColor)
                                .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                                .setTitle("Hellion // Loop")
                                .setDescription(`**Queue loop type:** ${music.getLoop()}\n**Loop type options:** '\`music\`', '\`queue\`', '\`none\`'.`)
                        ]
                    });
                    break;
            }
        }

    }
}