import { exec } from "youtube-dl-exec";
import { HellionMusicResolver } from "..";
import { HellionMusicResolved } from "../player";
import { Readable } from 'stream';
import ytsr, { Video } from "ytsr";

export class HellionYtsrResolver extends HellionMusicResolver
{
    constructor()
    {
        super();
        this.isBulk = false;
    }

    public async resolve(music: string): Promise<HellionMusicResolved> {
        try
        {
            let item = (await ytsr((await ytsr.getFilters(music)).get('Type').get('Video').url, { limit: 1})).items[0] as Video;
            return { title: item.title, resolvable: item.url };
        }
        catch (e)
        {
            return null;
        }
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