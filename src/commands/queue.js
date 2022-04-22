module.exports = {
    run: (client, message, args, ext) => {
        var data = ext.musicdata.get(message.guild.id);

        if (!data)
        {
            message.channel.send("I aren't playing anything.");
            return;
        }

        var msg = "";

        var offset = 0;
        if (args.length != 0 && !isNaN(parseInt(args[0])))
            offset = 10 * (parseInt(args[0]) - 1);

        var limit = data.queue.length;
        if (offset + 11 < limit)
            limit = offset + 11;

        for(var i = offset; i < limit; i++)
            msg += "**[" + i + "]** " + data.queue[i].title + " (" + data.queue[i].owner.user.tag + ")\n";

        if (msg == "") return;
        message.channel.send(msg.slice(0, 2000));
    },
    command: {
        names: [ "queue", "q" ],
        description: "Show the music in the queue."
    }
}