export interface HellionKbPlayer {
    id: string;
    username: string;
    avatar: string;
}

export type HellionKbState = null | number;

export type HellionKbColumn = 0 | 1 | 2;
import { User } from "discord.js";

export type HellionKbState = null | number;

export type HellionKbColumn = 1 | 2 | 3;

export enum HellionKbAddState {
    Added = 0,
    ColumnFull = 1,
    TableFull = 2
};

export enum HellionKbGameState {
    Continue = 0,
    Repeat = 1,
    Timeout = 2,
    Win = 3
}

export interface HellionKbPoint {
    value: number;
    repeated: number;
}