import { inlineCode } from '@discordjs/builders';
import { stream, yt_validate, video_basic_info, playlist_info, SoundCloudPlaylist, so_validate, soundcloud, search } from 'play-dl';
import { HellionMusicResolved, HellionSingleMusic, HellionBulkMusic, HellionMusicStream } from "..";

export class HellionYTDLResolver extends HellionSingleMusic {
    public async resolve(music: string): Promise<HellionMusicResolved> {
        if (yt_validate(music) != "video")
            return null;
        let info = await video_basic_info(music);
        return { title: info.video_details.title, resolvable: music, duration: info.video_details.durationInSec * 1000 };
    }

    public async get(resolvable: string, seek?: number): Promise<HellionMusicStream> {
        let ytvideo = await stream(resolvable, { seek: seek });
        return { stream: ytvideo.stream, type: ytvideo.type };
    }
}

export class HellionYTPLResolver extends HellionBulkMusic {
    public async bulk(music: string): Promise<HellionMusicResolved[]> {
        if (yt_validate(music) != "playlist")
            return null;
        let pl = await playlist_info(music, { incomplete: true });
        let res: HellionMusicResolved[] = [];
        for (let item of await pl.all_videos()) {
            res.push({ title: item.title, resolvable: item.url, duration: item.durationInSec * 1000 })
        }
        return res;
    }

    public async get(resolvable: string, seek?: number): Promise<HellionMusicStream> {
        let ytvideo = await stream(resolvable, { seek: seek });
        return { stream: ytvideo.stream, type: ytvideo.type };
    }
}

export class HellionYTSRResolver extends HellionSingleMusic {
    public async resolve(music: string): Promise<HellionMusicResolved> {
        let info = await search(music, { source: { youtube: 'video' }, limit: 1 });
        if (info.length == 0)
            return null;
        return { title: info[0].title, resolvable: info[0].url, duration: info[0].durationInSec * 1000 };
    }

    public async get(resolvable: string, seek?: number): Promise<HellionMusicStream> {
        let ytvideo = await stream(resolvable, { seek: seek });
        return { stream: ytvideo.stream, type: ytvideo.type };
    }
}

export class HellionSODLResolver extends HellionSingleMusic {
    public async resolve(music: string): Promise<HellionMusicResolved> {
        if (await so_validate(music) != "track")
            return null;
        let info = await soundcloud(music);
        return { title: info.name, resolvable: info.url, duration: info.durationInMs };
    }

    public async get(resolvable: string, seek?: number): Promise<HellionMusicStream> {
        let sotrack = await stream(resolvable, { seek: seek });
        return { stream: sotrack.stream, type: sotrack.type };
    }
}

export class HellionSOPLResolver extends HellionBulkMusic {
    public async bulk(music: string): Promise<HellionMusicResolved[]> {
        if (await so_validate(music) != "playlist")
            return null;
        let pl = await soundcloud(music) as SoundCloudPlaylist;
        let res: HellionMusicResolved[] = [];
        for (let item of await pl.all_tracks()) {
            res.push({ title: item.name, resolvable: item.url, duration: item.durationInMs })
        }
        return res;
    }

    public async get(resolvable: string, seek?: number): Promise<HellionMusicStream> {
        let sotrack = await stream(resolvable, { seek: seek });
        return { stream: sotrack.stream, type: sotrack.type };
    }
}