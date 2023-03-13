import { ContextMenuCommandBuilder, ApplicationCommandType, ContextMenuCommandInteraction } from "discord.js";
import { HellionContextMenu } from "../handler";

export class HellionDebugUserContext implements HellionContextMenu {
    public contextMenuName: string;

    constructor() {
        this.contextMenuName = "debug-usercontext"
    }

    public data(): ContextMenuCommandBuilder {
        return new ContextMenuCommandBuilder()
            .setType(ApplicationCommandType.User)
            .setName(this.contextMenuName)
    }
    public async execute(interaction: ContextMenuCommandInteraction): Promise<void> {
        if (!interaction.isUserContextMenuCommand()) {
            throw new TypeError("This command only supports 'UserContextMenu' interactions");
        }

        interaction.reply(`You have selected the user: ${interaction.targetUser.username}#${interaction.targetUser.discriminator}`);
    }
}