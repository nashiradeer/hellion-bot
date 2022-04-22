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

    shuffleArray(data.queue);
    ext.musicdata.set(message.guild.id, data);

    message.channel.send("Queue items are now in a random order.");
};

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

exports.command = {
    names: [ "shuffle" ],
    description: "Shuffle the queue."
};