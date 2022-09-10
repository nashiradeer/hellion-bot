import { TextBasedChannel } from 'discord.js';
import randomNumber from 'random-number-csprng';
import { HellionKbAddState, HellionKbColumn, HellionKbPlayer, HellionKbState } from './base';

export class HellionKnucklebones {
    private _playerList: HellionKbPlayer[];
    private _curPlayer: number;
    private _tableState: HellionKbState[][];

    private _channel: TextBasedChannel | null;

    constructor(players: HellionKbPlayer[], ready: () => {}, channel: TextBasedChannel | null) {
        if (players.length != 2) {
            throw new Error("Can't play without exactly 2 players");
        }

        this._channel = channel;
        this._playerList = players;

        this._tableState = [
            [
                null, null, null,
                null, null, null,
                null, null, null
            ], [
                null, null, null,
                null, null, null,
                null, null, null
            ]
        ];

        randomNumber(0, 1).then((n) => {
            this._curPlayer = n;
            ready();
        });
    }

    get currentPlayer(): HellionKbPlayer {
        return this._playerList[this._curPlayer];
    }

    get players(): HellionKbPlayer[] {
        return this._playerList;
    }

    public table(playerId: string): HellionKbState[] {
        return this._tableState[this.playerIndex(playerId)];
    }

    private playerIndex(playerId: string): number {
        for (let i = 0; i < this._playerList.length; i++) {
            if (this._playerList[i].id == playerId)
                return i;
        }

        throw new Error("Player not found");
    }

    public async rolld6(): Promise<number> {
        return await randomNumber(1, 6);
    }

    public add(number: number, column: HellionKbColumn): HellionKbAddState {
        if (this.checkColumnFull(column))
            return HellionKbAddState.ColumnFull;

        for (const element of this._playerList) {
            if (this.checkTableFull(element.id))
                return HellionKbAddState.TableFull;
        }

        if (column < 0 || column > 2)
            throw new Error("Invalid column");

        let row1 = column + 0;
        let row2 = column + 3;
        let row3 = column + 6;

        if (this._tableState[this._curPlayer][row1] == null)
            this._tableState[this._curPlayer][row1] = number;
        else if (this._tableState[this._curPlayer][row2] == null)
            this._tableState[this._curPlayer][row2] = number;
        else
            this._tableState[this._curPlayer][row3] = number;

        if (this._curPlayer == 0)
            this.removeColumnNum(number, column, this._playerList[1].id);
        else
            this.removeColumnNum(number, column, this._playerList[0].id);

        if (this.checkTableFull())
            return HellionKbAddState.TableFull;

        if (this._curPlayer == 0)
            this._curPlayer = 1;
        else
            this._curPlayer = 0;

        if (this.checkTableFull())
            return HellionKbAddState.TableFull;

        return HellionKbAddState.Added;
    }

    public checkColumnFull(column: HellionKbColumn): boolean {
        let table = this._tableState[this._curPlayer];

        if (column < 0 || column > 2)
            throw new Error("Invalid column");

        let row1 = column + 0;
        let row2 = column + 3;
        let row3 = column + 6;

        return table[row1] != null && table[row2] != null && table[row3] != null;
    }

    public checkTableFull(): boolean {
        let table = this._tableState[this._curPlayer];

        for (let i = 0; i < table.length; i++) {
            if (table[i] == null)
                return false;
        }

        return true;
    }

    private removeColumnNum(num: number, column: HellionKbColumn, playerId: string): void {
        if (column < 0 || column > 2)
            throw new Error("Invalid column");

        let row1 = column + 0;
        let row2 = column + 3;
        let row3 = column + 6;

        if (this._tableState[this._curPlayer][row3] == num)
            this._tableState[this._curPlayer][row3] = null;

        if (this._tableState[this._curPlayer][row2] == num) {
            if (this._tableState[row3] != null) {
                this._tableState[this._curPlayer][row2] = this._tableState[this._curPlayer][row3];
                this._tableState[this._curPlayer][row3] = null;
            } else {
                this._tableState[this._curPlayer][row2] = null;
            }
        }

        if (this._tableState[this._curPlayer][row1] == num) {
            if (this._tableState[row3] != null) {
                this._tableState[this._curPlayer][row1] = this._tableState[this._curPlayer][row2];
                this._tableState[this._curPlayer][row2] = this._tableState[this._curPlayer][row3];
                this._tableState[this._curPlayer][row3] = null;
            } else if (this._tableState[row2] != null) {
                this._tableState[this._curPlayer][row1] = this._tableState[this._curPlayer][row2];
                this._tableState[this._curPlayer][row2] = null;
            } else {
                this._tableState[this._curPlayer][row1] = null;
            }
        }
    }

    public calculatePoints(): number[] {
        let points: number[] = [];

        for (let i = 0; i < this._tableState.length; i++) {
            let point: HellionKbPoint[] = [];

            for (let column = 0; i <= 2; column++) {
                let row1 = column + 0;
                let row2 = column + 3;
                let row3 = column + 6;

                point.push({
                    value: this._tableState[i][row1] as number,
                    repeated: 1
                });

                if (this._tableState[i][row2] == point[point.length - 1].value) {
                    point[point.length - 1].repeated++;

                    point.push({
                        value: -1,
                        repeated: 0
                    });
                } else
                    point.push({
                        value: this._tableState[i][row2] as number,
                        repeated: 1
                    });

                if (this._tableState[i][row3] == point[point.length - 1].value) {
                    point[point.length - 1].repeated++;

                    point.push({
                        value: -1,
                        repeated: 0
                    });
                } else if (this._tableState[i][row3] == point[point.length - 2].value) {
                    point[point.length - 2].repeated++;

                    point.push({
                        value: -1,
                        repeated: 0
                    });
                } else
                    point.push({
                        value: this._tableState[i][row2] as number,
                        repeated: 1
                    });
            }

            let respoints = 0;
            for (let o = 0; i < point.length; o++) {
                respoints += point[o].value * point[o].repeated;
            }
            points.push(respoints);
        }

        return points;
    }
}
