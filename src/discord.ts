import { BitFieldResolvable, Client, ClientOptions, CommandInteraction, IntentsString, Interaction, Message, MessageEmbed, VoiceState } from 'discord.js';
import { EventEmitter } from 'events';
import { commandHandler, HellionWardenInformation, logger, player } from '.';
import { resolve } from 'path';

export interface HellionWardenOptions {
    botpublic?: boolean | null;
    botowner?: string | null;
    embedColor?: string | null;
    iconUrl?: string | null;
}

export interface HellionWardenData {
    music: Map<string, player.HellionMusicPlayer>;
    botpublic: boolean;
    botowner: string;
    prefix: string;
    embedColor: number;
    iconUrl: string;
}

export declare interface HellionWarden {
    on(event: 'ready', listener: () => void): this;
    once(event: 'ready', listener: () => void): this;

    on(event: 'logged', listener: () => void): this;
    once(event: 'logged', listener: () => void): this;

    on(event: 'error', listener: (err: Error) => void): this;
    once(event: 'error', listener: (err: Error) => void): this;

    on(event: 'debug', listener: (type: 'info' | 'debug' | 'warn', message: string) => void): this;
    once(event: 'debug', listener: (type: 'info' | 'debug' | 'warn', message: string) => void): this;
}

export class HellionWarden extends EventEmitter {
    public static readonly REQUIRED_INTENTS: BitFieldResolvable<IntentsString, number> = ['GUILDS', 'GUILD_MESSAGES', 'GUILD_VOICE_STATES'];

    private _data: HellionWardenData;
    private _client: Client;
    private _token: string;

    public prefix: string;
    public botpublic: boolean;
    public botowner: string;
    public handler: commandHandler.HellionCommandHandler;

    constructor(token: string, prefix: string = "h!", options?: ClientOptions & HellionWardenOptions) {
        super();

        // Initialize
        this._token = token;
        this.prefix = prefix;
        this.botpublic = options?.botpublic || false;
        this.botowner = options?.botowner || '';
        this._data = {
            music: new Map<string, player.HellionMusicPlayer>(),
            prefix: prefix,
            botpublic: this.botpublic,
            botowner: this.botowner,
            embedColor: parseInt(options?.embedColor ?? "007dff", 16),
            iconUrl: options?.iconUrl ?? "https://www.deersoftware.dev/assets/images/hellion.png"
        };

        // Initialize Discord Client
        this._client = new Client(options || { intents: HellionWarden.REQUIRED_INTENTS });

        // Register Discord Client events
        this._client.on('messageCreate', (message) => this.message(message));
        this._client.on('interactionCreate', (interaction) => this.interaction(interaction));
        this._client.on('voiceStateUpdate', (oldState, newState) => {
            this.autoexit(oldState, newState);
        });
        this._client.once('ready', async () => {
            this.emit('logged');
            setInterval(async () => {
                let messages = [
                    "with DeerSoftware",
                    `in ${await this.guildSize()} guilds`,
                    `using Hellion v${HellionWardenInformation.VERSION}`
                ];
                this._client.user?.setActivity(messages[Math.floor(Math.random() * messages.length)], { type: 'LISTENING' });
            }, 60000);
        });

        // Initialize Command Handler
        this.handler = new commandHandler.HellionCommandHandler();
    }

    private async message(message: Message): Promise<void> {
        if (message.author.bot) return;
        if (!message.guild) return;
        if (!message.content.startsWith(this.prefix)) {
            if (message.content.trim() == `<@${this._client.user?.id}>` || message.content.trim() == `<@!${this._client.user?.id}>`) {
                message.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(0x260041)
                            .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: this._client.user?.avatarURL() || '' })
                            .setTitle("Hellion Warden // Mention")
                            .setDescription(`My command prefix is: \`\`${this.prefix}\`\``)
                    ]
                }).catch((e: Error) => this.emit('debug', 'warn', "Send message error in 'message': " + e.stack || e.toString()));
            }
            return;
        }

        this.emit('debug', 'debug', 'Running command from a message.');
        await this.handler.run(this._client, message, this.prefix, this._data);
    }


    private async interaction(interaction: Interaction): Promise<void> {
        if (interaction.isCommand()) {
            this.emit('debug', 'debug', 'Running command from a interaction.');
            await this.handler.runInteraction(this._client, interaction as CommandInteraction, this._data);
        }
    }

    private async autoexit(oldState: VoiceState, newState: VoiceState) {
        let player = this._data.music.get(oldState?.guild.id || '');

        if (player) {
            if (newState.guild.me?.voice.channel && newState.guild.me.voice.channelId != player.voiceChannel.id)
                player.voiceChannel = newState.guild.me.voice.channel;

            if (player.voiceChannel.id == newState.channelId) {
                if (player.voiceChannel.members.size == 1) {
                    if (!player.emptyCallTimer) {
                        player.textChannel.send({
                            embeds: [
                                new MessageEmbed()
                                    .setColor(this._data.embedColor)
                                    .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                                    .setTitle("Hellion Warden // Music Player")
                                    .setDescription("Voice chat is empty, I'll be disconnecting in 10 seconds.")
                            ]
                        }).catch((e: Error) => {
                            this.emit('debug', 'warn', "Send message error in 'autoexit': " + (e.stack || e.toString()))
                        });

                        player.emptyCallTimer = setTimeout(() => {
                            if (player) {
                                player.emptyCallTimer = null;

                                player.textChannel.send({
                                    embeds: [
                                        new MessageEmbed()
                                            .setColor(this._data.embedColor)
                                            .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                                            .setTitle("Hellion Warden // Music Player")
                                            .setDescription("Voice chat was empty for more than 10 seconds, disconnecting...")
                                    ]
                                }).catch((e: Error) => {
                                    this.emit('debug', 'warn', "Send message error in 'autoexit': " + (e.stack || e.toString()))
                                });

                                player.destroy();
                            }
                        }, 10000);
                    }
                } else {
                    if (player.emptyCallTimer) {
                        clearInterval(player.emptyCallTimer);

                        player.textChannel.send({
                            embeds: [
                                new MessageEmbed()
                                    .setColor(this._data.embedColor)
                                    .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                                    .setTitle("Hellion Warden // Music Player")
                                    .setDescription("Someone joined voice chat, disconnection canceled.")
                            ]
                        }).catch((e: Error) => {
                            this.emit('debug', 'warn', "Send message error in 'autoexit': " + (e.stack || e.toString()))
                        });
                    }

                    player.emptyCallTimer = null;
                }
            }
        }
    }

    public async start(): Promise<void> {
        this.emit('debug', 'info', "Initializing Command Handler...");
        await this.handler.init(resolve(__dirname, 'commands'));

        this.emit('debug', 'info', "Logging to Discord...");
        await this._client.login(this._token);

        this.emit('debug', 'info', "Registering Slash Commands...");
        await this.handler.initSlashCommand(this._client.user?.id || '', this._token);
    }

    private async guildSize(): Promise<number> {
        return (await this._client.shard?.fetchClientValues('guilds.cache.size'))?.reduce((acc: number, cur: number) => acc + cur, 0) as number || this._client.guilds.cache.size;
    }
}