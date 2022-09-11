import { resolveBody } from "@discordjs/rest/dist/lib/utils/utils";
import { GuildMember, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageComponentInteraction, Client, userMention } from "discord.js";
import { commandHandler, player } from "..";
import { HellionWardenData } from "../discord";
import { HellionKbAddState, HellionKbColumn, HellionKbGameState, HellionKbPlayer, HellionKbState, HellionKnucklebones } from "../modules/knucklebones";

export class HellionCommand extends commandHandler.HellionCommandListener {
    constructor() {
        super();
        this.name = "knuckle";
        this.category = "Games";
        this.description = "Play the Knucklebones game from the Cult of the Lamb.";
    }

    public async run(event: commandHandler.HellionCommandEvent, data: any): Promise<void> {
        let game = (data as HellionWardenData).knuckle.get(event.guild?.id || "");

        if (game) {
            await event.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                        .setTitle("Hellion Warden // Knucklebones")
                        .setDescription("Already has a game running in this server.")
                ]
            });
            return;
        }

        await event.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x260041)
                    .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                    .setTitle("Hellion Warden // Knucklebones")
                    .setDescription(`A NEW GAME IS STARTING, YOU CAN JOIN WITH **${(event.member as GuildMember).nickname || event.user.username}** IN THIS GAME.`)
            ],
            components: [
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel("Join!!!")
                            .setCustomId("join-knuckles")
                            .setStyle(ButtonStyle.Primary),
                    )
            ]
        });


        let creator: HellionKbPlayer = {
            avatar: (event.member as GuildMember)?.avatarURL() || event.user.avatarURL(),
            id: event.user.id,
            username: (event.member as GuildMember).nickname || event.user.username
        };

        let collector = event.channel?.createMessageComponentCollector({ filter: (i: MessageComponentInteraction) => i.customId == "join-knuckles" && i.user.id != creator.id, time: 30000, max: 1 });
        collector?.on('collect', async (i: MessageComponentInteraction) => {
            await i.update({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x260041)
                        .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                        .setTitle("Hellion Warden // Knucklebones")
                        .setDescription(`**${(i.member as GuildMember)?.nickname || i.user.username}** ACCEPTED THE CHALLANGE, STARTING THE GAME!.`)
                ],
                components: [
                    new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(
                            new ButtonBuilder()
                                .setLabel("Join!!!")
                                .setCustomId("join-knuckles")
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(true),
                        )
                ]
            });

            let enemy: HellionKbPlayer = {
                avatar: (i.member as GuildMember)?.avatarURL() || i.user.avatarURL(),
                id: i.user.id,
                username: (i.member as GuildMember)?.nickname || i.user.username
            };

            let kb = new HellionKnucklebones([creator, enemy], event.channel, () => {
                let game = (data as HellionWardenData).knuckle.get(event.guild?.id || "");

                if (game) {
                    event.channel?.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0xff0000)
                                .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                                .setTitle("Hellion Warden // Knucklebones")
                                .setDescription("Already has a game running in this server.")
                        ]
                    });
                    return;
                }

                (data as HellionWardenData).knuckle.set(event.guild?.id || "", kb);
                startGame(event.guild?.id || "", (data as HellionWardenData).knuckle, event.client).catch((err) => {
                    event.error(err);
                });
            });
        });
        collector?.on('end', (collected) => {
            if (collected.size === 0) {
                event.replyHandler.edit({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: event.client.user?.avatarURL() || '' })
                            .setTitle("Hellion Warden // Knucklebones")
                            .setDescription(`Anyone has accepted the challange. D:`)
                    ],
                    components: [
                        new ActionRowBuilder<ButtonBuilder>()
                            .addComponents(
                                new ButtonBuilder()
                                    .setLabel("Join!!!")
                                    .setCustomId("join-knuckles")
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(true),
                            )
                    ]
                });
            }
        });
    }
}

async function startGame(guildId: string, map: Map<string, HellionKnucklebones>, client: Client): Promise<void> {
    const kb = map.get(guildId);

    if (kb == undefined) return;

    while (true) {
        if (await gameloop(kb, client))
            break;
    }

    map.delete(guildId);
}

