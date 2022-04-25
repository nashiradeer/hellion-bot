import { GuildMember, MessageEmbed, TextChannel, VoiceChannel } from "discord.js";
import { commandHandler, discord, player } from "..";

export class HellionCommand extends commandHandler.HellionCommandListener
{
    constructor()
    {
        super();
        this.name = "play";
        this.category = "Music";
        this.description = "Play a music or resume the player.";
        this.alias = [ "p" ];
        this.usage = [
            {
                name: "music",
                index: -1,
                description: "Music or playlist to be played.",
                required: false,
                type: 'STRING'
            }
        ]
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
                        .setTitle("Hellion Warden // Play")
                        .setDescription("You aren't in a voice channel.")
                ]
            });
            return;
        }

        let music = (data as discord.HellionWardenData).music.get(event.guild.id);

        if (!music)
        {
            music = new player.HellionMusicPlayer(member.voice.channel as VoiceChannel, event.channel as TextChannel);

            music.resolver = [
                new player.resolvers.HellionYoutubedlResolver(),
                new player.resolvers.HellionYtplResolver(),
                new player.resolvers.HellionYtsrResolver()
            ]

            music.on('play', (playing) => {
                music.textChannel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(0x260041)
                            .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user.avatarURL() })
                            .setTitle("Hellion Warden // Playing now")
                            .setDescription(`${playing.title} **[${playing.requestedBy.user.tag}]**`)
                    ]
                }).then((m) => {
                    setTimeout(() => m.delete(), 30000);
                });
            });

            music.on('queue', (playing) => {
                music.textChannel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(0x260041)
                            .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user.avatarURL() })
                            .setTitle("Hellion Warden // Enqueued")
                            .setDescription(`${playing.title} **[${playing.requestedBy.user.tag}]**`)
                    ]
                }).then((m) => setTimeout(() => m.delete(), 15000));
            });

            music.on('bulkQueue', (count) => {
                music.textChannel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(0x260041)
                            .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user.avatarURL() })
                            .setTitle("Hellion Warden // Enqueued")
                            .setDescription(`Enqueued a total of ${count} musics.`)
                    ]
                }).then((m) => setTimeout(() => m.delete(), 15000));
            });

            music.on('end', () => {
                (data as discord.HellionWardenData).music.delete(event.guild.id);
            });

            music.on('error', (err) => {
                event.error(err);
            });

            (data as discord.HellionWardenData).music.set(event.guild.id, music);
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
                            .setTitle("Hellion Warden // Play")
                            .setDescription("You aren't in the same voice channel of me.")
                    ]
                });
                return;
            }
        }

        let link = event.args.getByIndex(0);
        if (!link)
        {
            music.resume();
            event.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(0x260041)
                        .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user.avatarURL() })
                        .setTitle("Hellion Warden // Play")
                        .setDescription("Resuming the music player.")
                ]
            });
            return;
        }

        music.play(link as string, event.member as GuildMember).catch((err) => {
            event.error(err);
            event.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(0xff0000)
                        .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user.avatarURL() })
                        .setTitle("Hellion Warden // Play")
                        .setDescription("I can't resolve this music.")
                ]
            });
        }).then(() => {
            event.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(0x260041)
                        .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user.avatarURL() })
                        .setTitle("Hellion Warden // Play")
                        .setDescription("Success! Your music has already registered in the Music Player.")
                ]
            }).then((m) => setTimeout(() => m.delete(), 5000));
        });
    }
}