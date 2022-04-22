exports.run = (client, message, args, ext) => {
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

    data.player.stop();

    message.channel.send("Skipped the current music.");
};

exports.command = {
    names: [ "skip", "s" ],
    description: "Skip the current music."
};