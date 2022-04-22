const Discord = require('discord.js');
const DiscordVoice = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const ytsr = require('ytsr');

/**
 * @param {Discord.Client} client
 * @param {Discord.Message} message
 * @param {Array<string>} args
 * @param {import('../index').BotExtension} ext
 */
exports.run = async (client, message, args, ext) => {
    if (!message.member.voice.channel)
    {
        message.channel.send("You aren't in a voice chat.");
        return;
    }
    
    var data = ext.musicdata.get(message.guild.id);

    if (!data)
    {
        let voiceconn = DiscordVoice.joinVoiceChannel({
            channelId: message.member.voice.channel.id,
            guildId: message.member.voice.channel.guild.id,
            adapterCreator: message.member.voice.channel.guild.voiceAdapterCreator
        });

        data = {
            guild: message.member.voice.channel.guild,
            channel: message.member.voice.channel,
            text: message.channel,
            connection: voiceconn,
            queue: [],
            loop: 0,
            np: 0,
            player: null
        };

        ext.musicdata.set(message.guild.id, data);
    }
    else
    {
        if (message.member.voice.channel.id != data.channel.id)
        {
            message.channel.send("You aren't in a chat with me playing.");
            return;
        }
    }

    if (args.length == 0)
    {
        if (data.player)
        {
            data.player.unpause();
            message.channel.send("Player unpaused.");
        }

        return;
    }

    let mlink = args.join(' ');

    if (ytdl.validateURL(mlink))
    {
        let video = {
            title: (await ytdl.getBasicInfo(mlink)).videoDetails.title,
            owner: message.member,
            url:  mlink
        };

        data.queue.push(video);

        message.channel.send("Added '" + video.title + "' from '" + video.owner.user.tag + "' to queue.");
    }
    else if (ytpl.validateID(mlink))
    {
        var size = 0;

        for (let item of (await ytpl(mlink, { limit: Infinity })).items)
        {
            data.queue.push({
                title: item.title,
                owner: message.member,
                url:  item.url
            });
            size++;
        }

        message.channel.send("Added '" + size + "' musics from '" + message.author.tag + "' to queue.");
    }
    else
    {
        let item = await ytsr(mlink, { limit: 1 });

        if (item.items.length == 0)
        {
            message.channel.send("I can't found any video with this name.");
            return;
        }

        let video = {
            title: (await ytdl.getBasicInfo(item.items[0].url)).videoDetails.title,
            owner: message.member,
            url:  item.items[0].url
        };

        data.queue.push(video);

        message.channel.send("Added '" + video.title + "' from '" + video.owner.user.tag + "' to queue.");
    }

    ext.musicdata.set(message.guild.id, data);

    if (!data.player)
    {
        let data = ext.musicdata.get(message.guild.id);

        data.player = DiscordVoice.createAudioPlayer();
        data.connection.subscribe(data.player);
        
        ext.musicdata.set(message.guild.id, data);

        message.channel.send("Playing: " + data.queue[data.np].title + " [" + data.queue[data.np].owner.user.tag + "]");
        data.player.play(DiscordVoice.createAudioResource(ytdl(data.queue[data.np].url, { filter: 'audioonly', quality: 'highestaudio', highWaterMark: 1<<20 })));
        
        data.player.on(DiscordVoice.AudioPlayerStatus.Idle, () => continuePlaying(ext, message.guild.id));
        data.player.on('error', (err) => {
            console.error(err);
            continuePlaying(ext, message.guild.id)
        });
    }
};

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

exports.command = {
    names: [ "play", "p" ],
    description: "Start or resume a player."
};