import { exec } from "youtube-dl-exec";
import { HellionMusicResolver } from "..";
import { HellionMusicResolved } from "../player";
import { Readable } from 'stream';
import ytpl from "ytpl";

export class HellionYtplResolver extends HellionMusicResolver
{
    constructor()
    {
        super();
        this.isBulk = true;
    }

    public async bulk(resolvable: string): Promise<HellionMusicResolved[]> {
        if (!ytpl.validateID(resolvable)) return null;
        let pl = await ytpl(resolvable, { limit: Infinity });
        let res: HellionMusicResolved[] = [];
        for (let item of pl.items)
        {
            res.push({ title: item.title, resolvable: item.url })
        }
        return res;
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