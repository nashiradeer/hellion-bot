import { GuildMember, MessageEmbed } from "discord.js";
import { commandHandler, discord } from "..";

export class HellionCommand extends commandHandler.HellionCommandListener
{
    constructor()
    {
        super();
        this.name = "loop";
        this.category = "Music";
        this.description = "Toggle music or queue loop in the Music Player.";
        this.alias = [ "l" ];
        this.usage = [
            {
                name: "type",
                index: 0,
                description: "Loop type to be used.",
                required: false,
                type: 'NUMBER',
                choices: [
                    {
                        name: 'none',
                        value: "None"
                    },
                    {
                        name: 'music',
                        value: "Music"
                    },
                    {
                        name: 'queue',
                        value: "Queue"
                    }
                ]
            }
        ];
    }

    public async run(event: commandHandler.HellionCommandEvent, data: any): Promise<void>
    {
        let member = event.member as GuildMember;
        if (!member.voice.channel)
        {
            event.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(0xff0000)
                        .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user.avatarURL() })
                        .setTitle("Hellion Warden // Loop")
                        .setDescription("You aren't in a voice channel.")
                ]
            });
            return;
        }

        let music = (data as discord.HellionWardenData).music.get(event.guild.id);

        if (!music)
        {
            event.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(0xff0000)
                        .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user.avatarURL() })
                        .setTitle("Hellion Warden // Loop")
                        .setDescription("I aren't playing anything.")
                ]
            });
        }
        else
        {
            if (music.voiceChannel.id != member.voice.channelId)
            {
                event.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user.avatarURL() })
                            .setTitle("Hellion Warden // Loop")
                            .setDescription("You aren't in the same voice channel of me.")
                    ]
                });
                return;
            }

            switch (event.args.getByIndex(0))
            {
                case 'q':
                case 'queue':
                    music.loop = "queue";
                    event.reply({
                        embeds: [
                            new MessageEmbed()
                                .setColor(0x260041)
                                .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user.avatarURL() })
                                .setTitle("Hellion Warden // Loop")
                                .setDescription("Looping all the queue.")
                        ]
                    });
                    break;
                case 'm':
                case 'music':
                    event.reply({
                        embeds: [
                            new MessageEmbed()
                                .setColor(0x260041)
                                .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user.avatarURL() })
                                .setTitle("Hellion Warden // Loop")
                                .setDescription("Looping the current music.")
                        ]
                    });
                    break;
                case 'n':
                case 'none':
                    event.reply({
                        embeds: [
                            new MessageEmbed()
                                .setColor(0x260041)
                                .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user.avatarURL() })
                                .setTitle("Hellion Warden // Loop")
                                .setDescription("Loop have been disabled.")
                        ]
                    });
                    break;
                default:
                    event.reply({
                        embeds: [
                            new MessageEmbed()
                                .setColor(0x260041)
                                .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user.avatarURL() })
                                .setTitle("Hellion Warden // Loop")
                                .setDescription("Loop type options: '`music`', '`queue`', '`none`'.")
                        ]
                    });
                    break;
            }
        }

    }
}