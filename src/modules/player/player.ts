import { TextChannel, VoiceChannel } from "discord.js";
import { AudioPlayer, AudioPlayerStatus, createAudioPlayer, createAudioResource, DiscordGatewayAdapterCreator, joinVoiceChannel, VoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import { EventEmitter } from 'events';
import { HellionMusic, HellionMusicEnqueued, HellionMusicExtractor, HellionMusicLoader, HellionMusicPlayerOptions, HellionMusicSearcher, HellionMusicStream, HellionQueueLoop } from "./base";
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

    public playIndex: number;
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

        this.playIndex = 0;
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
        if (this.queue.length <= 0)
            return {
                title: "",
                requestedBy: "",
                duration: 0,
                current: 0,
                pos: 0
            };

        let time = 0;
        if (this._playing)
            time = ((!this._paused) ? Date.now() - this._lastPlayTime : 0) + this._accumulativeTime;

        return {
            title: this.queue[this.playIndex].title,
            requestedBy: this.queue[this.playIndex].user,
            duration: this.queue[this.playIndex].duration,
            current: time,
            pos: this.playIndex
        };
    }

    public get time(): number {
        let time = 0;
        if (this._playing)
            time = ((!this._paused) ? Date.now() - this._lastPlayTime : 0) + this._accumulativeTime;
        return time;
    }

    public async playNow(music: string, user: string): Promise<HellionMusicEnqueued> {
        let musics = await this.resolve(music, user);
        if (music.length == 0) throw new Error(`Music ${music} from ${user} has resolved to a empty array`);
        let position = this.queue.length;
        this.queue.splice(this.playIndex, 0, ...musics);
        if (!this._connection || !this._player)
            this.join();
        await this.start(this.playIndex, 0);
        return {
            items: musics,
            playing: true,
            position: position
        };
    }

    public async playNext(music: string, user: string): Promise<HellionMusicEnqueued> {
        let musics = await this.resolve(music, user);
        if (music.length == 0) throw new Error(`Music ${music} from ${user} has resolved to a empty array`);
        let position = this.queue.length;
        this.queue.splice(this.playIndex + 1, 0, ...musics);
        return {
            items: musics,
            playing: false,
            position: position
        };
    }

    public join(): void {
        if (this._connection) {
            this._connection.destroy();
            this._connection = null;
        }
        this._connection = joinVoiceChannel({
            channelId: this.voiceChannel.id,
            guildId: this.voiceChannel.guildId,
            adapterCreator: this.voiceChannel.guild.voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator
        })
            .on(VoiceConnectionStatus.Disconnected, () => {
                if (!this._destroyed) {
                    this.emit('disconnected');
                    this.destroy();
                }
            })
            .on(VoiceConnectionStatus.Destroyed, () => {
                if (!this._destroyed) {
                    this.emit('disconnected');
                    this.destroy();
                }
            })
            .on('error', (err) => {
                this.emit('error', err);
                this.destroy();
            });

        if (!this._player) {
            this._player = createAudioPlayer()
                .on(AudioPlayerStatus.Idle, () => {
                    this.next()
                })
                .on('error', (err) => {
                    this.emit('error', err);
                    this.next();
                });
        }
        this._connection.subscribe(this._player);
        this.emit('ready');
    }

    public async play(music: string, user: string): Promise<HellionMusicEnqueued> {
        let musics = await this.resolve(music, user);
        if (musics.length == 0) throw new Error(`Music ${music} from ${user} has resolved to a empty array`);
        let position = this.queue.length;
        this.queue.push(...musics);
        let playing = false;
        if (!this._connection || !this._player) {
            this.join();
            playing = true;
            await this.start(this.playIndex, 0);
        }
        return {
            items: musics,
            playing: playing,
            position: position
        };
    }

    public async seek(seek: number): Promise<void> {
        if (this._paused) {
            await this.start(this.playIndex, seek);
            this.pause();
        } else {
            await this.start(this.playIndex, seek);
        }
    }

    public async goto(index: number): Promise<HellionMusic> {
        if (index < 0 && index >= this.queue.length)
            throw new RangeError("Index out of bounds");
        this.playIndex = index;
        await this.start(index, 0);
        return this.queue[index];
    }

    public pause(): void {
        if (this._player && this._playing) {
            if (this._player.pause()) {
                this._accumulativeTime += Date.now() - this._accumulativeTime;
                this._paused = true;
            }
        } else if (!this._playing) {
            this._paused = true;
        }
    }

    public resume(): void {
        if (this._player && this._playing) {
            if (this._player.unpause()) {
                this._lastPlayTime = Date.now();
                this._paused = false;
            }
        } else if (!this._playing && this._paused) {
            this.start(this.playIndex, 0);
            this._paused = false;
        }
    }

    public async skip(): Promise<HellionMusic | null> {
        let result: HellionMusic | null = null;

        if (this.playIndex >= this.queue.length - 1 && this.loop == HellionQueueLoop.Queue)
            result = this.queue[0];
        else if (this.playIndex < this.queue.length - 1 && this.loop != HellionQueueLoop.Queue)
            result = this.queue[this.playIndex + 1];

        let loop = this.loop;
        if (this.loop == HellionQueueLoop.NoAutoplay || this.loop == HellionQueueLoop.Music)
            this.loop = HellionQueueLoop.None;
        await this.next();
        this.loop = loop;

        return result;
    }

    public shuffle(): void {
        let music = this.queue.splice(this.playIndex, 1);
        for (var i = this.queue.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = this.queue[i];
            this.queue[i] = this.queue[j];
            this.queue[j] = temp;
        }
        this.queue.splice(0, 0, ...music);
        this.playIndex = 0;
    }

    public async remove(index: number): Promise<HellionMusic | null> {
        if (index < 0 && this.playIndex >= this.queue.length)
            return null;

        let music = this.queue[index];

        this.queue.splice(index, 1);

        if (this.queue.length <= 0) {
            this.pause();
            this._playing = false;
        } else if (this.playIndex == index) {
            if (this.loop != HellionQueueLoop.Music)
                this.playIndex--;
            await this.next();
        } else if (this.playIndex > index)
            this.playIndex--;

        return music;
    }

    public async resolve(music: string, user: string): Promise<HellionMusic[]> {
        try {
            return await this.load(music, user);
        } catch (e) {
            this.emit('error', new Error(`All Loaders: '${music}' from '${user}' has throwed a error`, { cause: e }));
        }
        try {
            return await this.search(music, user, 1);
        } catch (e) {
            this.emit('error', new Error(`All Searchers: '${music}' from '${user}' has throwed a error`, { cause: e }));
        }
        throw new Error(`Can't resolve the music ${music} from ${user}`);
    }

    public async load(music: string, user: string): Promise<HellionMusic[]> {
        for (let i = 0; i < this.loaders.length; i++) {
            try {
                let result = await this.loaders[i].load(music, user);
                if (result.length == 0) continue;
                return result;
            } catch (e) {
                this.emit('error', new Error(`Loader '${i}': '${music}' from '${user}' has throwed a error`, { cause: e }));
            }
        }
        throw new Error(`None of the Loaders were able to load the music ${music} from ${user}`);
    }

    public async search(music: string, user: string, limit: number = 1): Promise<HellionMusic[]> {
        for (let i = 0; i < this.searchers.length; i++) {
            try {
                let result = await this.searchers[i].search(music, user);
                if (result.length == 0) continue;
                return result;
            } catch (e) {
                this.emit('error', new Error(`Searcher '${i}': '${music}' from '${user}' has throwed a error`, { cause: e }));
            }
        }
        throw new Error(`None of the Searchers were able to load the music ${music} from ${user}`);
    }

    public async extract(music: HellionMusic, seek: number = 0): Promise<HellionMusicStream> {
        for (let i = 0; i < this.extractors.length; i++) {
            try {
                let extractor = this.extractors[i];
                if (extractor.extractor != music.extractor) continue;
                return await extractor.get(music.url, seek);
            } catch (e) {
                this.emit('error', new Error(`Extractor '${i}': '${music.url}' for '${music.extractor}' has throwed a error`, { cause: e }));
            }
        }
        throw new Error(`Can't find the extractor for '${music.extractor}'`);
    }

    private async next(): Promise<void> {
        if (!this._connection || !this._player) {
            this.destroy();
            return;
        }

        if (this.queue.length <= 0) {
            this.playIndex = 0;
            this.pause();
            this._playing = false;
            return;
        }

        if (this.loop != HellionQueueLoop.Music)
            this.playIndex++;

        if (this.playIndex < 0)
            this.playIndex = this.queue.length - 1;

        if (this.playIndex >= this.queue.length) {
            this.playIndex = 0;

            if (this.loop != HellionQueueLoop.Queue) {
                this.pause();
                this._playing = false;
                return;
            }
        }
        if (this.loop == HellionQueueLoop.NoAutoplay) {
            this.pause();
            this._playing = false;
            return;
        }

        if (!this._paused) {
            let music = this.queue[this.playIndex];
            this.emit('play', music);
            await this.start(this.playIndex, 0);
        }
    }

    private start(index: number, seek: number = 0): Promise<void> {
        return new Promise((resolve) => {
            this.extract(this.queue[index], seek)
                .then((m) => {
                    if (this._player != null) {
                        let resource = createAudioResource(m.stream, { inputType: m.type });
                        this._player.play(resource);
                        this._accumulativeTime = seek * 1000;
                        this._lastPlayTime = Date.now();
                        this._paused = false;
                        this._playing = true;
                    }

                    resolve();
                })
                .catch(async (e) => {
                    await this.next();
                    this.emit('error', new Error("Can't start the Music Player", { cause: e }));

                    resolve();
                })
        });
    }

    public destroy(): void {
        this._destroyed = true;
        this._playing = false;
        this._paused = false;
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