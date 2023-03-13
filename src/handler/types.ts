import { SlashCommandBuilder, AutocompleteInteraction, MessageComponentInteraction, ModalSubmitInteraction, ChatInputCommandInteraction, ContextMenuCommandBuilder, ContextMenuCommandInteraction } from "discord.js";
import { HellionHandler } from "./handler";
import { HellionI18n } from "./i18n";

export interface HellionCommand {
    name: string;
    data: (i18n: HellionI18n) => SlashCommandBuilder;
    execute: (interaction: ChatInputCommandInteraction, handler: HellionHandler) => void | Promise<void>;
}

export interface HellionAutocomplete {
    autocomplete: (interaction: AutocompleteInteraction, handler: HellionHandler) => void | Promise<void>;
}

export interface HellionContextMenu {
    contextMenuName: string;
    data: (i18n: HellionI18n) => ContextMenuCommandBuilder;
    execute: (interaction: ContextMenuCommandInteraction, handler: HellionHandler) => void | Promise<void>;
}

export interface HellionComponent {
    componentId: string;
    execute: (interaction: MessageComponentInteraction, handler: HellionHandler) => void | Promise<void>;
}

export interface HellionModal {
    modalId: string;
    execute: (interaction: ModalSubmitInteraction, handler: HellionHandler) => void | Promise<void>;
}

export type HellionListener = HellionCommand | HellionCommand & HellionAutocomplete | HellionComponent | HellionModal | HellionContextMenu;