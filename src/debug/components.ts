import { MessageComponentInteraction, ChatInputCommandInteraction, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ChannelSelectMenuBuilder, UserSelectMenuBuilder, RoleSelectMenuBuilder, MentionableSelectMenuBuilder, ButtonStyle } from "discord.js";
import { HellionCommand, HellionComponent } from "../handler";


export class HellionDebugComponent implements HellionCommand {
    public name: string;

    constructor() {
        this.name = "debug-component";
    }

    public data(): SlashCommandBuilder {
        return new SlashCommandBuilder()
            .addStringOption(option => option
                .setRequired(true)
                .setChoices(
                    { name: "Button", value: "button" },
                    { name: "String", value: "string" },
                    { name: "User", value: "user" },
                    { name: "Role", value: "role" },
                    { name: "Mentionable", value: "mentionable" },
                    { name: "Channel", value: "channel" }
                )
                .setDescription("Component to be tested.")
                .setName("component")
            )
            .setDescription("Tests the execution of components in Hellion.")
            .setName(this.name)
    }

    public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const choice = interaction.options.getString("component", true);
        switch (choice) {
            case 'button':
                await interaction.reply({
                    content: "Here is the requested component:",
                    components: [
                        new ActionRowBuilder<ButtonBuilder>()
                            .setComponents(new ButtonBuilder()
                                .setStyle(ButtonStyle.Primary)
                                .setCustomId("debug-buttoncomp")
                                .setLabel("Button Test")
                            )
                    ]
                });
                break;
            case 'string':
                await interaction.reply({
                    content: "Here is the requested component:",
                    components: [
                        new ActionRowBuilder<StringSelectMenuBuilder>()
                            .setComponents(new StringSelectMenuBuilder()
                                .setCustomId("debug-stringcomp")
                                .addOptions(
                                    { value: "Fox", label: "Fox" },
                                    { value: "Wolf", label: "Wolf" },
                                    { value: "Cat", label: "Cat" }
                                )
                            )
                    ]
                });
                break;
            case 'user':
                interaction.reply({
                    content: "Here is the requested component:",
                    components: [
                        new ActionRowBuilder<UserSelectMenuBuilder>()
                            .setComponents(new UserSelectMenuBuilder()
                                .setCustomId("debug-usercomp")
                            )
                    ]
                });
                break;
            case 'role':
                await interaction.reply({
                    content: "Here is the requested component:",
                    components: [
                        new ActionRowBuilder<RoleSelectMenuBuilder>()
                            .setComponents(new RoleSelectMenuBuilder()
                                .setCustomId("debug-rolecomp")
                            )
                    ]
                });
                break;
            case 'mentionable':
                await interaction.reply({
                    content: "Here is the requested component:",
                    components: [
                        new ActionRowBuilder<MentionableSelectMenuBuilder>()
                            .setComponents(new MentionableSelectMenuBuilder()
                                .setCustomId("debug-mentionablecomp")
                            )
                    ]
                });
                break;
            case 'channel':
                await interaction.reply({
                    content: "Here is the requested component:",
                    components: [
                        new ActionRowBuilder<ChannelSelectMenuBuilder>()
                            .setComponents(new ChannelSelectMenuBuilder()
                                .setCustomId("debug-channelcomp")
                            )
                    ]
                });
                break;
            default:
                await interaction.reply("The requested component is unknown.");
        }
    }
}

export class HellionDebugButton implements HellionComponent {
    public componentId: string;

    constructor() {
        this.componentId = "debug-buttoncomp";
    }

    public async execute(interaction: MessageComponentInteraction): Promise<void> {
        if (!interaction.isButton()) {
            throw new TypeError("This command only supports 'Button' interactions");
        }

        interaction.update("Button clicked successfully.");
    }
}

export class HellionDebugString implements HellionComponent {
    public componentId: string;

    constructor() {
        this.componentId = "debug-stringcomp";
    }

    public async execute(interaction: MessageComponentInteraction): Promise<void> {
        if (!interaction.isStringSelectMenu()) {
            throw new TypeError("This command only supports 'String' interactions");
        }

        await interaction.update(`You have selected: ${interaction.values[0]}`);
    }
}

export class HellionDebugUser implements HellionComponent {
    public componentId: string;

    constructor() {
        this.componentId = "debug-usercomp";
    }

    public async execute(interaction: MessageComponentInteraction): Promise<void> {
        if (!interaction.isUserSelectMenu()) {
            throw new TypeError("This command only supports 'User' interactions");
        }

        await interaction.update(`You have selected: ${interaction.values[0]}`);
    }
}

export class HellionDebugRole implements HellionComponent {
    public componentId: string;

    constructor() {
        this.componentId = "debug-rolecomp";
    }

    public async execute(interaction: MessageComponentInteraction): Promise<void> {
        if (!interaction.isRoleSelectMenu()) {
            throw new TypeError("This command only supports 'Role' interactions");
        }

        await interaction.update(`You have selected: ${interaction.values[0]}`);
    }
}

export class HellionDebugChannel implements HellionComponent {
    public componentId: string;

    constructor() {
        this.componentId = "debug-channelcomp";
    }

    public async execute(interaction: MessageComponentInteraction): Promise<void> {
        if (!interaction.isChannelSelectMenu()) {
            throw new TypeError("This command only supports 'Channel' interactions");
        }

        await interaction.update(`You have selected: ${interaction.values[0]}`);
    }
}

export class HellionDebugMentionable implements HellionComponent {
    public componentId: string;

    constructor() {
        this.componentId = "debug-mentionablecomp";
    }

    public async execute(interaction: MessageComponentInteraction): Promise<void> {
        if (!interaction.isMentionableSelectMenu()) {
            throw new TypeError("This command only supports 'String' interactions");
        }

        await interaction.update(`You have selected: ${interaction.values[0]}`);
    }
}