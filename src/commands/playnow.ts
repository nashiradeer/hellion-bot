import { GuildMember, MessageEmbed } from "discord.js";
import { commandHandler, discord } from "..";

export class HellionCommand extends commandHandler.HellionCommandListener
{
    constructor()
    {
        super();
        this.name = "playnow";
        this.category = "Music";
        this.description = "Play the music now.";
        this.alias = [ "pn" ];
        this.usage = [
            {
                name: "music",
                index: -1,
                description: "Music or playlist to be played.",
                required: true,
                type: 'STRING'
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
                        .setTitle("Hellion Warden // Play Now")
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
                        .setTitle("Hellion Warden // Play Now")
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
                            .setTitle("Hellion Warden // Play Now")
                            .setDescription("You aren't in the same voice channel of me.")
                    ]
                });
                return;
            }

            await event.replyHandler.defer();
            let link = event.args.getByIndex(0);

            if (!link)
            {
                event.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user.avatarURL() })
                            .setTitle("Hellion Warden // Play Now")
                            .setDescription("I can't play a empty music.")
                    ]
                });
                return;
            }

            let m = await music.play(link, event.member as GuildMember);

            try
            {
                let mu = await music.goto(m.pos);
                event.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(0x260041)
                            .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user.avatarURL() })
                            .setTitle("Hellion Warden // Play Now")
                            .setDescription(`${mu.title} **[${mu.requestedBy.user.tag}]**`)
                    ]
                });
            }
            catch (e)
            {
                event.error(e);
                event.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user.avatarURL() })
                            .setTitle("Hellion Warden // Play Now")
                            .setDescription("I can't resolve this music.")
                    ]
                });
            }
        }
    }
}