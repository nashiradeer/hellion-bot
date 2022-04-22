export function run(client, message, args, ext) {
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

    if (args.length == 0)
    {
        message.channel.send("Invalid argument, please use: 'music', 'm', 'queue', 'q', 'none', 'n'");
        return;
    }

    switch (args[0].toLowerCase())
    {
        case "music":
        case "m":
            data.loop = 1;
            ext.musicdata.set(message.guild.id, data);
            message.channel.send("Queue loop is now 'music'.");
            break;
        case "queue":
        case "q":
            data.loop = 2;
            ext.musicdata.set(message.guild.id, data);
            message.channel.send("Queue loop is now 'queue'.");
            break;
        case "none":
        case "n":
            data.loop = 0;
            ext.musicdata.set(message.guild.id, data);
            message.channel.send("Queue loop is now 'none'.");
            break;
        default:
            message.channel.send("Invalid argument, please use: 'music', 'm', 'queue', 'q', 'none', 'n'");
            break;
    }
};

export var command = {
    names: [ "loop" ],
    description: "Place playlist on a loop."
};