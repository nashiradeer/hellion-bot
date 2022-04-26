import { GuildMember, TextChannel, VoiceChannel } from "discord.js";
import { AudioPlayer, AudioPlayerStatus, createAudioPlayer, createAudioResource, DiscordGatewayAdapterCreator, joinVoiceChannel, StreamType, VoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import { EventEmitter } from 'events';
import { Readable } from 'stream';

export declare interface HellionMusicPlayer
{
    on(event: 'ready', listener: () => void): this;
    once(event: 'ready', listener: () => void): this;

    on(event: 'error', listener: (err: Error) => void): this;
    once(event: 'error', listener: (err: Error) => void): this;

    on(event: 'play', listener: (music: HellionMusic) => void): this;
    once(event: 'play', listener: (music: HellionMusic) => void): this;

    on(event: 'end', listener: () => void): this;
    once(event: 'end', listener: () => void): this;

}

export class HellionMusicPlayer extends EventEmitter
{
    public loop: HellionMusicLoop;
    public voiceChannel: VoiceChannel;
    public textChannel: TextChannel;

    private _playingNow: number;
    private _queue: HellionQueuedMusic[];
    private _connection: VoiceConnection;
    private _player: AudioPlayer;
    private _resolver: HellionMusicResolver[];

    constructor(voiceChannel: VoiceChannel, textChannel: TextChannel) {
        super();
        this.loop = 'none';
        this.voiceChannel = voiceChannel;
        this.textChannel = textChannel;

        this._playingNow = 0;
        this._queue = [];
        this._connection = null;
        this._player = null;
        this._resolver = [];
    }

    public addResolver(resolver: HellionMusicResolver): number
    {
        return this._resolver.push(resolver) - 1;
    }

    public getResolver(index: number): HellionMusicResolver
    {
        return this._resolver[index];
    }

    public delResolver(index: number): HellionMusicResolver
    {
        let resolver = this._resolver[index];
        this._resolver[index] = null;
        return resolver;
    }

    public join(): void
    {
        if (this._connection)
            this._connection.destroy();
        this._connection = joinVoiceChannel({
            channelId: this.voiceChannel.id,
            guildId: this.voiceChannel.guildId,
            adapterCreator: this.voiceChannel.guild.voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator
        })
        .on(VoiceConnectionStatus.Disconnected, () => {
            this.destroy();
        })
        .on('error', (err) => {
            this.emit('error', err);
            this.destroy();
        });
        this.emit('ready');
    }

    public async play(music: string, user: GuildMember): Promise<HellionPlayResult>
    {
        if (!this._connection)
            this.join();
        let playingNow = false;
        if (!this._player)
        {
            this._player = createAudioPlayer();
            this._connection.subscribe(this._player);
            this._player.on(AudioPlayerStatus.Idle, () => this.next());
            this._player.on('error', (err) => {
                this.emit('error', err);
                this.next();
            });
            playingNow = true;
        }
        return await this.resolve(music, user, playingNow);
    }

    public pause(): void
    {
        if (!this._player)
            throw new Error("Player doesn't exists");
        this._player.pause();
    }

    public resume(): void
    {
        if (!this._player)
            throw new Error("Player doesn't exists");
        this._player.unpause();
    }

    public skip(): HellionMusic
    {
        if (!this._player)
            throw new Error("Player doesn't exists");
        this._player.stop();
        let music = this._queue[this._playingNow];
        return {title: music.title, requestedBy: music.requestedBy};
    }

    public shuffle(): void
    {
        for (var i = this._queue.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = this._queue[i];
            this._queue[i] = this._queue[j];
            this._queue[j] = temp;
        }
    }

    public remove(index: number): HellionMusic
    {
        let music = this._queue[index];
        this._queue.splice(index, 1);
        this._playingNow--;
        return music;
    }

    public destroy(): void
    {
        if (this._connection)
        {
            this._connection.destroy();
            this._connection = null;
        }
        if (this._player)
        {
            this._player.stop();
            this._player = null;
        }
        this.emit('end');
    }

    private async resolve(music: string, user: GuildMember, playingNow: boolean): Promise<HellionPlayResult>
    {
        for (let i = 0; i < this._resolver.length; i++)
        {
            try
            {
                if (this._resolver[i] instanceof HellionBulkMusic) 
                {
                    let resolver = this._resolver[i] as HellionBulkMusic;
                    let res = await resolver.bulk(music);
                    if (!res) continue;
                    let pos = -1;
                    for(let d of res)
                    {
                        let k = {title: d.title, resolver: i, resolvable: d.resolvable, requestedBy: user};
                        let index = this._queue.push(k);
                        if (pos == -1)
                            pos = index - 1;
                    };
                    this.emit('bulkQueue', res.length);
                    if (playingNow)
                    {
                        let m = await resolver.get(this._queue[pos].resolvable);
                        let resource = createAudioResource(m.stream, { inputType: m.type });
                        this._player.play(resource);
                    }
                    return { playing: playingNow, requestedBy: user, count: res.length, pos: pos };
                }
                else
                {
                    let resolver = this._resolver[i] as HellionSingleMusic;
                    let res = await resolver.resolve(music);
                    if (!res) continue;
                    let k = {title: res.title, resolver: i, resolvable: res.resolvable, requestedBy: user};
                    let pos = this._queue.push(k) - 1;
                    if (playingNow)
                    {
                        let m = await resolver.get(this._queue[0].resolvable);
                        let resource = createAudioResource(m.stream, { inputType: m.type });
                        this._player.play(resource);
                    }
                    return { playing: playingNow, requestedBy: user, pos: pos, title: res.title };
                }
            }
            catch (e)
            {
                this.emit('error', e);
            }
        }
        throw new Error("Can't resolve this music");
    }

    private async next(): Promise<void>
    {
        if (!this._connection || !this._player)
        {
            this.destroy();
            return;
        }
        if (this.loop != 'music')
            this._playingNow++;
        if (this._playingNow >= this._queue.length)
        {
            if (this.loop != 'queue')
            {
                this.destroy();
                return;
            }
            else
            {
                this._playingNow = 0;
            }
        }
        let music = this._queue[this._playingNow];
        this.emit('play', {title: music.title, requestedBy: music.requestedBy});
        let m = await this._resolver[music.resolver].get(music.resolvable);
        let resource = createAudioResource(m.stream, { inputType: m.type });
        this._player.play(resource);
    }
}

export class HellionSingleMusic
{
    public async resolve(music: string): Promise<HellionMusicResolved>
    {
        throw new Error("Method not implemented");
    }

    public async get(resolvable: string, seek?: number): Promise<HellionMusicStream>
    {
        throw new Error("Method not implemented");
    }
}

export class HellionBulkMusic
{
    public  async bulk(music: string): Promise<HellionMusicResolved[]>
    {
        throw new Error("Method not implemented");
    }

    public async get(resolvable: string, seek?: number): Promise<HellionMusicStream>
    {
        throw new Error("Method not implemented");
    }
}

export type HellionMusicResolver = HellionBulkMusic | HellionSingleMusic;

export interface HellionMusicStream
{
    stream: Readable;
    type?: StreamType;
}

export interface HellionMusicResolved
{
    title: string;
    resolvable: string;
}

export interface HellionMusic
{
    title: string;
    requestedBy: GuildMember;
}

export interface HellionQueuedMusic
{
    title: string;
    resolver: number;
    resolvable: string;
    requestedBy: GuildMember;
}

export interface HellionPlayResult
{
    title?: string;
    count?: number;
    playing: boolean;
    pos: number;
    requestedBy: GuildMember;
}

export type HellionMusicLoop = 'none' | 'queue' | 'music';