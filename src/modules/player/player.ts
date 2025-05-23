import { GuildMember, Message, TextBasedChannel, TextChannel, VoiceBasedChannel, VoiceChannel } from "discord.js";
import { AudioPlayer, AudioPlayerStatus, createAudioPlayer, createAudioResource, DiscordGatewayAdapterCreator, entersState, joinVoiceChannel, StreamType, VoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
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

    on(event: 'disconnected', listener: () => void): this;
    once(event: 'disconnected', listener: () => void): this;

    on(event: 'reconnecting', listener: () => void): this;
    once(event: 'reconnecting', listener: () => void): this;

    on(event: 'end', listener: () => void): this;
    once(event: 'end', listener: () => void): this;
}

export class HellionMusicPlayer extends EventEmitter {
    public voiceChannel: VoiceBasedChannel;
    public textChannel: TextBasedChannel;

    public emptyCallTimer?: NodeJS.Timeout | null;
    public lastNowPlatingMsg?: Message | null;

    private _playingNow: number;
    private _queue: HellionQueuedMusic[];
    private _connection: VoiceConnection | null;
    private _player: AudioPlayer | null;
    private _resolver: HellionMusicResolver[];
    private _loop: HellionMusicLoop;

    private _lastTime: number;
    private _playingTime: number;
    private _paused: boolean;
    private _destroyed: boolean;

    constructor(voiceChannel: VoiceChannel, textChannel: TextChannel) {
        super();
        this.voiceChannel = voiceChannel;
        this.textChannel = textChannel;

        this.emptyCallTimer = null;

        this._playingNow = 0;
        this._queue = [];
        this._connection = null;
        this._player = null;
        this._resolver = [];
        this._loop = 'none';

        this._destroyed = false;
    }

    public addResolver(resolver: HellionMusicResolver): number {
        return this._resolver.push(resolver) - 1;
    }

    public getResolver(index: number): HellionMusicResolver {
        return this._resolver[index];
    }

    public delResolver(index: number): HellionMusicResolver {
        let resolver = this._resolver[index];
        delete this._resolver[index];
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
            result.push({ title: item.title, requestedBy: item.requestedBy, duration: item.duration, user: item.user });
        return result;
    }

    public nowPlaying(): HellionPlayingNow {
        return {
            title: this._queue[this._playingNow].title,
            requestedBy: this._queue[this._playingNow].requestedBy,
            user: this._queue[this._playingNow].user,
            duration: this._queue[this._playingNow].duration,
            current: ((!this._paused) ? Date.now() - this._lastTime : 0) + this._playingTime,
            pos: this._playingNow
        };
    }

    public async playNow(music: string, user: GuildMember | string): Promise<HellionPlayResult> {
        let username = "";
        let userobj: GuildMember | null = null;

        if (user instanceof GuildMember) {
            username = user.nickname || user.user.username;
            userobj = user;
        } else {
            username = user;
        }

        let musics = await this.resolve(music, username, userobj);
        if (musics.length <= 0) throw new Error("Resolve returned a empty array");
        this._queue.splice(this._playingNow + 1, 0, ...musics);
        this.skip();
        return { title: musics[0].title, count: musics.length, playing: true, pos: this._playingNow, requestedBy: musics[0].requestedBy, user: musics[0].user };
    }

