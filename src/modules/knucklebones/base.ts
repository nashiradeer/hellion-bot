export interface HellionKbPlayer {
    userId: string;
    userName: string;
}

export type HellionKbState = null | number;

export type HellionKbColumn = 1 | 2 | 3;

export enum HellionKbAddState {
    Added = 0,
    ColumnFull = 1,
    TableFull = 2
};