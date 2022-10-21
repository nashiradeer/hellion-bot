import { GuildMember, MessageEmbed, TextChannel, VoiceChannel } from "discord.js";
import { setToken, getFreeClientID } from 'play-dl';
import { commandHandler, discord, player } from "..";
import { HellionWardenData } from "../discord";

export class HellionCommand extends commandHandler.HellionCommandListener {
    private _tokenCreated: boolean;

    constructor() {
        super();
        this.name = "play";
        this.category = "Music";
        this.description = "Play a song now by skipping the current song.";
        this.alias = ["p"];
        this.usage = [
            {
                name: "music",
                index: -1,
                description: "A song or playlist you want played.",
                required: false,
                type: 'STRING'
            }
        ];
        this._tokenCreated = false;
    }

    public async run(event: commandHandler.HellionCommandEvent, data: any): Promise<void> {
        await event.replyHandler.defer();
        if (!this._tokenCreated) {
            await setToken({
                soundcloud: {
                    client_id: await getFreeClientID()
                }
            });
            this._tokenCreated = true;
        }

        let member = event.member as GuildMember;
        if (!member.voice.channel) {
            event.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(0xff0000)
                        .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                        .setTitle("Hellion // Play")
                        .setDescription("You aren't on a voice chat.")
                ]
            });
            return;
        }

        let music = (data as discord.HellionWardenData).music.get(event.guild?.id || '');
        let link = event.args.getByIndex(0);


        if (!link) {
            if (!music) {
                event.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                            .setTitle("Hellion // Play")
                            .setDescription("I'm not playing anything at the moment. If you want to play something, add a link or valid search term after the command.")
                    ]
                });
                return;
            }
            if (music.voiceChannel.id != member.voice.channelId) {
                event.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                            .setTitle("Hellion // Play")
                            .setDescription("You're not on the same voice chat as me.")
                    ]
                });
                return;
            }
            music?.resume();
            event.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(data.embedColor)
                        .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                        .setTitle("Hellion // Play")
                        .setDescription("Music Player has been resumed.")
                ]
            });
            return;
        }

        if (!music) {
            if (event.guild?.me && !member.voice.channel.permissionsFor(event.guild.me).has(["CONNECT", "SPEAK"])) {
                event.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                            .setTitle("Hellion // Play")
                            .setDescription("I don't have the permissions to connect and speak on this voice chat.")
                    ]
                });
                return;
            }

            music = new player.HellionMusicPlayer(member.voice.channel as VoiceChannel, event.channel as TextChannel);

            music.addResolver(new (await player.resolvers.playDl()).HellionYTDLResolver());
            music.addResolver(new (await player.resolvers.playDl()).HellionYTPLResolver());
            music.addResolver(new (await player.resolvers.playDl()).HellionSODLResolver());
            music.addResolver(new (await player.resolvers.playDl()).HellionSOPLResolver());
            music.addResolver(new (await player.resolvers.playDl()).HellionYTSRResolver());

            music.on('play', (playing) => {
                music?.textChannel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(data.embedColor)
                            .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                            .setTitle("Hellion // Playing Now")
                            .setDescription(`${playing.title} **[${playing.requestedBy.user.tag}]**`)
                    ]
                }).then((m) => {
                    setTimeout(() => m.delete(), 30000);
                });
            });

            music.on('end', () => {
                event.info("Music Player is ending...");
                (data as discord.HellionWardenData).music.delete(event.guild?.id || '');
            });

            music.on('reconnecting', () => {
                music?.textChannel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(data.embedColor)
                            .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                            .setTitle("Hellion // Reconnecting")
                            .setDescription("I've been moved from voice chat or a Discord error has occurred trying to reconnect.")
                    ]
                });
            });

            music.on('disconnected', () => {
                music?.textChannel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                            .setTitle("Hellion // Disconnected")
                            .setDescription("I was disconnected due to a Discord error or by an administrator.")
                    ]
                });
            });

            music.on('queueError', (m, err) => {
                event.error(err);
                music?.textChannel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                            .setTitle("Hellion // Queue Error")
                            .setDescription(`Removing \`\`${m.title}\`\` by **${m.requestedBy.user.tag}** due to an error. Please check if this song is available or has no age restriction.`)
                    ]
                });
            });

            music.on('error', (err) => {
                event.error(err);
            });

            (data as discord.HellionWardenData).music.set(event.guild?.id || '', music);
        }
        else {
            if (music.voiceChannel.id != member.voice.channelId) {
                event.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                            .setTitle("Hellion // Play")
                            .setDescription("You're not on the same voice chat as me.")
                    ]
                });
                return;
            }
        }

        try {
            let res = await music.play(link, event.member as GuildMember);
            if (res.count > 1) {
                event.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(data.embedColor)
                            .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                            .setTitle("Hellion // Enqueued")
                            .setDescription(`Enqueued a total of ${res.count} songs to the queue.`)
                    ]
                });

                if (res.playing) {
                    music.textChannel.send({
                        embeds: [
                            new MessageEmbed()
                                .setColor(data.embedColor)
                                .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                                .setTitle("Hellion // Playing Now")
                                .setDescription(`${res.title} **[${res.requestedBy.user.tag}]**`)
                        ]
                    }).then((m) => {
                        setTimeout(() => m.delete(), 30000);
                    });
                }
            } else if (res.playing) {
                event.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(data.embedColor)
                            .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                            .setTitle("Hellion // Playing Now")
                            .setDescription(`${res.title} **[${res.requestedBy.user.tag}]**`)
                    ]
                });
            } else {
                event.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(data.embedColor)
                            .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                            .setTitle("Hellion // Enqueued")
                            .setDescription(`${res.title} **[${res.requestedBy.user.tag}]** at **#${res.pos + 1}**`)
                    ]
                });
            }
        }
        catch (err) {
            event.error(err);
            event.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(0xff0000)
                        .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                        .setTitle("Hellion // Play")
                        .setDescription("Could not find this song or playlist. Please check if this song is available or has no age restriction.")
                ]
            });
        }
    }
}