import { GuildMember, TextChannel, VoiceChannel } from "discord.js";
import { AudioPlayer, AudioPlayerStatus, createAudioPlayer, createAudioResource, DiscordGatewayAdapterCreator, joinVoiceChannel, VoiceConnection } from "@discordjs/voice";
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

    on(event: 'queue', listener: (music: HellionMusic) => void): this;
    once(event: 'queue', listener: (music: HellionMusic) => void): this;

    on(event: 'bulkQueue', listener: (count: number) => void): this;
    once(event: 'bulkQueue', listener: (count: number) => void): this;

    on(event: 'end', listener: () => void): this;
    once(event: 'end', listener: () => void): this;

}

export class HellionMusicPlayer extends EventEmitter
{
    public loop: HellionMusicLoop;
    public resolver: HellionMusicResolver[];
    public voiceChannel: VoiceChannel;
    public textChannel: TextChannel;

    private _playingNow: number;
    private _queue: HellionQueuedMusic[];
    private _connection: VoiceConnection;
    private _player: AudioPlayer;

    constructor(voiceChannel: VoiceChannel, textChannel: TextChannel) {
        super();
        this.loop = 'none';
        this.resolver = [];
        this.voiceChannel = voiceChannel;
        this.textChannel = textChannel;

        this._playingNow = 0;
        this._queue = [];
        this._connection = null;
        this._player = null;
    }

    public join(): void
    {
        if (this._connection)
            this._connection.destroy();
        this._connection = joinVoiceChannel({
            channelId: this.voiceChannel.id,
            guildId: this.voiceChannel.guildId,
            adapterCreator: this.voiceChannel.guild.voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator
        });
        this.emit('ready');
    }

    public async play(music: string, user: GuildMember): Promise<void>
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
        await this.resolveAndPlay(music, user, playingNow);
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

    private async resolveAndPlay(music: string, user: GuildMember, playingNow: boolean): Promise<void>
    {
        for (let i = 0; i < this.resolver.length; i++)
        {
            if (this.resolver[i].isBulk) 
            {
                let res = await this.resolver[i].bulk(music);
                if (!res) continue;
                for(let d of res)
                {
                    let k = {title: d.title, resolver: i, resolvable: d.resolvable, requestedBy: user};
                    this._queue.push(k);
                }
                this.emit('bulkQueue', res.length);
                if (playingNow)
                {
                    let resource = createAudioResource(await this.resolver[i].get(this._queue[0].resolvable));
                    this._player.play(resource);
                }
                return;
            }
            else
            {
                let res = await this.resolver[i].resolve(music);
                if (!res) continue;
                let k = {title: res.title, resolver: i, resolvable: res.resolvable, requestedBy: user};
                this._queue.push(k);
                this.emit((playingNow) ? 'play' : 'queue', {title: res.title, requestedBy: user});
                {
                    let resource = createAudioResource(await this.resolver[i].get(this._queue[0].resolvable));
                    this._player.play(resource);
                }
                return;
            }
        }
        throw new Error("Can't resolve this music");
    }

    private async next(): Promise<void>
    {
        if (!this._connection || !this._player) return;
        if (this.loop != 'music') this._playingNow++;
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
        let resource = createAudioResource(await this.resolver[music.resolver].get(music.resolvable));
        this._player.play(resource);
    }
}

export class HellionMusicResolver
{
    public isBulk: boolean;

    public  async bulk(resolvable: string): Promise<HellionMusicResolved[]>
    {
        throw new Error("Method not implemented");
    }

    public async resolve(music: string): Promise<HellionMusicResolved>
    {
        throw new Error("Method not implemented");
    }

    public async get(resolvable: string): Promise<Readable>
    {
        throw new Error("Method not implemented");
    }
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

export type HellionMusicLoop = 'none' | 'queue' | 'music';