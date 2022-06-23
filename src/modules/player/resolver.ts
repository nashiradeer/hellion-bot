import { HellionMusic, HellionMusicExtractor, HellionMusicLoader, HellionMusicStream } from "./base";

export class HellionResolverExtractorAdapter extends HellionMusicExtractor {
    public resolver: HellionMusicResolver;

    constructor(extractor: string, resolver: HellionMusicResolver) {
        super(extractor);
        this.resolver = resolver;
    }

    public async get(resolvable: string, seek: number = 0): Promise<HellionMusicStream> {
        let music = await this.resolver.get(resolvable, seek);
        if (!music) throw new Error("Resolver has returned null");
        return music;
    }
}

export class HellionResolverLoaderAdapter extends HellionMusicLoader {
    public resolver: HellionMusicResolver;

    constructor(extractor: string, resolver: HellionMusicResolver) {
        super(extractor);
        this.resolver = resolver;
    }

    public async load(arg: string, user: string): Promise<HellionMusic[]> {
        if (this.resolver instanceof HellionSingleMusic) {
            let music = await this.resolver.resolve(arg);
            if (!music) return [];
            else return [resolved2music(this.extractor, user, music)];
        } else {
            let musics = await this.resolver.bulk(arg);
            if (!musics) return [];
            let nam: HellionMusic[] = [];
            for (let item of musics)
                nam.push(resolved2music(this.extractor, user, item));
            return nam;
        }
    }
}

export function resolved2music(extractor: string, user: string, music: HellionMusicResolved): HellionMusic {
    return {
        title: music.title,
        author: "",
        duration: music.duration,
        extractor: extractor,
        url: music.resolvable,
        user: user
    };
}

/**
 * @deprecated resolver API is deprecated since v1.2.0
 */
export interface HellionMusicResolved {
    title: string;
    duration: number;
    resolvable: string;
}


/**
 * @deprecated resolver API is deprecated since v1.2.0
 */
export class HellionSingleMusic {
    public async resolve(music: string): Promise<HellionMusicResolved | null> {
        throw new Error("Method not implemented");
    }

    public async get(resolvable: string, seek?: number): Promise<HellionMusicStream | null> {
        throw new Error("Method not implemented");
    }
}

/**
 * @deprecated resolver API is deprecated since v1.2.0
 */
export class HellionBulkMusic {
    public async bulk(music: string): Promise<HellionMusicResolved[] | null> {
        throw new Error("Method not implemented");
    }

    public async get(resolvable: string, seek?: number): Promise<HellionMusicStream | null> {
        throw new Error("Method not implemented");
    }
}

/**
 * @deprecated resolver API is deprecated since v1.2.0
 */
export type HellionMusicResolver = HellionBulkMusic | HellionSingleMusic;