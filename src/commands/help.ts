import { MessageEmbed, version } from "discord.js";
import { commandHandler, HellionWardenInformation, discord } from "..";

export class HellionCommand extends commandHandler.HellionCommandListener {
    constructor() {
        super();
        this.name = "help";
        this.category = "Information";
        this.description = "See the list of commands or get help on a specific command.";
        this.alias = ["h"];
        this.usage = [
            {
                name: "search",
                description: "Command or category you want help with.",
                index: 0,
                required: false,
                type: 'STRING'
            }
        ]
    }

    public async run(event: commandHandler.HellionCommandEvent, data: any): Promise<void> {
        let commands = event.handler.searchCommands(event.args.getByIndex(0)?.toLowerCase());
        if (commands.length == 0) {
            event.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(0xff0000)
                        .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                        .setTitle("Hellion // Help")
                        .setDescription("Could not find a command or category with that name.")
                ]
            });
        } else if (commands.length == 1) {
            let usage = "";
            for (let i = 0; i < commands[0].usage.length; i++) {
                usage += (commands[0].usage[i].required) ? `<${commands[0].usage[i].name}> ` : `[${commands[0].usage[i].name}] `;
            }
            if (usage) usage = "\n**Usage:** " + usage;
            let alias = "";
            for (let i = 0; i < commands[0].alias.length; i++) {
                alias += `'${commands[0].alias[i]}' `;
            }
            if (alias) alias = "\n**Aliases:** " + alias;
            event.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(data.embedColor)
                        .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                        .setTitle("Hellion // Help")
                        .setDescription(`**Commands:** ${commands[0].name}\n**Description:** ${commands[0].description}\n**Category:** ${commands[0].category}${usage}${alias}`)
                ]
            });
        } else {
            let categories = {};
            for (let i = 0; i < commands.length; i++) {
                if (!categories[commands[i].category]) categories[commands[i].category] = [commands[i]];
                else categories[commands[i].category].push(commands[i]);
            }
            let message = "";
            let keys = Object.keys(categories);
            for (let i = 0; i < keys.length; i++) {
                message += `**${keys[i]}: **`;
                for (let o = 0; o < categories[keys[i]].length; o++) {
                    message += `'${categories[keys[i]][o].name}' `;
                }
                message += "\n";
            }
            event.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(data.embedColor)
                        .setFooter({ text: "Hellion by DeerSoftware", iconURL: "https://www.deersoftware.dev/assets/images/deersoftware-tinysquare.png" })
                        .setTitle("Hellion // Help")
                        .setDescription(message.substring(0, 2000))
                ]
            });
        }
    }
}