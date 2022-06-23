import { Readable } from "stream";

export enum HellionQueueLoop {
    None = "none",
    Music = "music",
    Queue = "queue",
    NoAutoplay = "noautoplay"
}

export interface HellionMusic {
    title: string;
    author: string;
    duration: number;
    user: string;
    url: string;
    extractor: string;
}

export interface HellionMusicEnqueued {
    items: HellionMusic[]
    position: number;
    playing: boolean;
}

export interface HellionMusicStream {
    stream: Readable;
    type?: any | null;
}

export class HellionMusicExtractor {
    public extractor: string;

    constructor(extractor: string) {
        this.extractor = extractor;
    }

    public async get(resolvable: string, seek: number = 0): Promise<HellionMusicStream> {
        throw new Error("Not implemented");
    }
}

export class HellionMusicLoader {
    public extractor: string;

    constructor(extractor: string) {
        this.extractor = extractor;
    }

    public async load(arg: string, user: string): Promise<HellionMusic[]> {
        throw new Error("Not implemented");
    }
}

export class HellionMusicSearcher {
    public extractor: string;

    constructor(extractor: string) {
        this.extractor = extractor;
    }

    public async search(arg: string, user: string, limit: number = 1): Promise<HellionMusic[]> {
        throw new Error("Not implemented");
    }
}