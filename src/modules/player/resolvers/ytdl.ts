import { HellionMusicResolved, HellionSingleMusic, HellionBulkMusic, HellionMusicStream } from "..";
import ytpl from "ytpl";
import ytsr from "ytsr";
import ytdl from "ytdl-core";

export class HellionYTDLResolver extends HellionSingleMusic
{
    public async resolve(music: string): Promise<HellionMusicResolved>
    {
        if (!ytdl.validateURL(music)) return null;
        let info = await ytdl.getBasicInfo(music);
        return { title: info.videoDetails.title, resolvable: music };
    }

    public async get(resolvable: string, seek?: number): Promise<HellionMusicStream>
    {
        return { stream: ytdl(resolvable, { begin: seek, quality: 'highestaudio', filter: 'audioonly' }) };
    }
}

export class HellionYTPLResolver extends HellionBulkMusic
{
    public async bulk(resolvable: string): Promise<HellionMusicResolved[]>
    {
        if (!ytpl.validateID(resolvable)) return null;
        let pl = await ytpl(resolvable, { limit: Infinity });
        let res: HellionMusicResolved[] = [];
        for (let item of pl.items)
        {
            res.push({ title: item.title, resolvable: item.url })
        }
        return res;
    }

    public async get(resolvable: string, seek?: number): Promise<HellionMusicStream>
    {
        return { stream: ytdl(resolvable, { begin: seek, quality: 'highestaudio', filter: 'audioonly' }) };
    }
}

export class HellionYTSRResolver extends HellionSingleMusic
{
    public async resolve(music: string): Promise<HellionMusicResolved>
    {
        let item = (await ytsr((await ytsr.getFilters(music)).get('Type').get('Video').url, { limit: 1})).items[0] as ytsr.Video;
        return { title: item.title, resolvable: item.url };
    }

    public async get(resolvable: string, seek?: number): Promise<HellionMusicStream>
    {
        return { stream: ytdl(resolvable, { begin: seek, quality: 'highestaudio', filter: 'audioonly' }) };
    }
}