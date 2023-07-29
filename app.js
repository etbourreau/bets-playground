const { ref } = Vue;

const App = {
    data() {
        const population = [];
        const botAmount = random(20, 50);
        for (let i = 0; i < botAmount; i++) {
            population.push(new Bot(i + 1, random(50, 20000)));
        }

        const bet = {
            progressKey: 0,
            started: false,
            options: [],
            results: null,
            amount: 0,
            timeStart: null,
            timeEnd: null,
        };

        return {
            population,
            status: "",
            bet,
            formatMoney: (val) => formatMoney(val),
            getTotalMoney: () => {
                return this.population
                    .map((b) => b.money)
                    .reduce((a, b) => a + b);
            },
            getAvgMoney: () => {
                return (this.getTotalMoney() / this.population.length).toFixed(
                    2
                );
            },
            getBetTimeProgress: () => {
                if (!this.bet.timeStart || !this.bet.timeEnd) {
                    return 0;
                }
                const now = new Date().getTime() - this.bet.timeStart;
                const max = this.bet.timeEnd - this.bet.timeStart;
                return parseInt(((max - now) / max) * 100);
            },
            getBetsToShow: () => {
                return this.bet.options.sort((a, b) => {
                    const aT = a.participants.length
                        ? a.participants
                              .map((p) => p.betMoney)
                              .reduce((a1, b1) => a1 + b1)
                        : 0;
                    const bT = b.participants.length
                        ? b.participants
                              .map((p) => p.betMoney)
                              .reduce((a1, b1) => a1 + b1)
                        : 0;
                    return aT < bT ? 1 : aT > bT ? -1 : 0;
                });
            },
            getBetOtherOptionsMoney: (option) => {
                return (
                    this.bet.options
                        .filter((o) => o.i !== option.i)
                        .map((o) =>
                            o.participants.length
                                ? o.participants
                                      .map((b) => b.betMoney)
                                      .reduce((a, b) => a + b)
                                : 0
                        )
                        .reduce((a, b) => a + b) || 1
                );
            },
            getBetOptionMoney: (option) => {
                return option.participants.length
                    ? option.participants
                          .map((b) => b.betMoney)
                          .reduce((a, b) => a + b)
                    : 0;
            },
            getBetOptionAvg: (option) => {
                const betOptionMoney = this.getBetOptionMoney(option);
                if (!betOptionMoney || !option.participants.length) {
                    return 0;
                }
                return betOptionMoney / option.participants.length;
            },
            getBetOptionRate: (option) => {
                const betOptionMoney = this.getBetOptionMoney(option);
                const otherBetOptionsMoney =
                    this.getBetOtherOptionsMoney(option);
                if (!betOptionMoney || !otherBetOptionsMoney) {
                    return "0";
                }
                return (1 / (betOptionMoney / otherBetOptionsMoney)).toFixed(2);
            },
            process: async () => {
                this.status = "Waiting for new bet...";
                await wait(2000);

                // init bet data
                const amountOptions = random(2, 5);
                for (let i = 0; i < amountOptions; i++) {
                    this.bet.options.push({
                        i: ["A", "B", "C", "D"][i],
                        participants: [],
                    });
                }
                this.bet.started = true;
                this.bet.amount = 0;
                this.status = "It's bet time";
                const betTime = random(10000, 20000);
                const betTick = 100;
                this.bet.timeStart = new Date().getTime();
                this.bet.timeEnd = this.bet.timeStart + betTime;
                // create pseudo-realistic bet behavior
                await new Promise((r) => {
                    let betProc;
                    const progressProc = setInterval(
                        () => this.bet.progressKey++,
                        200
                    );
                    setTimeout(() => {
                        betProc = setInterval(() => {
                            this.population.forEach((b) => {
                                if (b.betOption === null) {
                                    if (random(0, betTime / betTick) < 7 / 10) {
                                        b.betOption = random(
                                            0,
                                            this.bet.options.length
                                        );
                                        b.betMoney = random(50, b.money * 0.4);
                                        this.bet.options[
                                            b.betOption
                                        ].participants.push(b);
                                        this.bet.amount++;
                                    }
                                } else {
                                    if (
                                        b.money - b.betMoney > 0 &&
                                        random(0, betTime / betTick) < 1 / 30
                                    ) {
                                        b.betMoney += random(
                                            1,
                                            b.money - b.betMoney + 1
                                        );
                                        this.bet.amount++;
                                    }
                                }
                            });
                        }, betTick);
                    }, 1000);

                    setTimeout(() => {
                        clearInterval(betProc);
                        clearInterval(progressProc);
                        r();
                    }, betTime);
                });

                // bet is over
                this.status = "Waiting for results...";
                this.bet.timeStart = null;
                this.bet.timeEnd = null;
                await wait(5000);

                // show results
                const winner = random(0, this.bet.options.length);
                this.status = `"${this.bet.options[winner].i}" wins !`;
                const results = {
                    winners: this.bet.options[winner].participants,
                    totalGained: 0,
                };
                results.totalGained = this.population
                    .filter(
                        (b) => b.betOption !== null && b.betOption !== winner
                    )
                    .map((b) => b.money)
                    .reduce((a, b) => a + b);
                this.bet.results = results;
                await wait(5000);

                // end process : reset bet data
                const totalWinnerBet = results.winners
                    .map((b) => b.betMoney)
                    .reduce((a, b) => a + b);
                results.winners.forEach((w) => {
                    const ratio = w.betMoney / totalWinnerBet;
                    w.money += parseInt(results.totalGained * ratio);
                    w.betOption = null;
                    w.betMoney = null;
                });
                this.population
                    .filter((b) => b.betOption !== null)
                    .forEach((b) => {
                        b.money -= b.betMoney;
                        b.betOption = null;
                        b.betMoney = null;
                    });
                this.bet.started = false;
                this.bet.options = [];
                this.bet.results = null;
                this.bet.amount = 0;
                setTimeout(this.process, 1);
            },
        };
    },
    computed: {},
    mounted() {
        this.process();
    },
    template: `
        <div class="w-100">
            <div class="row">
                <h4 class="text-center">{{status}}</h4>
            </div>
            <div class="row">
                <div class="progress" :key="bet.progressKey" :style="{
                    width: this.getBetTimeProgress() + '%',
                }"></div>
            </div>
            <div class="row">
                <div class="col d-flex flex-column">
                    <span>Amount of bots: {{population.length}}</span>
                    <span>Avg money: {{formatMoney(getAvgMoney())}}</span>
                    <span>Total money: {{formatMoney(getTotalMoney())}}</span>
                    <span>Total bets: {{bet.amount}}</span>
                </div>
                <div class="col d-flex flex-column">
                    <div class="d-flex flex-column" v-if="bet.started">
                        <div class="col bet-option d-flex flex-column px-2" v-for="o in getBetsToShow()">
                            <h5>Option {{o.i}}</h5>
                            <span>Participants: {{o.participants.length}}</span>
                            <span>Total: {{formatMoney(getBetOptionMoney(o))}}</span>
                            <span>Avg: {{formatMoney(getBetOptionAvg(o))}}</span>
                            <span>Rate: {{getBetOptionRate(o)}}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
};