    public join(): void {
        if (this._connection)
            this._connection.destroy();
        this._connection = joinVoiceChannel({
            channelId: this.voiceChannel.id,
            guildId: this.voiceChannel.guildId,
            adapterCreator: this.voiceChannel.guild.voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator
        })
            .on(VoiceConnectionStatus.Disconnected, async () => {
                try {
                    if (this._connection) {
                        await Promise.race([
                            entersState(this._connection, VoiceConnectionStatus.Signalling, 5000),
                            entersState(this._connection, VoiceConnectionStatus.Connecting, 5000),
                        ]);

                        this.emit('reconnecting');
                    }

                } catch (error) {
                    if (!this._destroyed) {
                        this.emit('disconnected');
                        this.destroy();
                    }
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
        /**.on('stateChange', (oldState, newState) => {
            // This is a fix from the play-dl community to fix the song not playing in full.
            const oldNetworking = Reflect.get(oldState, 'networking');
            const newNetworking = Reflect.get(newState, 'networking');

            const networkStateChangeHandler = (_oldNetworkState: any, newNetworkState: any) => {
                const newUdp = Reflect.get(newNetworkState, 'udp');
                clearInterval(newUdp?.keepAliveInterval);
            }

            oldNetworking?.off('stateChange', networkStateChangeHandler);
            newNetworking?.on('stateChange', networkStateChangeHandler);
        });*/
        this.emit('ready');
    }

    public async play(music: string, user: GuildMember | string): Promise<HellionPlayResult> {
        if (!this._connection)
            this.join();

        let username = "";
        let userobj: GuildMember | null = null;

        if (user instanceof GuildMember) {
            username = user.nickname || user.user.username;
            userobj = user;
        } else {
            username = user;
        }

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
            let musics = await this.resolve(music, username, userobj);
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
            return { playing: playingNow, title: this._queue[pos].title, requestedBy: userobj, user: username, count: musics.length, pos: pos };
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
                res({ title: music.title, requestedBy: music.requestedBy, user: music.user, duration: music.duration });
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
                    res({ title: music.title, requestedBy: music.requestedBy, user: music.user, duration: music.duration });
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
        if (this._queue.length == 1 || (index < 0 && index >= this._queue.length))
            return null;
        let music = this._queue[index];
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

    private async resolve(music: string, username: string, userobj: GuildMember | null): Promise<HellionQueuedMusic[]> {
        for (let i = 0; i < this._resolver.length; i++) {
            try {
                if (this._resolver[i] instanceof HellionBulkMusic) {
                    let resolver = this._resolver[i] as HellionBulkMusic;
                    let res = await resolver.bulk(music);
                    if (!res) continue;
                    let result: HellionQueuedMusic[] = [];
                    for (let d of res) {
                        let k = { title: d.title, duration: d.duration, resolver: i, resolvable: d.resolvable, requestedBy: userobj, user: username };
                        result.push(k);
                    };
                    return result;
                }
                else {
                    let resolver = this._resolver[i] as HellionSingleMusic;
                    let res = await resolver.resolve(music);
                    if (!res) continue;
                    let k = { title: res.title, duration: res.duration, resolver: i, resolvable: res.resolvable, requestedBy: userobj, user: username };
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
            this.emit('play', { title: music.title, requestedBy: music.requestedBy, user: music.user, duration: music.duration });
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
            this.emit('queueError', { title: music.title, requestedBy: music.requestedBy, user: music.user, duration: music.duration }, e);
        }
    }
}

export class HellionSingleMusic {
    public async resolve(music: string): Promise<HellionMusicResolved | null> {
        throw new Error("Method not implemented");
    }

    public async get(resolvable: string, seek?: number): Promise<HellionMusicStream | null> {
        throw new Error("Method not implemented");
    }
}

export class HellionBulkMusic {
    public async bulk(music: string): Promise<HellionMusicResolved[] | null> {
        throw new Error("Method not implemented");
    }

    public async get(resolvable: string, seek?: number): Promise<HellionMusicStream | null> {
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
    requestedBy?: GuildMember | null;
    user: string;
}

export interface HellionQueuedMusic {
    title: string;
    resolver: number;
    duration: number;
    resolvable: string;
    requestedBy?: GuildMember | null;
    user: string;
}

export interface HellionPlayingNow {
    title: string;
    current: number;
    duration: number;
    requestedBy?: GuildMember | null;
    user: string;
    pos: number;
}

export interface HellionPlayResult {
    title: string;
    playing: boolean;
    pos: number;
    requestedBy?: GuildMember | null;
    user: string;
    count: number;
}

export type HellionMusicLoop = 'none' | 'queue' | 'music';