async function gameloop(kb: HellionKnucklebones, client: Client): Promise<boolean> {
    return new Promise<boolean>(async (resolve) => {
        let dicemsgexists = true;
        let dicemsg = await kb.channel?.send({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x260041)
                    .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: client.user?.avatarURL() || '' })
                    .setTitle("Hellion Warden // Knucklebones")
                    .setDescription(`Rolling a dice for **${kb.currentPlayer.username}**...`)
                    .setAuthor({ name: kb.currentPlayer.username, iconURL: (kb.currentPlayer.avatar == null) ? undefined : kb.currentPlayer.avatar })
            ]
        });

        let d6 = await kb.rolld6();

        setTimeout(async () => {
            while (true) {
                if (dicemsgexists)
                    await dicemsg?.delete();
                dicemsgexists = false;

                let rollRes = await rollStage(d6, kb, client);

                if (rollRes == HellionKbGameState.Continue) {
                    resolve(false);
                    break;
                }
                else if (rollRes == HellionKbGameState.Timeout) {
                    resolve(true);
                    break;
                } else if (rollRes == HellionKbGameState.Win) {
                    await announceWinner(kb, client);
                    resolve(true);
                    break;
                }
            }
        }, 1500);
    });
}

async function announceWinner(kb: HellionKnucklebones, client: Client): Promise<void> {
    let winner: HellionKbPlayer | null = null;
    let points = kb.calculatePoints();

    if (points[0] > points[1]) {
        winner = kb.players[0];
    } else if (points[1] > points[0]) {
        winner = kb.players[1];
    }

    if (winner != null)
        await kb.channel?.send({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x260041)
                    .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: client.user?.avatarURL() || '' })
                    .setTitle("Hellion Warden // Knucklebones")
                    .setDescription(`**${kb.players[0].username}:**\n${createTable(kb.table(kb.players[0].id))} \n**${kb.players[1].username}:**\n${createTable(kb?.table(kb.players[1].id))}\n\n**${kb.players[0].username}:** ${points[0]}\n**${kb.players[1].username}:** ${points[1]}\nThe winner is **${winner.username}**!`)
                    .setAuthor({ name: winner.username, iconURL: (winner.avatar == null) ? undefined : winner.avatar })
            ]
        });
    else
        await kb.channel?.send({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x260041)
                    .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: client.user?.avatarURL() || '' })
                    .setTitle("Hellion Warden // Knucklebones")
                    .setDescription(`**${kb.players[0].username}:**\n${createTable(kb.table(kb.players[0].id))}\n**${kb.players[1].username}:**\n${createTable(kb?.table(kb.players[1].id))}\n\n**${kb.players[0].username}:** ${points[0]}\n**${kb.players[1].username}:** ${points[1]}\nThe match ended in a draw. :(`)
            ]
        });
}

