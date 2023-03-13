import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { AutocompleteInteraction } from "discord.js";
import { HellionCommand, HellionAutocomplete, HellionHandler } from "../handler";
import { HellionI18n } from "../handler/i18n";

export class HellionDebugCommand implements HellionCommand, HellionAutocomplete {
    public name: string;

    constructor() {
        this.name = "debug-command"
    }

    public data(i18n: HellionI18n): SlashCommandBuilder {
        return new SlashCommandBuilder()
            .addStringOption(option => option
                .setRequired(true)
                .setAutocomplete(true)
                .setNameLocalizations(i18n.getAll("debug", "commandWordName"))
                .setDescriptionLocalizations(i18n.getAll("debug", "commandWordDesc"))
                .setName(i18n.getDefault("debug", "commandWordName"))
                .setDescription(i18n.getDefault("debug", "commandWordDesc"))
            )
            .setNameLocalizations(i18n.getAll("debug", "commandName"))
            .setDescriptionLocalizations(i18n.getAll("debug", "commandDesc"))
            .setDescription(i18n.getDefault("debug", "commandDesc"))
            .setName(this.name);
    }
    public async execute(interaction: ChatInputCommandInteraction, handler: HellionHandler): Promise<void> {
        await interaction.reply(handler.i18n.get(interaction.locale, "debug", "commandMessage", {
            WORD: interaction.options.getString("word", true)
        }));
    }

    public async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
        const word = interaction.options.getString("word", true).toLowerCase();
        const choices = [
            "Apple",
            "Banana",
            "Car",
            "Dog",
            "Elephant",
            "Frog",
            "Guitar",
            "House",
            "Igloo",
            "Jellyfish",
            "Kangaroo",
            "Lion",
            "Monkey",
            "Notebook",
            "Owl",
            "Peguin",
            "Quail",
            "Rabbit",
            "Sunflower",
            "Tiger",
            "Umbrella",
            "Violin",
            "WHale",
            "Xylophone",
            "Yellow",
            "Zebra"
        ];
        const filtered = choices.filter(choice => choice.toLowerCase().startsWith(word.toLowerCase())).splice(0, 25);
        await interaction.respond(
            filtered.map(choice => ({ name: choice, value: choice })),
        );
    }

}