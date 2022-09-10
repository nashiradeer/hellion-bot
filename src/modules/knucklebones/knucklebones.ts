import randomNumber from 'random-number-csprng';
import { HellionKbPlayer } from './base';

export type HellionKbState = null | number;

export type HellionKbColumn = 1 | 2 | 3;

export enum HellionKbAddState {
    Added = 0,
    ColumnFull = 1,
    TableFull = 2
};

export class HellionKnucklebones {
    private _playerList: HellionKbPlayer[];
    private _curPlayerId: string;
    private _tableState: HellionKbState[][];

    private _started: boolean;

    constructor(players: HellionKbPlayer[])
    {
        if (players.length != 2) {
            throw new Error("Can't play without exactly 2 players");
        }
        
        this._started = false;
        this._playerList = players;

        this._tableState[0] = [
            null, null, null,
            null, null, null,
            null, null, null
        ];

        this._tableState[1] = [
            null, null, null,
            null, null, null,
            null, null, null
        ];

        this._curPlayerId = this._playerList[Math.round(Math.random())].userId;
    }

    get currentPlayer(): HellionKbPlayer {
        this._playerList.forEach(element => {
            if (element.userId == this._curPlayerId)
                return element;
        });

        return {userId: "", userName: ""};
    }

    get players(): HellionKbPlayer[] {
        return this._playerList;
    }

    get started(): boolean {
        return this._started
    }

    public table(playerId: string): HellionKbState[] {
        return this._tableState[this.playerIndex(playerId)];
    }

    private playerIndex(playerId: string): number {
        this._playerList.forEach((element, index) => {
            if (element.userId == playerId)
                return index;
        });

        throw new Error("Player not found");
    }

    public  async rolld6(): Promise<number> {
        return await randomNumber(1, 6);
    }

    public add(number: number, column: HellionKbColumn): HellionKbAddState {
        if (this.checkColumnFull(column))
            return HellionKbAddState.ColumnFull;

        if (this.checkTableFull())
            return HellionKbAddState.TableFull;

        let index = this.playerIndex(this._curPlayerId);

        switch (column) {
            case 1:
                if (this._tableState[index][0] == null)
                    this._tableState[index][0] = number;
                else if (this._tableState[index][3] == null)
                    this._tableState[index][3] = number;
                else
                    this._tableState[index][6] = number;

                break;
            case 2:
                if (this._tableState[index][1] == null)
                    this._tableState[index][1] = number;
                else if (this._tableState[index][4] == null)
                    this._tableState[index][4] = number;
                else
                    this._tableState[index][7] = number;

                break;
            case 3:
                if (this._tableState[index][2] == null)
                    this._tableState[index][2] = number;
                else if (this._tableState[index][5] == null)
                    this._tableState[index][5] = number;
                else
                    this._tableState[index][8] = number;

                break;
            default: throw new Error("Invalid column");
        }

        if (this.playerIndex(this._curPlayerId) == 0)
            this.removeColumnNum(number, column, this._playerList[1].id);
        else
            this.removeColumnNum(number, column, this._playerList[0].id);

        if (this.checkTableFull())
            return HellionKbAddState.TableFull;

        if (this.playerIndex(this._curPlayerId) == 0)
            this._curPlayerId = this._playerList[1].userId;
        else
            this._curPlayerId = this._playerList[0].userId;

        if (this.checkTableFull())
            return HellionKbAddState.TableFull;
        
        return HellionKbAddState.Added;
    }

    public checkColumnFull(column: HellionKbColumn): boolean {
        let table = this.table(this._curPlayerId);
        if (!table)
            throw new Error("Abnormal error, current player don't have a table");

        switch (column) {
            case 1: table[0] != null && table[3] != null && table[6] != null;
            case 2: table[1] != null && table[4] != null && table[7] != null;
            case 3: table[2] != null && table[5] != null && table[8] != null;
            default: throw new Error("Invalid column");
        }
    }

    public checkTableFull(): boolean {
        let table = this.table(this._curPlayerId);
        if (!table)
            throw new Error("Abnormal error, current player don't have a table");

        return table[0] != null && table[3] != null && table[6] != null &&
               table[1] != null && table[4] != null && table[7] != null &&
               table[2] != null && table[5] != null && table[8] != null;
    }

    public removeColumnNum(num: number, column: HellionKbColumn, playerId: string): void {
        let index = this.playerIndex(playerId);

        switch (column) {
            case 1:
                if (this._tableState[index][0] == num)
                    this._tableState[index][0] = null;
                if (this._tableState[index][3] == num)
                    this._tableState[index][3] = null;
                if (this._tableState[index][6] == num)
                    this._tableState[index][6] = null;

                break;
            case 2:
                if (this._tableState[index][1] == num)
                    this._tableState[index][1] = null;
                if (this._tableState[index][4] == num)
                    this._tableState[index][4] = null;
                if (this._tableState[index][7] == num)
                    this._tableState[index][7] = null;

                break;
            case 3:
                if (this._tableState[index][2] == num)
                    this._tableState[index][2] = null;
                if (this._tableState[index][5] == num)
                    this._tableState[index][5] = null;
                if (this._tableState[index][8] == num)
                    this._tableState[index][8] = null;

                break;
            default: throw new Error("Invalid column");
        }
    }

    public calculatePoints(): HellionKbState[] {
        return [];
    }
}
