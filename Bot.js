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
    constructor(i, startMoney) {
        this.name = i;
        this.money = startMoney;
        this.betOption = null;
        this.betMoney = null;
        this.history = [];
    }
}
