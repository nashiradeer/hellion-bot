export interface HellionKbPlayer {
    id: string;
    username: string;
    avatar: string;
}

export type HellionKbState = null | number;

export type HellionKbColumn = 0 | 1 | 2;

export enum HellionKbAddState {
    Added = 0,
    ColumnFull = 1,
    TableFull = 2
};

export interface HellionKbPoint {
    value: number;
    repeated: number;
}