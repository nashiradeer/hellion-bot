export * as discord from './discord';
export * as logger from './modules/logger';
export * as commandHandler from './modules/command';
export * as player from './modules/player';
export * as knuckle from './modules/knucklebones';

export declare interface HellionWardenInformation {
    VERSION: string;
}

export const HellionWardenInformation = {
    VERSION: "1.2.0-alpha.2"
};
