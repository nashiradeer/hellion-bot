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

    let n = parseInt(args[0]);

    if (args.length == 0 || isNaN(n))
    {
        message.channel.send("Invalid queue number, use 'queue' to see the queue.");
        return;
    }

    if (data.queue.length < parseInt(n) || 0 >= parseInt(n))
    {
        message.channel.send("Invalid queue number, use 'queue' to see the queue.");
        return;
    }
        
    let music = data.queue[n - 1];

    data.queue.splice(n - 1, 1);
    message.channel.send("Removed from the queue '" + music.title + "' (" + music.owner.user.tag + ")");
};

exports.command = {
    names: [ "remove", "rm" ],
    description: "Remove a music from the queue."
};