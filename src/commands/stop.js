module.exports = {
    run: (client, message, args, ext) => {
        if (!message.member.voice.channel)
        {
            message.channel.send("You aren't in a voice chat.");
            return;
        }

        var data = ext.musicdata.get(message.guild.id);

        if (!data)
        {
            message.channel.send("I aren't playing anything.");
            return;
        }

        if (message.member.voice.channel.id != data.channel.id)
        {
            message.channel.send("You aren't in a chat with me playing.");
            return;
        }

        data.queue = [];
        ext.musicdata.set(message.guild.id, data);

        data.player.stop();
        message.channel.send("Stopped the player.");
        return;
    },
    command: {
        names: [ "stop", "leave", "quit", "disconnect" ],
        description: "Stop the player and forces the bot to exit."
    }
}