import { GuildMember, TextChannel, VoiceChannel } from "discord.js";
import { AudioPlayer, AudioPlayerStatus, createAudioPlayer, createAudioResource, DiscordGatewayAdapterCreator, joinVoiceChannel, StreamType, VoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import { EventEmitter } from 'events';
import { Readable } from 'stream';

export declare interface HellionMusicPlayer {
    on(event: 'ready', listener: () => void): this;
    once(event: 'ready', listener: () => void): this;

    on(event: 'error', listener: (err: Error) => void): this;
    once(event: 'error', listener: (err: Error) => void): this;

    on(event: 'queueError', listener: (music: HellionMusic, err: Error) => void): this;
    once(event: 'queueError', listener: (music: HellionMusic, err: Error) => void): this;

    on(event: 'play', listener: (music: HellionMusic) => void): this;
    once(event: 'play', listener: (music: HellionMusic) => void): this;

    on(event: 'end', listener: () => void): this;
    once(event: 'end', listener: () => void): this;
}

export class HellionMusicPlayer extends EventEmitter {
    public voiceChannel: VoiceChannel;
    public textChannel: TextChannel;

    private _playingNow: number;
    private _queue: HellionQueuedMusic[];
    private _connection: VoiceConnection;
    private _player: AudioPlayer;
    private _resolver: HellionMusicResolver[];
    private _loop: HellionMusicLoop;

    private _lastTime: number;
    private _playingTime: number;
    private _paused: boolean;

    constructor(voiceChannel: VoiceChannel, textChannel: TextChannel) {
        super();
        this.voiceChannel = voiceChannel;
        this.textChannel = textChannel;

        this._playingNow = 0;
        this._queue = [];
        this._connection = null;
        this._player = null;
        this._resolver = [];
        this._loop = 'none';
    }

    public addResolver(resolver: HellionMusicResolver): number {
        return this._resolver.push(resolver) - 1;
    }

    public getResolver(index: number): HellionMusicResolver {
        return this._resolver[index];
    }

    public delResolver(index: number): HellionMusicResolver {
        let resolver = this._resolver[index];
        this._resolver[index] = null;
        return resolver;
    }

    public setLoop(type: HellionMusicLoop): void {
        this._loop = type;
    }

    public getLoop(): HellionMusicLoop {
        return this._loop;
    }

    public getQueue(): HellionMusic[] {
        let result: HellionMusic[] = [];
        for (let item of this._queue)
            result.push({ title: item.title, requestedBy: item.requestedBy, duration: item.duration });
        return result;
    }

    public nowPlaying(): HellionPlayingNow {
        return {
            title: this._queue[this._playingNow].title,
            requestedBy: this._queue[this._playingNow].requestedBy,
            duration: this._queue[this._playingNow].duration,
            current: ((!this._paused) ? Date.now() - this._lastTime : 0) + this._playingTime,
            pos: this._playingNow
        };
    }

    public join(): void {
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

    public async play(music: string, user: GuildMember): Promise<HellionPlayResult> {
        if (!this._connection)
            this.join();
        let playingNow = false;
        if (!this._player) {
            this._player = createAudioPlayer();
            this._connection.subscribe(this._player);
            this._player.on(AudioPlayerStatus.Idle, () => this.next());
            this._player.on('error', (err) => {
                this.emit('error', err);
                this.next();
            });
            playingNow = true;
        }
        try {
            return await this.resolve(music, user, playingNow);
        } catch (e) {
            if (playingNow)
                this.destroy();
            throw e;
        }
    }

    public async seek(seek: number): Promise<void> {
        let playingNow = this._queue[this._playingNow];
        let m = await this._resolver[playingNow.resolver].get(playingNow.resolvable, seek);
        let resource = createAudioResource(m.stream, { inputType: m.type });
        this._player.play(resource);
        this._playingTime = seek * 1000;
        this._lastTime = Date.now();
    }

    public async goto(index: number): Promise<HellionMusic> {
        if (!this._player)
            throw new Error("Player doesn't exists");
        return new Promise((res) => {
            this._playingNow = index - 1;
            this._player.once(AudioPlayerStatus.Playing, () => {
                let music = this._queue[this._playingNow];
                res({ title: music.title, requestedBy: music.requestedBy, duration: music.duration });
            });
            this._player.stop();
        });
    }

    public pause(): void {
        if (!this._player)
            throw new Error("Player doesn't exists");
        if (this._player.pause()) {
            this._playingTime += Date.now() - this._lastTime;
            this._paused = true;
        }
    }

    public resume(): void {
        if (!this._player)
            throw new Error("Player doesn't exists");
        if (this._player.unpause()) {
            this._lastTime = Date.now();
            this._paused = false;
        }
    }

    public async skip(): Promise<HellionMusic> {
        return new Promise((res) => {
            if (!this._player)
                throw new Error("Player doesn't exists");
            this._player.once(AudioPlayerStatus.Playing, () => {
                let music = this._queue[this._playingNow];
                res({ title: music.title, requestedBy: music.requestedBy, duration: music.duration });
            });
            this._player.unpause();
            this._player.stop();
        });
    }

    public shuffle(): void {
        if (!this._player)
            throw new Error("Player doesn't exists");
        for (var i = this._queue.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = this._queue[i];
            this._queue[i] = this._queue[j];
            this._queue[j] = temp;
        }
        this._playingNow = -1;
        this._player.stop();
    }

    public remove(index: number): HellionMusic {
        if (!this._player)
            throw new Error("Player doesn't exists");
        let music = this._queue[index];
        if (!music)
            return;
        this._queue.splice(index, 1);
        if (this._playingNow == index) {
            this._playingNow--;
            this._player.stop();
        }
        else if (this._playingNow > index)
            this._playingNow--;
        return music;
    }

    public destroy(): void {
        if (this._connection) {
            this._connection.destroy();
            this._connection = null;
        }
        if (this._player) {
            this._player.stop();
            this._player = null;
        }
        this.emit('end');
    }

    private async resolve(music: string, user: GuildMember, playingNow: boolean): Promise<HellionPlayResult> {
        for (let i = 0; i < this._resolver.length; i++) {
            try {
                if (this._resolver[i] instanceof HellionBulkMusic) {
                    let resolver = this._resolver[i] as HellionBulkMusic;
                    let res = await resolver.bulk(music);
                    if (!res) continue;
                    let pos = -1;
                    for (let d of res) {
                        let k = { title: d.title, duration: d.duration, resolver: i, resolvable: d.resolvable, requestedBy: user };
                        let index = this._queue.push(k);
                        if (pos == -1)
                            pos = index - 1;
                    };
                    if (playingNow) {
                        let m = await resolver.get(this._queue[pos].resolvable);
                        let resource = createAudioResource(m.stream, { inputType: m.type });
                        this._player.play(resource);
                        this._playingTime = 0;
                        this._lastTime = Date.now();
                    }
                    return { playing: playingNow, title: this._queue[pos].title, requestedBy: user, count: res.length, pos: pos };
                }
                else {
                    let resolver = this._resolver[i] as HellionSingleMusic;
                    let res = await resolver.resolve(music);
                    if (!res) continue;
                    let k = { title: res.title, duration: res.duration, resolver: i, resolvable: res.resolvable, requestedBy: user };
                    let pos = this._queue.push(k) - 1;
                    if (playingNow) {
                        let m = await resolver.get(this._queue[0].resolvable);
                        let resource = createAudioResource(m.stream, { inputType: m.type });
                        this._player.play(resource);
                        this._playingTime = 0;
                        this._lastTime = Date.now();
                    }
                    return { playing: playingNow, requestedBy: user, pos: pos, title: res.title };
                }
            } catch (e) {
                this.emit('error', e);
            }
        }
        throw new Error("Can't resolve this music");
    }

    private async next(): Promise<void> {
        try {
            if (!this._connection || !this._player) {
                this.destroy();
                return;
            }
            if (this._loop != 'music')
                this._playingNow++;
            if (this._playingNow < 0)
                this._playingNow = 0;
            if (this._playingNow >= this._queue.length) {
                if (this._loop != 'queue') {
                    this.destroy();
                    return;
                }
                else {
                    this._playingNow = 0;
                }
            }
            let music = this._queue[this._playingNow];
            this.emit('play', { title: music.title, requestedBy: music.requestedBy, duration: music.duration });
            let m = await this._resolver[music.resolver].get(music.resolvable);
            let resource = createAudioResource(m.stream, { inputType: m.type });
            this._player.play(resource);
            this._playingTime = 0;
            this._lastTime = Date.now();
        } catch (e) {
            let music = this._queue[this._playingNow];
            this.remove(this._playingNow);
            this.next();
            this.emit('queueError', { title: music.title, requestedBy: music.requestedBy, duration: music.duration }, e);
        }
    }
}

export class HellionSingleMusic {
    public async resolve(music: string): Promise<HellionMusicResolved> {
        throw new Error("Method not implemented");
    }

    public async get(resolvable: string, seek?: number): Promise<HellionMusicStream> {
        throw new Error("Method not implemented");
    }
}

export class HellionBulkMusic {
    public async bulk(music: string): Promise<HellionMusicResolved[]> {
        throw new Error("Method not implemented");
    }

    public async get(resolvable: string, seek?: number): Promise<HellionMusicStream> {
        throw new Error("Method not implemented");
    }
}

export type HellionMusicResolver = HellionBulkMusic | HellionSingleMusic;

export interface HellionMusicStream {
    stream: Readable;
    type?: StreamType;
}

export interface HellionMusicResolved {
    title: string;
    duration: number;
    resolvable: string;
}

export interface HellionMusic {
    title: string;
    duration: number;
    requestedBy: GuildMember;
}

export interface HellionQueuedMusic {
    title: string;
    resolver: number;
    duration: number;
    resolvable: string;
    requestedBy: GuildMember;
}

export interface HellionPlayingNow {
    title: string;
    current: number;
    duration: number;
    requestedBy: GuildMember;
    pos: number;
}

export interface HellionPlayResult {
    title: string;
    playing: boolean;
    pos: number;
    requestedBy: GuildMember;
    count?: number;
}

export type HellionMusicLoop = 'none' | 'queue' | 'music';