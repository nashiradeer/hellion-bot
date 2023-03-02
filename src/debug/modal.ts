import { ActionRowBuilder, ChatInputCommandInteraction, ModalActionRowComponentBuilder, ModalBuilder, ModalSubmitInteraction, SlashCommandBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { HellionCommand, HellionModal } from "../handler";

export class HellionDebugModal implements HellionCommand {
    public name: string;

    constructor() {
        this.name = "debug-modal";
    }

    public data(): SlashCommandBuilder {
        return new SlashCommandBuilder()
            .setDescription("Tests the execution of modals in Hellion.")
            .setName(this.name)
    }

    public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.showModal(new ModalBuilder()
            .setCustomId("debug-modalsubmit")
            .setTitle("Debug Modals")
            .addComponents(new ActionRowBuilder<ModalActionRowComponentBuilder>()
                .addComponents(new TextInputBuilder()
                    .setRequired(true)
                    .setLabel("Message to be spoken:")
                    .setCustomId("message")
                    .setStyle(TextInputStyle.Short)
                )
            ));
    }
}

export class HellionDebugModalSubmit implements HellionModal {
    public modalId: string;

    constructor() {
        this.modalId = "debug-modalsubmit";
    }

    public async execute(interaction: ModalSubmitInteraction): Promise<void> {
        await interaction.reply(`The message coming from the modal was: ${interaction.fields.getTextInputValue("message")}`);
    }
}