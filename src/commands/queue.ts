import { GuildMember, MessageEmbed } from "discord.js";
import { commandHandler, discord } from "..";

export class HellionCommand extends commandHandler.HellionCommandListener {
    constructor() {
        super();
        this.name = "queue";
        this.category = "Music";
        this.description = "See the Music Player queue.";
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
            await event.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(0xff0000)
                        .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                        .setTitle("Hellion // Queue")
                        .setDescription("You aren't on a voice chat.")
                ]
            });
            return;
        }

        let music = (data as discord.HellionWardenData).music.get(event.guild?.id || '');

        if (!music) {
            await event.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(0xff0000)
                        .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                        .setTitle("Hellion // Queue")
                        .setDescription("I'm not playing anything at the moment.")
                ]
            });
        }
        else {
            if (music.voiceChannel.id != member.voice.channelId) {
                await event.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                            .setTitle("Hellion // Queue")
                            .setDescription("You're not on the same voice chat as me.")
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
                await event.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                            .setTitle("Hellion // Queue")
                            .setDescription(`The page number chosen is greater than the total number of pages: \`\`${totalPages}\`\``)
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
                await event.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                            .setTitle("Hellion // Queue")
                            .setDescription(`Page number **${curPage}** is empty.`)
                    ]
                });
                return;
            }

            await event.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(data.embedColor)
                        .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                        .setTitle("Hellion // Queue")
                        .setDescription(msg.slice(0, 2000))
                ]
            });
        }

    }
}