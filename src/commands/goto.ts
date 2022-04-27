import { GuildMember, MessageEmbed } from "discord.js";
import { commandHandler, discord } from "..";

export class HellionCommand extends commandHandler.HellionCommandListener
{
    constructor()
    {
        super();
        this.name = "goto";
        this.category = "Music";
        this.description = "Play a music from the queue.";
        this.usage = [
            {
                index: 0,
                name: "queue",
                description: "Item number from the queue.",
                required: true,
                type: "INTEGER"
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
                        .setTitle("Hellion Warden // Goto")
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
                        .setTitle("Hellion Warden // Goto")
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
                            .setTitle("Hellion Warden // Goto")
                            .setDescription("You aren't in the same voice channel of me.")
                    ]
                });
                return;
            }

            await event.replyHandler.defer();
            let queuenum = parseInt(event.args.getByIndex(0)) - 1;

            if (isNaN(queuenum) || !isFinite(queuenum))
            {
                event.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user.avatarURL() })
                            .setTitle("Hellion Warden // Goto")
                            .setDescription("You aren't using a valid number.")
                    ]
                });
                return;
            }

            let m = await music.goto(queuenum);

            event.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(0x260041)
                        .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user.avatarURL() })
                        .setTitle("Hellion Warden // Goto")
                        .setDescription(`Going to: ${m.title} **[${m.requestedBy.user.tag}]**`)
                ]
            });
        }
    }
}