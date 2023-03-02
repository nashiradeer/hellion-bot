import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { AutocompleteInteraction } from "discord.js";
import { HellionCommand, HellionAutocomplete } from "../handler";

export class HellionDebugCommand implements HellionCommand, HellionAutocomplete {
    public name: string;

    constructor() {
        this.name = "debug-command"
    }

    public data(): SlashCommandBuilder {
        return new SlashCommandBuilder()
            .addStringOption(option => option
                .setAutocomplete(true)
                .setName("word")
                .setDescription("A word to be said.")
                .setRequired(true)
            )
            .setDescription("Tests the execution of commands in Hellion.")
            .setName(this.name)
    }
    public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.reply(`The word to be said was: ${interaction.options.getString("word", true)}`);
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