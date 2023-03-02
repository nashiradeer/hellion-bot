import { SlashCommandBuilder, AutocompleteInteraction, MessageComponentInteraction, ModalSubmitInteraction, ChatInputCommandInteraction } from "discord.js";
import { HellionHandler } from "./handler";

export interface HellionCommand {
    name: string;
    data: SlashCommandBuilder;
    execute: (interaction: ChatInputCommandInteraction, handler: HellionHandler) => void | PromiseLike<void>;
}

export interface HellionAutocomplete {
    autocomplete: (interaction: AutocompleteInteraction, handler: HellionHandler) => void | PromiseLike<void>;
}

export interface HellionComponent {
    componentId: string;
    execute: (interaction: MessageComponentInteraction, handler: HellionHandler) => void | PromiseLike<void>;
}

export interface HellionModal {
    modalId: string;
    execute: (interaction: ModalSubmitInteraction, handler: HellionHandler) => void | PromiseLike<void>;
}

export type HellionListener = HellionCommand | HellionCommand & HellionAutocomplete | HellionComponent | HellionModal;