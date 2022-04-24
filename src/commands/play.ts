import * as Discord from 'discord.js';
import * as DiscordVoice from '@discordjs/voice';
import ytdl from 'ytdl-core';
import ytpl from 'ytpl';
import ytsr from 'ytsr';

import { commandHandler, discord } from '..';

export class HellionCommand extends commandHandler.HellionCommandListener
{
    
    constructor()
    {
        super();

        this.name = "play";
        this.alias = [ "p" ];
        this.description = "Start or resume a player.";
        this.usage = [ 
            {
                name: "music",
                description: "A URL or search term",
                required: false,
                type: 'STRING'
            }
        ];
    }
    
    public async run(client: Discord.Client, event: commandHandler.HellionCommandEvent, ext: discord.HellionWardenData)
    {
        if (!(event.member as Discord.GuildMember).voice.channel)
        {
            event.channel.send("You aren't in a voice chat.");
            return;
        }
        
        var data = ext.musicdata.get(event.guild.id);

        if (!data)
        {
            let voiceconn = DiscordVoice.joinVoiceChannel({
                channelId: (event.member as Discord.GuildMember).voice.channel.id,
                guildId: (event.member as Discord.GuildMember).voice.channel.guild.id,
                adapterCreator: (event.member as Discord.GuildMember).voice.channel.guild.voiceAdapterCreator as unknown as DiscordVoice.DiscordGatewayAdapterCreator
            });

            data = {
                guild: (event.member as Discord.GuildMember).voice.channel.guild,
                channel: (event.member as Discord.GuildMember).voice.channel,
                text: event.channel,
                connection: voiceconn,
                queue: [],
                loop: 0,
                np: 0,
                player: null
            };

            ext.musicdata.set(event.guild.id, data);
        }
        else
        {
            if ((event.member as Discord.GuildMember).voice.channel.id != data.channel.id)
            {
                event.channel.send("You aren't in a chat with me playing.");
                return;
            }
        }

        if (Object.keys(event.args).length)
        {
            if (data.player)
            {
                data.player.unpause();
                event.channel.send("Player unpaused.");
            }

            return;
        }

        let mlink = Object.values(event.args).join(' ');

        if (ytdl.validateURL(mlink))
        {
            let video = {
                title: (await ytdl.getBasicInfo(mlink)).videoDetails.title,
                owner: event.member,
                url:  mlink
            };

            data.queue.push(video);

            event.channel.send("Added '" + video.title + "' from '" + (video.owner.user as Discord.User).tag + "' to queue.");
        }
        else if (ytpl.validateID(mlink))
        {
            var size = 0;

            for (let item of (await ytpl(mlink, { limit: Infinity })).items)
            {
                data.queue.push({
                    title: item.title,
                    owner: event.member,
                    url:  item.url
                });
                size++;
            }

            event.channel.send("Added '" + size + "' musics from '" + event.user.tag + "' to queue.");
        }
        else
        {
            let item = await (await ytsr.getFilters(mlink)).get('Type').get('Video');

            if (!item)
            {
                event.channel.send("I can't found any video with this name.");
                return;
            }

            let video = {
                title: item.name,
                owner: event.member,
                url:  item.url
            };

            data.queue.push(video);

            event.channel.send("Added '" + video.title + "' from '" + (video.owner.user as Discord.User).tag + "' to queue.");
        }

        ext.musicdata.set(event.guild.id, data);

        if (!data.player)
        {
            let data = ext.musicdata.get(event.guild.id);

            data.player = DiscordVoice.createAudioPlayer();
            data.connection.subscribe(data.player);
            
            ext.musicdata.set(event.guild.id, data);

            event.channel.send("Playing: " + data.queue[data.np].title + " [" + data.queue[data.np].owner.user.tag + "]");
            data.player.play(DiscordVoice.createAudioResource(ytdl(data.queue[data.np].url, { filter: 'audioonly', quality: 'highestaudio', highWaterMark: 1<<20 })));
            
            data.player.on(DiscordVoice.AudioPlayerStatus.Idle, () => continuePlaying(ext, event.guild.id));
            data.player.on('error', (err) => {
                console.error(err);
                continuePlaying(ext, event.guild.id)
            });
        }
    }
}

function continuePlaying(ext, guildId)
{
    let data = ext.musicdata.get(guildId);
    if (!data) return;

    if (data.loop != 1) data.np++;
    if (data.np >= data.queue.length)
    {
        if (data.loop != 2)
        {
            data.player.stop();
            data.connection.destroy();
            ext.musicdata.delete(data.guild.id);
            return;
        }
        else
        {
            data.np = 0;
        }
    }
    ext.musicdata.set(guildId, data);

    data.text.send("Playing: " + data.queue[data.np].title + " [" + data.queue[data.np].owner.user.tag + "]");
    data.player.play(DiscordVoice.createAudioResource(ytdl(data.queue[data.np].url, { filter: 'audioonly', quality: 'highestaudio', highWaterMark: 1<<20  })));
}