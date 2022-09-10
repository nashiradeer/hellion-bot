import { GuildMember, EmbedBuilder, TextChannel, VoiceChannel } from "discord.js";
import { setToken, getFreeClientID } from 'play-dl';
import { commandHandler, discord, player } from "..";

export class HellionCommand extends commandHandler.HellionCommandListener {
    private _tokenCreated: boolean;

    constructor() {
        super();
        this.name = "play";
        this.category = "Music";
        this.description = "Play a music or resume the player.";
        this.alias = ["p"];
        this.usage = [
            {
                name: "music",
                index: -1,
                description: "A song or playlist from YouTube or SoundCloud.",
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
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                        .setTitle("Hellion Warden // Play")
                        .setDescription("You aren't in a voice channel.")
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
                        new EmbedBuilder()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                            .setTitle("Hellion Warden // Play")
                            .setDescription("I aren't playing anything. You need provide a valid URL or search term after the play command.")
                    ]
                });
                return;
            }
            if (music.voiceChannel.id != member.voice.channelId) {
                event.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                            .setTitle("Hellion Warden // Play")
                            .setDescription("You aren't in the same voice channel of me.")
                    ]
                });
                return;
            }
            music?.resume();
            event.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x260041)
                        .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                        .setTitle("Hellion Warden // Play")
                        .setDescription("Resuming the music player.")
                ]
            });
            return;
        }

        if (!music) {
            music = new player.HellionMusicPlayer(member.voice.channel as VoiceChannel, event.channel as TextChannel);

            music.addResolver(new (await player.resolvers.playDl()).HellionYTDLResolver());
            music.addResolver(new (await player.resolvers.playDl()).HellionYTPLResolver());
            music.addResolver(new (await player.resolvers.playDl()).HellionSODLResolver());
            music.addResolver(new (await player.resolvers.playDl()).HellionSOPLResolver());
            music.addResolver(new (await player.resolvers.playDl()).HellionYTSRResolver());

            music.on('play', (playing) => {
                music?.textChannel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0x260041)
                            .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                            .setTitle("Hellion Warden // Playing Now")
                            .setDescription(`${playing.title} **[${playing.user}]**`)
                    ]
                }).then((m) => {
                    setTimeout(() => m.delete(), 30000);
                });
            });

            music.on('end', () => {
                event.info("Music Player is ending...");
                (data as discord.HellionWardenData).music.delete(event.guild?.id || '');
            });

            music.on('disconnected', () => {
                music?.textChannel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                            .setTitle("Hellion Warden // Disconnected")
                            .setDescription("A administrator has moved or kicked out me.")
                    ]
                });
            });

            music.on('queueError', (m, err) => {
                event.error(err);
                music?.textChannel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                            .setTitle("Hellion Warden // Queue Error")
                            .setDescription(`Removing: \`${m.title}\` **[${m.user}]**\nPlease check if the music exists, is public and if isn't age restricted.`)
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
                        new EmbedBuilder()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                            .setTitle("Hellion Warden // Play")
                            .setDescription("You aren't in the same voice channel of me.")
                    ]
                });
                return;
            }
        }

        try {
            let res = await music.play(link, (event.member as GuildMember).nickname || event.member?.user.username || "");
            if (res.items.length > 1) {
                event.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0x260041)
                            .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                            .setTitle("Hellion Warden // Enqueued")
                            .setDescription(`Enqueued a total of ${res.items.length} songs to end of the queue.`)
                    ]
                });

                if (res.playing) {
                    music.textChannel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0x260041)
                                .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                                .setTitle("Hellion Warden // Playing Now")
                                .setDescription(`${res.items[0].title} **[${res.items[0].user}]**`)
                        ]
                    }).then((m) => {
                        setTimeout(() => m.delete(), 30000);
                    });
                }
            } else if (res.playing) {
                event.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0x260041)
                            .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                            .setTitle("Hellion Warden // Playing Now")
                            .setDescription(`${res.items[0].title} **[${res.items[0].user}]**`)
                    ]
                });
            } else {
                event.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0x260041)
                            .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                            .setTitle("Hellion Warden // Enqueued")
                            .setDescription(`${res.items[0].title} **[${res.items[0].user}]** at **#${res.position + 1}**`)
                    ]
                });
            }
        }
        catch (err) {
            event.error(err);
            event.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                        .setTitle("Hellion Warden // Play")
                        .setDescription("I can't resolve this music.\nPlease check if the music exists, is public and if isn't age restricted.")
                ]
            });
        }
    }
}