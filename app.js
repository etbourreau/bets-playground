const sum = (a, b) => a + b;

const App = {
    data() {
        const population = [];
        const botAmount = random(20, 500);
        for (let i = 0; i < botAmount; i++) {
            population.push(new Bot(i + 1, random(50, 20000)));
        }

        const bet = {
            progress: {
                key: 0,
                width: 0,
                transitionTime: null,
            },
            started: false,
            options: [],
            results: null,
            amount: 0,
        };

        return {
            population,
            status: "",
            bet,
            stats: {
                target: null,
            },
            naturalGainProc: null,
            formatMoney: (val) => formatMoney(val),
            getTotalMoney: () => {
                return this.population
                    .map((b) => b.money + b.betMoney)
                    .reduce(sum);
            },
            getAvgMoney: () => {
                return (this.getTotalMoney() / this.population.length).toFixed(
                    2
                );
            },
            getMedianMoney: () => {
                const list = this.population
                    .map((b) => b.money + b.betMoney)
                    .sort((a, b) => (a < b ? -1 : 1));
                return list[parseInt(list.length / 2)];
            },
            getBetsToShow: () => {
                return this.bet.options || [];
                // sort by most bet money
                return this.bet.options.sort((a, b) => {
                    const aT = a.participants.length
                        ? a.participants.map((p) => p.betMoney).reduce(sum)
                        : 0;
                    const bT = b.participants.length
                        ? b.participants.map((p) => p.betMoney).reduce(sum)
                        : 0;
                    return aT < bT ? 1 : aT > bT ? -1 : 0;
                });
            },
            getBetTotalParticipants: () => {
                return this.bet.options.length
                    ? this.bet.options
                          .map((o) => o.participants.length)
                          .reduce(sum)
                    : 0;
            },
            getBetTotalMoney: () => {
                return this.bet.options.length
                    ? this.bet.options
                          .map((o) =>
                              o.participants.length
                                  ? o.participants
                                        .map((p) => p.betMoney)
                                        .reduce(sum)
                                  : 0
                          )
                          .reduce(sum)
                    : 0;
            },
            getBetOtherOptionsMoney: (option) => {
                return (
                    this.bet.options
                        .filter((o) => o.i !== option.i)
                        .map((o) =>
                            o.participants.length
                                ? o.participants
                                      .map((b) => b.betMoney)
                                      .reduce(sum)
                                : 0
                        )
                        .reduce(sum) || 1
                );
            },
            getBetOptionMoney: (option) => {
                return option.participants.length
                    ? option.participants.map((b) => b.betMoney).reduce(sum)
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
                this.status = "Get ready for the next bet...";
                await wait(2000);

                // init bet data
                const amountOptions = random(2, 9);
                for (let i = 0; i < amountOptions; i++) {
                    this.bet.options.push({
                        i: ["A", "B", "C", "D", "E", "F", "G", "H"][i],
                        participants: [],
                    });
                }
                this.bet.started = true;
                this.bet.amount = 0;
                this.status = "It's bet time";
                const betTime = random(10000, 20000);
                const betTick = 100;
                // create pseudo-realistic bet behavior
                await new Promise((r) => {
                    this.bet.progress.width = 100;
                    setTimeout(() => {
                        this.bet.progress.transitionTime = betTime;
                        this.bet.progress.width = 0;
                    }, 1)
                    let betProc;
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
                                        b.money -= b.betMoney;
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
                                        const amount = random(
                                            1,
                                            b.money - b.betMoney + 1
                                        );
                                        b.betMoney += amount;
                                        b.money -= amount;
                                        this.bet.amount++;
                                    }
                                }
                            });
                        }, betTick);
                    }, 1000);

                    setTimeout(() => {
                        clearInterval(betProc);
                        r();
                    }, betTime);
                });

                // bet is over
                this.status = "Waiting for results...";
                this.bet.progress.transitionTime = null;
                await wait(5000);

                // show results
                const winner = random(0, this.bet.options.length);
                this.status = `"${this.bet.options[winner].i}" wins !`;
                const results = {
                    option: this.bet.options[winner],
                    winners: this.bet.options[winner].participants,
                    totalGained: 0,
                };
                results.totalGained = this.population
                    .filter(
                        (b) => b.betOption !== null && b.betOption !== winner
                    )
                    .map((b) => b.betMoney)
                    .reduce(sum);
                this.bet.results = results;
                await wait(5000);

                // end process : reset bet data
                if (results.winners.length) {
                    const totalWinnerBet = results.winners
                        .map((b) => b.betMoney)
                        .reduce(sum);
                    results.winners.forEach((w) => {
                        const ratio = w.betMoney / totalWinnerBet;
                        w.money += parseInt(results.totalGained * ratio);
                        w.betOption = null;
                        w.betMoney = null;
                    });
                    this.population
                        .filter((b) => b.betOption !== null)
                        .forEach((b) => {
                            b.betOption = null;
                            b.betMoney = null;
                        });
                } else {
                    // no one bet on winner option
                    this.population
                        .filter((b) => b.betOption !== null)
                        .forEach((b) => {
                            b.betOption = null;
                            b.money += b.betMoney;
                            b.betMoney = null;
                        });
                }
                this.bet.started = false;
                this.bet.options = [];
                this.bet.results = null;
                this.bet.amount = 0;
                setTimeout(this.process, 1);
            },
            getPotentialGain: (b) => {
                if (b.betOption === null) {
                    return 0;
                }
                let totalBetOption = 0,
                    totalBetOtherOptions = 0;
                this.bet.options.forEach((o, i) => {
                    const amount = o.participants.length
                        ? o.participants.map((b) => b.betMoney).reduce(sum)
                        : 0;
                    if (i === b.betOption) {
                        totalBetOption += amount;
                    } else {
                        totalBetOtherOptions += amount;
                    }
                });
                return (b.betMoney / totalBetOption) * totalBetOtherOptions;
            },
            getStatsPopulation: () => {
                return this.population.filter((p, i) => i < 100);
            },
            getStatsMaxMoney: () => {
                return this.getStatsPopulation()
                    .map((b) => b.money + b.betMoney)
                    .reduce((a, b) => (a > b ? a : b));
            },
            getStatMoneyHeight: (b) => {
                return parseInt((b.money / this.getStatsMaxMoney()) * 99) + 1;
            },
            getStatBetMoneyHeight: (b) => {
                if (!b.betMoney) {
                    return 0;
                }
                return (
                    parseInt((b.betMoney / this.getStatsMaxMoney()) * 100) + 1
                );
            },
        };
    },
    mounted() {
        this.process();
        this.naturalGainProc = setInterval(() => {
            this.population.forEach((b) => (b.money += 50));
        }, 15_000);
    },
    beforeUnmount() {
        clearInterval(this.naturalGainProc);
    },
    template: `
        <div class="w-100">
            <div class="row">
                <div class="w-100 d-flex justify-content-evenly">
                    <span>{{population.length}} bots</span>
                    <span>Avg: {{formatMoney(getAvgMoney())}} $</span>
                    <span>Median: {{formatMoney(getMedianMoney())}} $</span>
                    <span>Total: {{formatMoney(getTotalMoney())}} $</span>
                </div>
            </div>
            <hr />
            <div class="row mt-3">
                <h4 class="text-center">{{status}}</h4>
            </div>
            <div class="row">
                <div class="progress" :key="bet.progress.key" :style="{
                    width: bet.progress.width + '%',
                    transition: bet.progress.transitionTime ?
                        'width ' + bet.progress.transitionTime + 'ms' :
                        'none',
                    transitionTimingFunction: 'linear',
                }"></div>
            </div>
            <div class="row mt-3">
                <h5 class="text-center">Bet Infos:</h5>
                <div class="w-100 d-flex justify-content-evenly">
                    <span>Participants: {{getBetTotalParticipants()}}</span>
                    <span>Bets: {{bet.amount}}</span>
                    <span>Total: {{formatMoney(getBetTotalMoney())}} $</span>
                </div>
            </div>
            <div class="row justify-content-evenly" v-if="bet.started">
                <div class="col-3 mt-2 px-1"
                    v-for="o in getBetsToShow()">
                    <div class="bet-option d-flex flex-column p-2"
                        :class="{
                            winner: bet.results?.option.i === o.i
                        }">
                        <h5 class="text-center">Option {{o.i}}</h5>
                        <hr />
                        <span>Participants: {{o.participants.length}}</span>
                        <span>Total: {{formatMoney(getBetOptionMoney(o))}} $</span>
                        <span>Avg: {{formatMoney(getBetOptionAvg(o))}} $</span>
                        <span>Rate: {{getBetOptionRate(o)}}</span>
                    </div>
                </div>
            </div>
            <div class="row mt-3">
                <h4 class="text-center">Population{{population.length <= 100 ? "" : " (limited to 100)"}}</h4>
            </div>
            <div class="w-100 d-flex mt-2 money-stats">
                <div v-for="b in getStatsPopulation()"
                    class="flex-grow-1 h-100 cursor-pointer participant d-flex flex-column justify-content-end"
                    :class="{
                        active: stats.target?.name === b.name,
                        winner: b.betOption !== null && bet.results?.option.i === bet.options[b.betOption].i
                    }"
                    @click="stats.target = stats.target?.name !== b.name ? b : null">
                        <div class="bet-money"
                            :style="{height:getStatBetMoneyHeight(b)+'%'}"></div>
                        <div class="money"
                            :style="{height:getStatMoneyHeight(b)+'%'}"></div>
                </div>
            </div>
            <div v-if="stats.target" class="stats-details w-100 d-flex justify-content-evenly pt-2">
                <span>Participant {{stats.target.name}}</span>
                <span>Money: {{formatMoney(stats.target.money)}} $</span>
            </div>
            <div v-if="stats.target && stats.target.betOption !== null"
                class="stats-details w-100 d-flex justify-content-center"
                :class="{
                    'text-win': bet.results &&
                        bet.options[stats.target.betOption].i === bet.results.option.i,
                    'text-lose': bet.results && bet.options[stats.target.betOption].i !== bet.results.option.i
                }">
                <span>placed {{
                    formatMoney(stats.target.betMoney)
                }} $ on {{
                    bet.options[stats.target.betOption].i
                }}</span>
                <span class="px-2">⇒</span>
                <span>{{
                    !bet.results ?
                    "could win " + formatMoney(getPotentialGain(stats.target)) + " $" :
                    bet.options[stats.target.betOption].i === bet.results.option.i ?
                        "won " + formatMoney(getPotentialGain(stats.target)) + " $" :
                        "lost " + formatMoney(stats.target.betMoney) + " $"
                }}</span>
            </div>
        </div>
    `,
};
