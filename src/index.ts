export * as discord from './discord';
export * as logger from './modules/logger';
export * as commandHandler from './modules/command';
export * as player from './modules/player';

export declare interface HellionWardenInformation
{
    VERSION: string;
}

export const HellionWardenInformation = {
    VERSION: "v0.0.1-rc.1"
};