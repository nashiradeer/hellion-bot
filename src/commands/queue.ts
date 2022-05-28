import { GuildMember, MessageEmbed } from "discord.js";
import { commandHandler, discord } from "..";

export class HellionCommand extends commandHandler.HellionCommandListener {
    constructor() {
        super();
        this.name = "queue";
        this.category = "Music";
        this.description = "Show the Music Player queue.";
        this.alias = ["q"];
        this.usage = [
            {
                name: "page",
                index: 0,
                description: "Queue page number.",
                required: false,
                type: 'NUMBER'
            }
        ];
    }

    public async run(event: commandHandler.HellionCommandEvent, data: any): Promise<void> {
        let member = event.member as GuildMember;
        if (!member.voice.channel) {
            event.reply({
                fetchEdit: true,
                embeds: [
                    new MessageEmbed()
                        .setColor(0xff0000)
                        .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                        .setTitle("Hellion Warden // Queue")
                        .setDescription("You aren't in a voice channel.")
                ]
            });
            return;
        }

        let music = (data as discord.HellionWardenData).music.get(event.guild?.id || '');

        if (!music) {
            event.reply({
                fetchEdit: true,
                embeds: [
                    new MessageEmbed()
                        .setColor(0xff0000)
                        .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                        .setTitle("Hellion Warden // Queue")
                        .setDescription("I aren't playing anything.")
                ]
            });
        }
        else {
            if (music.voiceChannel.id != member.voice.channelId) {
                event.reply({
                    fetchEdit: true,
                    embeds: [
                        new MessageEmbed()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                            .setTitle("Hellion Warden // Queue")
                            .setDescription("You aren't in the same voice channel of me.")
                    ]
                });
                return;
            }


            await event.replyHandler.defer();
            let numstr = event.args.getByIndex(0);
            if (!numstr) {
                event.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                            .setTitle("Hellion Warden // Queue")
                            .setDescription("You aren't using a valid number.")
                    ]
                });
            }
            let pagenum = parseInt(numstr as string);
            let msg = "";
            var offset = 0;
            if (!isNaN(pagenum) && isFinite(pagenum))
                offset = 10 * (pagenum - 1);

            let queue = music.getQueue();
            var limit = queue.length;
            if (offset + 10 < limit)
                limit = offset + 10;

            for (var i = offset; i < limit; i++)
                msg += `**[${i + 1}]** ${queue[i].title} **(${queue[i].requestedBy.user.tag})**\n`;

            if (msg == "") {
                event.reply({
                    fetchEdit: true,
                    embeds: [
                        new MessageEmbed()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                            .setTitle("Hellion Warden // Queue")
                            .setDescription(`The queue page number **${pagenum}** is empty.`)
                    ]
                });
                return;
            }

            event.reply({
                fetchEdit: true,
                embeds: [
                    new MessageEmbed()
                        .setColor(0x260041)
                        .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                        .setTitle("Hellion Warden // Queue")
                        .setDescription(msg.slice(0, 2000))
                ]
            });
        }

    }
}