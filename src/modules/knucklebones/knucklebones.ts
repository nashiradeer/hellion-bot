import randomNumber from 'random-number-csprng';
import { HellionKbAddState, HellionKbPlayer, HellionKbColumn, HellionKbState } from './base';

export class HellionKnucklebones {
    private _playerList: HellionKbPlayer[];
    private _curPlayerId: string;
    private _tableState: HellionKbState[][];

    private _started: boolean;

    constructor(players: HellionKbPlayer[]) {
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

        return { userId: "", userName: "" };
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

    public async rolld6(): Promise<number> {
        return await randomNumber(1, 6);
    }

    public add(number: number, column: HellionKbColumn): HellionKbAddState {
        if (this.checkColumnFull(column))
            return HellionKbAddState.ColumnFull;

        for (const element of this._playerList) {
            if (this.checkTableFull(element.userId))
                return HellionKbAddState.TableFull;
        }

        switch (column) {
            case 1:
                if (this._tableState[this.playerIndex(this._curPlayerId)][0] == null)
                    this._tableState[this.playerIndex(this._curPlayerId)][0] = number;
                else if (this._tableState[this.playerIndex(this._curPlayerId)][3] == null)
                    this._tableState[this.playerIndex(this._curPlayerId)][3] = number;
                else
                    this._tableState[this.playerIndex(this._curPlayerId)][6] = number;

                break;
            case 2:
                if (this._tableState[this.playerIndex(this._curPlayerId)][1] == null)
                    this._tableState[this.playerIndex(this._curPlayerId)][1] = number;
                else if (this._tableState[this.playerIndex(this._curPlayerId)][4] == null)
                    this._tableState[this.playerIndex(this._curPlayerId)][4] = number;
                else
                    this._tableState[this.playerIndex(this._curPlayerId)][7] = number;

                break;
            case 3:
                if (this._tableState[this.playerIndex(this._curPlayerId)][2] == null)
                    this._tableState[this.playerIndex(this._curPlayerId)][2] = number;
                else if (this._tableState[this.playerIndex(this._curPlayerId)][5] == null)
                    this._tableState[this.playerIndex(this._curPlayerId)][5] = number;
                else
                    this._tableState[this.playerIndex(this._curPlayerId)][8] = number;

                break;
            default: throw new Error("Invalid column");
        }

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

    public checkColumnFull(column: HellionKbColumn, playerId: string = this._curPlayerId): boolean {
        let table = this.table(playerId);
        if (!table)
            throw new Error("Abnormal error, current player don't have a table");

        switch (column) {
            case 1: table[0] != null && table[3] != null && table[6] != null;
            case 2: table[1] != null && table[4] != null && table[7] != null;
            case 3: table[2] != null && table[5] != null && table[8] != null;
            default: throw new Error("Invalid column");
        }
    }

    public checkTableFull(playerId: string = this._curPlayerId): boolean {
        let table = this.table(playerId);
        if (!table)
            throw new Error("Abnormal error, current player don't have a table");

        return table[0] != null && table[3] != null && table[6] != null &&
            table[1] != null && table[4] != null && table[7] != null &&
            table[2] != null && table[5] != null && table[8] != null;
    }

    public calculatePoints(): number[] {
        let res: number[] = [];

        this._tableState.forEach((element) => {
            let total = element.reduce((v: HellionKbState, c: HellionKbState): HellionKbState => {
                if (v == null)
                    v = 0;
                return (c != null) ? v + c : v
            });
            if (total != null)
                res.push(total);
        });

        return res;
    }
}
