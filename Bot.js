class BotHistoryEntry {
    constructor(betNumber, win, amountBet, amountWon = 0, draw = false) {
        this.betNumber = betNumber;
        this.win = win;
        this.amountBet = amountBet;
        this.amountWon = amountWon;
        this.draw = draw;
    }
}
class Bot {
    constructor(i, name, startMoney, isPlayer = false) {
        this.isPlayer = isPlayer;
        this.i = i
        this.name = name;
        this.money = startMoney;
        this.betOption = null;
        this.betMoney = null;
        this.history = [];
    }
}