async function rollStage(d6: number, kb: HellionKnucklebones, client: Client): Promise<HellionKbGameState> {
    return new Promise<HellionKbGameState>(async (resolve) => {
        let msg = await kb.channel?.send({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x260041)
                    .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: client.user?.avatarURL() || '' })
                    .setTitle("Hellion Warden // Knucklebones")
                    .setDescription(`**${kb.players[0].username}:**\n${createTable(kb.table(kb.players[0].id))}\n**${kb.players[1].username}:**\n${createTable(kb.table(kb.players[1].id))}\n\nIt's **${kb.currentPlayer.username}** turn!\nYou rolled a **${d6}**!`)
                    .setAuthor({ name: kb.currentPlayer.username, iconURL: (kb.currentPlayer.avatar == null) ? undefined : kb.currentPlayer.avatar })
            ],
            components: [
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel("Column 1")
                            .setCustomId("column-1-knuckles")
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(kb?.checkColumnFull(0)),
                        new ButtonBuilder()
                            .setLabel("Column 2")
                            .setCustomId("column-2-knuckles")
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(kb?.checkColumnFull(1)),
                        new ButtonBuilder()
                            .setLabel("Column 3")
                            .setCustomId("column-3-knuckles")
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(kb?.checkColumnFull(2)),
                    )
            ]
        });
        let collector = msg?.createMessageComponentCollector({ filter: (i: MessageComponentInteraction) => (i.customId == "column-1-knuckles" || i.customId == "column-2-knuckles" || i.customId == "column-3-knuckles") && i.user.id == kb?.currentPlayer.id, time: 30000, max: 1 })
        collector?.on('collect', async (i: MessageComponentInteraction) => {
            let columnId: number = 0;
            switch (i.customId) {
                case "column-2-knuckles":
                    columnId = 1;
                    break;
                case "column-3-knuckles":
                    columnId = 2;
                    break;
            }

            await msg?.delete();

            let msg2 = await i.channel?.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x260041)
                        .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: client.user?.avatarURL() || '' })
                        .setTitle("Hellion Warden // Knucklebones")
                        .setDescription(`You will select column **${columnId + 1}**, are you sure?`)
                ],
                components: [
                    new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(
                            new ButtonBuilder()
                                .setLabel("Yes")
                                .setCustomId("yes-knuckles")
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setLabel("Back")
                                .setCustomId("back-knuckles")
                                .setStyle(ButtonStyle.Secondary),
                        )
                ]
            });

            let collector2 = msg2?.createMessageComponentCollector({ filter: (i: MessageComponentInteraction) => (i.customId == "yes-knuckles" || i.customId == "back-knuckles") && i.user.id == kb?.currentPlayer.id, time: 30000, max: 1 });
            collector2?.on('collect', async (i: MessageComponentInteraction) => {
                await msg2?.delete();

                if (i.customId == "yes-knuckles") {
                    let msg3 = await i.channel?.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0x260041)
                                .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: client.user?.avatarURL() || '' })
                                .setTitle("Hellion Warden // Knucklebones")
                                .setDescription(`Your choice has been saved!`)
                        ]
                    });

                    let ended = false;
                    if (kb.add(d6, columnId as HellionKbColumn) == HellionKbAddState.TableFull)
                        ended = true;

                    setTimeout(async () => {
                        await msg3?.delete();

                        if (ended) {
                            resolve(HellionKbGameState.Win);
                        } else {
                            resolve(HellionKbGameState.Continue);
                        }
                    }, 1500);
                } else {
                    resolve(HellionKbGameState.Repeat);
                }
            });
            collector2?.on('end', (collected) => {
                if (collected.size == 0) {
                    msg2?.edit({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0xff0000)
                                .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: client.user?.avatarURL() || '' })
                                .setTitle("Hellion Warden // Knucklebones")
                                .setDescription(`The game has ended, timeout triggered. D:`)
                        ],
                        components: [
                            new ActionRowBuilder<ButtonBuilder>()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setLabel("Column 1")
                                        .setCustomId("column-1-knuckles")
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setLabel("Column 2")
                                        .setCustomId("column-2-knuckles")
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setLabel("Column 3")
                                        .setCustomId("column-3-knuckles")
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(true),
                                )
                        ]
                    });

                    resolve(HellionKbGameState.Timeout);
                }
            });
        });
        collector?.on('end', (collected) => {
            if (collected.size == 0) {
                msg?.edit({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xff0000)
                            .setFooter({ text: "Hellion Warden by Nashira Deer", iconURL: client.user?.avatarURL() || '' })
                            .setTitle("Hellion Warden // Knucklebones")
                            .setDescription(`The game has ended, timeout triggered. D:`)
                    ],
                    components: [
                        new ActionRowBuilder<ButtonBuilder>()
                            .addComponents(
                                new ButtonBuilder()
                                    .setLabel("Column 1")
                                    .setCustomId("column-1-knuckles")
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setLabel("Column 2")
                                    .setCustomId("column-2-knuckles")
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setLabel("Column 3")
                                    .setCustomId("column-3-knuckles")
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(true),
                            )
                    ]
                });

                resolve(HellionKbGameState.Timeout);
            }
        });
    });
}

function createTable(table: HellionKbState[]): string {
    let res = "";
    for (let i = 0; i <= 2; i++) {
        res += getTableEmoji(table[i]);
    }
    res += "\n";

    for (let i = 3; i <= 5; i++) {
        res += getTableEmoji(table[i]);
    }
    res += "\n";

    for (let i = 6; i <= 8; i++) {
        res += getTableEmoji(table[i]);
    }

    return res;
}


function getTableEmoji(num: number | null): string {
    switch (num) {
        case 1: return ":one:";
        case 2: return ":two:";
        case 3: return ":three:";
        case 4: return ":four:";
        case 5: return ":five:";
        case 6: return ":six:";
        default: return ":free:";
    }
}