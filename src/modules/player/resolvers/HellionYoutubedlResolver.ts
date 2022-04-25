import { exec } from 'youtube-dl-exec';
import ytdl from 'ytdl-core';
import { HellionMusicResolver } from "..";
import { HellionMusicResolved } from "../player";
import { Readable } from 'stream';

export class HellionYoutubedlResolver extends HellionMusicResolver
{
    constructor()
    {
        super();
        this.isBulk = false;
    }

    public async resolve(music: string): Promise<HellionMusicResolved> {
        if (!ytdl.validateURL(music)) return null;
        let info = await ytdl.getBasicInfo(music);
        return { title: info.videoDetails.title, resolvable: music };
    }

    public async get(resolvable: string): Promise<Readable> {
        return new Promise<Readable>((res) => {
            const stream = exec(resolvable, {
                output: "-",
                quiet: true,
                noPlaylist: true,
                format: "bestaudio"
            }, { stdio: ["ignore", "pipe", "ignore"] });
    
            stream.on("spawn", () => {
                res(stream.stdout);
            });
        });
    }
}