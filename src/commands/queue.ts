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
            let queue = music.getQueue();
            let totalPages = Math.ceil(queue.length / 10);
            let m = music.nowPlaying();
            let numstr = event.args.getByIndex(0) || '1';
            let curPage = parseInt(numstr as string);
            if (isNaN(curPage) || !isFinite(curPage))
                curPage = 1;

            if (curPage > totalPages) {
                event.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                            .setTitle("Hellion Warden // Queue")
                            .setDescription(`Page number is greater than total pages: \`\`${totalPages}\`\``)
                    ]
                });
                return;
            }

            let offset = 10 * (curPage - 1);
            let limit = queue.length;
            if (offset + 10 < limit)
                limit = offset + 10;

            let msg = `**${"━".repeat(20)}**\n**Playing:** [${m.pos + 1}] // **Page:** [${curPage} / ${totalPages}]\n**${"━".repeat(20)}**\n`;
            for (let i = offset; i < limit; i++)
                msg += `**[${i + 1}]** ${queue[i].title} **(${queue[i].requestedBy.user.tag})**\n`;

            if (msg == "") {
                event.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                            .setTitle("Hellion Warden // Queue")
                            .setDescription(`The queue page number **${curPage}** is empty.`)
                    ]
                });
                return;
            }

            event.reply({
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