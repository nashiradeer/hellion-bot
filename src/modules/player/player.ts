import { GuildMember, TextChannel, VoiceChannel } from "discord.js";
import { AudioPlayer, AudioPlayerStatus, createAudioPlayer, createAudioResource, DiscordGatewayAdapterCreator, joinVoiceChannel, StreamType, VoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import { EventEmitter } from 'events';
import { HellionMusic, HellionMusicExtractor, HellionMusicLoader, HellionMusicPlayerOptions, HellionMusicSearcher, HellionQueueLoop } from "./base";
import { HellionMusicResolver, HellionResolverExtractorAdapter, HellionResolverLoaderAdapter } from "./resolver";

export declare interface HellionMusicPlayer {
    on(event: 'ready', listener: () => void): this;
    once(event: 'ready', listener: () => void): this;

    on(event: 'error', listener: (err: Error) => void): this;
    once(event: 'error', listener: (err: Error) => void): this;

    on(event: 'queueError', listener: (music: HellionMusic, err: Error) => void): this;
    once(event: 'queueError', listener: (music: HellionMusic, err: Error) => void): this;

    on(event: 'play', listener: (music: HellionMusic) => void): this;
    once(event: 'play', listener: (music: HellionMusic) => void): this;

    on(event: 'disconnected', listener: () => void): this;
    once(event: 'disconnected', listener: () => void): this;

    on(event: 'end', listener: () => void): this;
    once(event: 'end', listener: () => void): this;
}

export class HellionMusicPlayer extends EventEmitter {
    public voiceChannel: VoiceChannel;
    public textChannel: TextChannel;

    public playing: number;
    public queue: HellionMusic[];
    public loop: HellionQueueLoop;

    public extractors: HellionMusicExtractor[];
    public loaders: HellionMusicLoader[];
    public searchers: HellionMusicSearcher[];

    private _connection: VoiceConnection | null;
    private _player: AudioPlayer | null;

    private _accumulativeTime: number;
    private _lastPlayTime: number;

    private _paused: boolean;
    private _playing: boolean;
    private _destroyed: boolean;

    private _resolver: number;

    constructor(voiceChannel: VoiceChannel, textChannel: TextChannel, options?: HellionMusicPlayerOptions | null) {
        super();
        this.voiceChannel = voiceChannel;
        this.textChannel = textChannel;

        this.playing = 0;
        this.queue = [];
        this.loop = HellionQueueLoop.None;

        this.extractors = options?.extractors || [];
        this.loaders = options?.loaders || [];
        this.searchers = options?.searchers || [];

        this._connection = null;
        this._player = null;

        this._accumulativeTime = 0;
        this._lastPlayTime = 0;

        this._paused = false;
        this._playing = false;
        this._destroyed = false;

        this._resolver = 0;
    }

    public addResolver(resolver: HellionMusicResolver): number {
        this.extractors.push(new HellionResolverExtractorAdapter("resolver-adapter-" + this._resolver, resolver));
        this.loaders.push(new HellionResolverLoaderAdapter("resolver-adapter-" + this._resolver, resolver));
        return this._resolver++;
    }

    public getResolver(index: number): HellionMusicResolver {
        for (let extractor of this.extractors) {
            if (extractor.extractor == "resolver-adapter-" + index && extractor instanceof HellionResolverExtractorAdapter) {
                return extractor.resolver;
            }
        }
        for (let loader of this.loaders) {
            if (loader.extractor == "resolver-adapter-" + index && loader instanceof HellionResolverLoaderAdapter) {
                return loader.resolver;
            }
        }
        throw new RangeError("Don't have a resolver adapter with this index.");
    }

    public delResolver(index: number): HellionMusicResolver {
        let resolver = this.getResolver(index);
        for (let i = 0; i < this.extractors.length; i++) {
            if (this.extractors[i].extractor == "resolver-adapter-" + index && this.extractors[i] instanceof HellionResolverExtractorAdapter)
                this.extractors.splice(i, 1);
        }
        for (let i = 0; i < this.loaders.length; i++) {
            if (this.loaders[i].extractor == "resolver-adapter-" + index && this.loaders[i] instanceof HellionResolverLoaderAdapter)
                this.loaders.splice(i, 1);
        }
        return resolver;
    }

    /**
     * @deprecated string based loop types is deprecated since v1.2.0
     */
    public setLoop(type: HellionMusicLoop): void {
        switch (type) {
            case "music":
                this.loop = HellionQueueLoop.Music;
                break;
            case "queue":
                this.loop = HellionQueueLoop.Queue;
                break;
            default:
                this.loop = HellionQueueLoop.None;
                break;
        }
    }

    /**
     * @deprecated string based loop types is deprecated since v1.2.0
     */
    public getLoop(): HellionMusicLoop {
        switch (this.loop) {
            case HellionQueueLoop.Music: return "music";
            case HellionQueueLoop.Queue: return "queue";
            default: return "none";
        }
    }

    /**
     * @deprecated since v1.2.0
     */
    public getQueue(): HellionMusic[] {
        return this.queue;
    }

    /**
     * @deprecated since v1.2.0
     */
    public nowPlaying(): HellionPlayingNow {
        return {
            title: this.queue[this.playing].title,
            requestedBy: this.queue[this.playing].user,
            duration: this.queue[this.playing].duration,
            current: ((!this._paused) ? Date.now() - this._lastPlayTime : 0) + this._accumulativeTime,
            pos: this.playing
        };
    }

    public async playNow(music: string, user: GuildMember): Promise<HellionPlayResult> {
        let musics = await this.resolve(music, user);
        if (musics.length <= 0) throw new Error("Resolve returned a empty array");
        this._queue.splice(this._playingNow + 1, 0, ...musics);
        this.skip();
        return { title: musics[0].title, count: musics.length, playing: true, pos: this._playingNow, requestedBy: musics[0].requestedBy };
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
                if (!this._destroyed) {
                    this.destroy();
                    this.emit('disconnected');
                }
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
            this._connection?.subscribe(this._player);
            this._player.on(AudioPlayerStatus.Idle, () => this.next());
            this._player.on('error', (err) => {
                this.emit('error', err);
                this.next();
            });
            playingNow = true;
        }
        try {
            let musics = await this.resolve(music, user);
            if (music.length == 0) throw new Error("Resolve returned a empty array");
            let pos = this._queue.length;
            this._queue.push(...musics);
            if (playingNow) {
                let m = await this._resolver[this._queue[pos].resolver].get(this._queue[pos].resolvable);
                if (!m) throw new Error("Abnormal null during resolver get");
                let resource = createAudioResource(m.stream, { inputType: m.type });
                this._player?.play(resource);
                this._playingTime = 0;
                this._lastTime = Date.now();
            }
            return { playing: playingNow, title: this._queue[pos].title, requestedBy: user, count: musics.length, pos: pos };
        } catch (e) {
            if (playingNow)
                this.destroy();
            throw e;
        }
    }

    public async seek(seek: number): Promise<void> {
        let playingNow = this._queue[this._playingNow];
        let m = await this._resolver[playingNow.resolver].get(playingNow.resolvable, seek);
        if (!m)
            throw new Error("Abnormal null during resolver get");
        let resource = createAudioResource(m.stream, { inputType: m.type });
        this._player?.play(resource);
        this._playingTime = seek * 1000;
        this._lastTime = Date.now();
    }

    public async goto(index: number): Promise<HellionMusic> {
        if (!this._player)
            throw new Error("Player doesn't exists");
        return new Promise((res) => {
            this._playingNow = index - 1;
            this._player?.once(AudioPlayerStatus.Playing, () => {
                let music = this._queue[this._playingNow];
                res({ title: music.title, requestedBy: music.requestedBy, duration: music.duration });
            });
            this._player?.stop();
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

    public async skip(): Promise<HellionMusic | null> {
        return new Promise((res) => {
            if (!this._player)
                throw new Error("Player doesn't exists");
            if (this._queue.length - 1 == this._playingNow && this._loop == 'none')
                res(null);
            else
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

    public remove(index: number): HellionMusic | null {
        if (!this._player)
            throw new Error("Player doesn't exists");
        let music = this._queue[index];
        if (!music)
            return null;
        this._queue.splice(index, 1);
        if (this._playingNow == index) {
            this._playingNow--;
            this._player.stop();
        }
        else if (this._playingNow > index)
            this._playingNow--;
        return music;
    }

    private async resolve(music: string, user: GuildMember): Promise<HellionQueuedMusic[]> {
        for (let i = 0; i < this._resolver.length; i++) {
            try {
                if (this._resolver[i] instanceof HellionBulkMusic) {
                    let resolver = this._resolver[i] as HellionBulkMusic;
                    let res = await resolver.bulk(music);
                    if (!res) continue;
                    let result: HellionQueuedMusic[] = [];
                    for (let d of res) {
                        let k = { title: d.title, duration: d.duration, resolver: i, resolvable: d.resolvable, requestedBy: user };
                        result.push(k);
                    };
                    return result;
                }
                else {
                    let resolver = this._resolver[i] as HellionSingleMusic;
                    let res = await resolver.resolve(music);
                    if (!res) continue;
                    let k = { title: res.title, duration: res.duration, resolver: i, resolvable: res.resolvable, requestedBy: user };
                    return [k];
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
            if (!m)
                throw new Error("Abnormal null during resolver get");
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

    private startPlay(seek: number = 0): void {

    }

    public destroy(): void {
        this._destroyed = true;
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
}

/**
 * @deprecated string based loop types is deprecated since v1.2.0
 */
export type HellionMusicLoop = 'none' | 'queue' | 'music';

/**
 * @deprecated since v1.2.0
 */
export interface HellionPlayingNow {
    title: string;
    current: number;
    duration: number;
    requestedBy: string;
    pos: number;
}