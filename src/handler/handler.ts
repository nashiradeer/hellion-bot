import { Client, Interaction, RESTPostAPIChatInputApplicationCommandsJSONBody, RESTPostAPIContextMenuApplicationCommandsJSONBody, Routes } from "discord.js";
import { HellionContext } from "../discord";
import { HellionCommand, HellionAutocomplete, HellionComponent, HellionModal, HellionListener, HellionContextMenu } from "./types";
import { EventEmitter } from 'events';
import { HellionI18n } from "./i18n";

export declare interface HellionHandler {
    on(event: 'debug', listener: (message: string, ...meta) => void): this;
    on(event: 'info', listener: (message: string, ...meta) => void): this;
    on(event: 'warn', listener: (message: string, ...meta) => void): this;
    on(event: 'error', listener: (message: string, ...meta) => void): this;

    once(event: 'debug', listener: (message: string, ...meta) => void): this;
    once(event: 'info', listener: (message: string, ...meta) => void): this;
    once(event: 'warn', listener: (message: string, ...meta) => void): this;
    once(event: 'error', listener: (message: string, ...meta) => void): this;
}

export class HellionHandler extends EventEmitter {
    public commands: { [name: string]: HellionCommand | HellionCommand & HellionAutocomplete };
    public contextMenu: { [name: string]: HellionContextMenu };
    public components: { [customId: string]: HellionComponent };
    public modals: { [customId: string]: HellionModal };
    public context: HellionContext;
    public i18n: HellionI18n;

    constructor(context: HellionContext, i18n: HellionI18n) {
        super();
        this.commands = {};
        this.contextMenu = {};
        this.components = {};
        this.modals = {};
        this.context = context;
        this.i18n = i18n;
    }

    public register(listener: HellionListener): boolean {
        if ('name' in listener) {
            if (!this.commands[listener.name]) {
                this.commands[listener.name] = listener;
                return true;
            }
        } else if ('componentId' in listener) {
            if (!this.components[listener.componentId]) {
                this.components[listener.componentId] = listener;
                return true;
            }
        } else if ('modalId' in listener) {
            if (!this.modals[listener.modalId]) {
                this.modals[listener.modalId] = listener;
                return true;
            }
        } else if ('contextMenuName' in listener) {
            if (!this.contextMenu[listener.contextMenuName]) {
                this.contextMenu[listener.contextMenuName] = listener;
                return true;
            }
        } else
            throw new TypeError("It was not possible to identify the type of listener.");

        return false;
    }

    public eventHandler(interaction: Interaction): void {
        try {
            this.emit('debug', "Parsing the interaction information for execution...");
            if (interaction.isChatInputCommand() || interaction.isAutocomplete()) {
                const command = this.commands[interaction.commandName];
                if (command) {
                    if (interaction.isAutocomplete() && 'autocomplete' in command) {
                        this.emit('info', `Executing 'Autocomplete': ${command.name}`);
                        command.autocomplete(interaction, this);
                    } else if (interaction.isChatInputCommand()) {
                        this.emit('info', `Executing 'ChatInputCommand': ${command.name}`);
                        command.execute(interaction, this);
                    } else {
                        this.emit('warn', `A strange object has been received where commands and autocompleting are usually executed.`);
                    }
                } else {
                    this.emit('warn', `It was not possible to find the command: ${interaction.commandName}`)
                }
            } else if (interaction.isMessageComponent()) {
                const component = this.components[interaction.customId];
                if (component) {
                    this.emit('info', `Executing 'MessageComponent': ${component.componentId}`);
                    component.execute(interaction, this);
                } else {
                    this.emit('warn', `It was not possible to find the component: ${interaction.customId}`)
                }
            } else if (interaction.isModalSubmit()) {
                const modal = this.modals[interaction.customId];
                if (modal) {
                    this.emit('info', `Executing 'ModalSubmit': ${modal.modalId}`);
                    modal.execute(interaction, this);
                } else {
                    this.emit('warn', `It was not possible to find the modal: ${interaction.customId}`)
                }
            } else if (interaction.isContextMenuCommand()) {
                const contextMenu = this.contextMenu[interaction.commandName];
                if (contextMenu) {
                    this.emit('info', `Executing 'ContextMenu': ${contextMenu.contextMenuName}`);
                    contextMenu.execute(interaction, this);
                } else {
                    this.emit('warn', `It was not possible to find the context menu: ${interaction.commandName}`)
                }
            } else {
                this.emit('warn', `A strange object was received: ${interaction}`)
            }
        } catch (e) {
            this.emit('error', "Unknown error occurred:", e);
        }
    }

    public async registerCommands(client: Client): Promise<void> {
        if (!client.application?.id)
            throw new TypeError("Client.application.id is null");

        const data: RESTPostAPIChatInputApplicationCommandsJSONBody[] & RESTPostAPIContextMenuApplicationCommandsJSONBody[] = [];

        for (const cmdName in this.commands)
            data.push(this.commands[cmdName].data(this.i18n).toJSON());

        for (const cmdName in this.contextMenu)
            data.push(this.contextMenu[cmdName].data(this.i18n).toJSON());

        await client.rest.put(
            Routes.applicationCommands(client.application.id),
            { body: data }
        );
    }
}