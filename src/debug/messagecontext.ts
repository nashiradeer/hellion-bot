import { ContextMenuCommandBuilder, ApplicationCommandType, ContextMenuCommandInteraction } from "discord.js";
import { HellionContextMenu } from "../handler";

export class HellionDebugMessageContext implements HellionContextMenu {
    public contextMenuName: string;

    constructor() {
        this.contextMenuName = "debug-messagecontext"
    }

    public data(): ContextMenuCommandBuilder {
        return new ContextMenuCommandBuilder()
            .setType(ApplicationCommandType.Message)
            .setName(this.contextMenuName)
    }
    public async execute(interaction: ContextMenuCommandInteraction): Promise<void> {
        if (!interaction.isMessageContextMenuCommand()) {
            throw new TypeError("This command only supports 'MessageContextMenu' interactions");
        }

        interaction.reply(`You have selected the message: ${interaction.targetMessage.content}`);
    }
}