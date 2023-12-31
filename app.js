const sum = (a, b) => a + b;

const App = {
    data() {
        let self = {
            population: [],
            bet: {
                number: 1,
                progress: {
                    width: 0,
                    transitionTime: null,
                    warning: false,
                },
                started: false,
                proc: null,
                options: [],
                results: null,
                amount: 0,
                betable: false,
            },
        };

        const init = (botAmount) => {
            if (this.bet) {
                self = this;
                self.stats.target = null;
                self.stats.history.open = false;
                clearInterval(self.naturalGainProc);
                self.naturalGainProc = null;
            }
            self.population = [];
            const names = shuffleNames(botAmount);
            for (let i = 0; i < botAmount; i++) {
                const money = random(50, 20000);
                if (i === 0) {
                    // player
                    self.population.push(new Bot(i, "You", money, true));
                } else {
                    self.population.push(new Bot(i, names[i], money));
                }
            }

            self.bet.number = 1;
            self.bet.progress.width = 0;
            self.bet.progress.transitionTime = null;
            self.bet.progress.warning = false;
            self.bet.started = false;
            self.bet.options = [];
            self.bet.results = null;
            self.bet.amount = 0;
            self.bet.proc = null;
        };
        init(100);

        return {
            population: self.population,
            status: "",
            bet: self.bet,
            stats: {
                target: null,
                history: {
                    open: false,
                },
            },
            naturalGainProc: null,
            reset: false,
            init,
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
                if (!this.naturalGainProc) {
                    this.naturalGainProc = setInterval(() => {
                        this.population.forEach((b) => (b.money += 50));
                    }, 15_000);
                }

                await this.processWaitBeforeStart();
                if (!this.bet.started) {
                    setTimeout(this.process, 1);
                    return;
                }

                await this.processCreateOptions();
                if (!this.bet.started) {
                    setTimeout(this.process, 1);
                    return;
                }

                await this.processBet();
                if (!this.bet.started) {
                    setTimeout(this.process, 1);
                    return;
                }

                await this.processWaitForResults();
                if (!this.bet.started) {
                    setTimeout(this.process, 1);
                    return;
                }

                await this.processShowResults();
                if (!this.bet.started) {
                    setTimeout(this.process, 1);
                    return;
                }

                await this.processEnd();

                setTimeout(this.process, 1);
            },
            processWaitBeforeStart: async () => {
                this.status = `Get ready for bet #${this.bet.number} ...`;
                this.bet.started = true;
                await wait(2000);
            },
            processCreateOptions: async () => {
                this.bet.options = [];
                const amountOptions = random(2, 9);
                for (let i = 0; i < amountOptions; i++) {
                    this.bet.options.push({
                        i: ["A", "B", "C", "D", "E", "F", "G", "H"][i],
                        participants: [],
                    });
                }
                this.bet.amount = 0;
            },
            processBet: async () => {
                let cancelled = false;
                this.status = "It's bet time";
                const betTime = random(10000, 20000);
                const betTick = 100;
                this.bet.betable = true;
                // create pseudo-realistic bet behavior
                await new Promise((r) => {
                    this.bet.progress.width = 100;
                    setTimeout(() => {
                        this.bet.progress.transitionTime = betTime;
                        this.bet.progress.width = 0;
                    }, 1);
                    setTimeout(() => {
                        this.bet.proc = setInterval(() => {
                            this.population
                                .filter((b) => !b.isPlayer)
                                .forEach((b) => {
                                    if (!this.bet.started || cancelled) {
                                        return;
                                    }
                                    if (b.betOption === null) {
                                        if (
                                            b.money > 0 &&
                                            random(0, betTime / betTick) <
                                                7 / 10
                                        ) {
                                            b.betOption = random(
                                                0,
                                                this.bet.options.length
                                            );
                                            b.betMoney = random(
                                                1,
                                                b.money * 0.4
                                            );
                                            b.money -= b.betMoney;
                                            this.bet.options[
                                                b.betOption
                                            ]?.participants.push(b);
                                            this.bet.amount++;
                                        }
                                    } else {
                                        if (
                                            b.money > 0 &&
                                            random(0, betTime / betTick) <
                                                1 / 30
                                        ) {
                                            const amount = random(
                                                1,
                                                b.money + 1
                                            );
                                            b.betMoney += amount;
                                            b.money -= amount;
                                            this.bet.amount++;
                                        }
                                    }
                                });
                            if (!this.bet.started && !cancelled) {
                                cancelled = true;
                                clearInterval(this.bet.proc);
                                this.bet.proc = null;
                                r();
                                return;
                            }
                        }, betTick);
                    }, 1000);

                    setTimeout(() => {
                        if (!cancelled) {
                            clearInterval(this.bet.proc);
                            this.bet.proc = null;
                            r();
                        }
                    }, betTime);
                    setTimeout(() => {
                        if (!cancelled) {
                            this.bet.progress.warning = true;
                        }
                    }, betTime - 3000);
                });
            },
            processWaitForResults: async () => {
                this.bet.betable = false;
                this.status = "Waiting for results...";
                this.bet.progress.transitionTime = null;
                this.bet.progress.warning = false;
                return new Promise((r) => {
                    this.bet.proc = setInterval(() => {
                        if (!this.bet.started) {
                            clearInterval(this.bet.proc);
                            this.bet.proc = null;
                            r();
                        }
                    }, 200);
                    setTimeout(() => {
                        clearInterval(this.bet.proc);
                        this.bet.proc = null;
                        r();
                    }, 5000);
                });
            },
            processShowResults: async () => {
                const winner = random(0, this.bet.options.length);
                const results = {
                    option: this.bet.options[winner],
                    winners: this.bet.options[winner].participants,
                    totalGained: 0,
                };
                this.status = `Option ${this.bet.options[winner].i} won !<br/>${
                    results.winners.length
                } participants will obtain ${formatMoney(
                    this.getBetOtherOptionsMoney(results.option)
                )} $`;
                results.totalGained = this.population
                    .filter(
                        (b) => b.betOption !== null && b.betOption !== winner
                    )
                    .map((b) => b.betMoney)
                    .reduce(sum);
                this.bet.results = results;

                return new Promise((r) => {
                    this.bet.proc = setInterval(() => {
                        if (!this.bet.started) {
                            clearInterval(this.bet.proc);
                            this.bet.proc = null;
                            r();
                        }
                    }, 200);
                    setTimeout(() => {
                        clearInterval(this.bet.proc);
                        this.bet.proc = null;
                        r();
                    }, 5000);
                });
            },
            processEnd: async () => {
                const results = this.bet.results;
                // reset bet data
                if (results.winners.length) {
                    const totalWinnerBet = results.winners
                        .map((b) => b.betMoney)
                        .reduce(sum);
                    results.winners.forEach((w) => {
                        const ratio = w.betMoney / totalWinnerBet;
                        const gain = parseInt(results.totalGained * ratio);
                        w.history.push(
                            new BotHistoryEntry(
                                this.bet.number,
                                true,
                                w.betMoney,
                                gain
                            )
                        );
                        w.money += w.betMoney + gain;
                        w.betOption = null;
                        w.betMoney = null;
                    });
                    this.population
                        .filter((b) => b.betOption !== null)
                        .forEach((b) => {
                            b.history.push(
                                new BotHistoryEntry(
                                    this.bet.number,
                                    false,
                                    b.betMoney
                                )
                            );
                            b.betOption = null;
                            b.betMoney = null;
                        });
                } else {
                    // no one bet on winner option
                    this.population
                        .filter((b) => b.betOption !== null)
                        .forEach((b) => {
                            b.history.push(
                                new BotHistoryEntry(
                                    this.bet.number,
                                    false,
                                    b.betMoney,
                                    0,
                                    true
                                )
                            );
                            b.betOption = null;
                            b.money += b.betMoney;
                            b.betMoney = null;
                        });
                }
                this.bet.started = false;
                this.bet.options = [];
                this.bet.results = null;
                this.bet.amount = 0;
                this.bet.number++;
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
            getStatGlobalRank: (p) => {
                return (
                    this.population
                        .map((b) => {
                            return {
                                i: b.name,
                                val: b.money + b.betMoney,
                            };
                        })
                        .sort((a, b) => (a.val > b.val ? -1 : 1))
                        .map((b) => b.i)
                        .indexOf(p.name) + 1
                );
            },
            changeBotsAmount: () => {
                const min = 20,
                    max = 500;
                const input = prompt(`Enter amount of bots (${min}-${max})`);
                const parsed = input && parseInt(input);
                if (input && !isNaN(parsed)) {
                    const val = Math.max(min, Math.min(max, parsed));
                    this.init(val);
                    this.status = "Cleaning last session...";
                }
            },
            createPlayerBet: (option) => {
                if (this.bet.betable) {
                    const player = this.population[0];
                    const optionIndex = this.bet.options.indexOf(option);
                    const input = prompt(
                        `How much do you want to bet on ${option.i} ? (You have ${player.money} $)`
                    );
                    const parsed = input && parseInt(input);
                    if (input && !isNaN(parsed) && player.money >= parsed) {
                        player.betOption = optionIndex;
                        if (player.betMoney === null) {
                            player.betMoney = parsed;
                            option.participants.push(player);
                        } else {
                            player.betMoney += parsed;
                        }
                        player.money -= parsed;
                        this.bet.amount++;
                    }
                }
            },
        };
    },
    mounted() {
        this.process();
    },
    beforeUnmount() {
        clearInterval(this.naturalGainProc);
    },
    template: `
        <div class="w-100">
            <div class="row">
                <div class="w-100 d-flex justify-content-evenly align-items-center">
                    <span class="fake-btn cursor-pointer" @click="changeBotsAmount()">{{population.length}} bots</span>
                    <span>Avg: {{formatMoney(getAvgMoney())}} $</span>
                    <span>Median: {{formatMoney(getMedianMoney())}} $</span>
                    <span>Total: {{formatMoney(getTotalMoney())}} $</span>
                </div>
            </div>
            <hr />
            <div class="row justify-content-evenly">
                <div class="w-100 d-flex justify-content-evenly align-items-center">
                    <span :title="population[0].money + ' $'">Your money: {{formatMoney(population[0].money)}} $</span>
                    <span>Your rank: #{{getStatGlobalRank(population[0])}}</span>
                </div>
            </div>
            <div v-if="population[0].betOption !== null" class="row justify-content-center">
                <div class="w-100 d-flex justify-content-evenly align-items-center"
                    :class="{
                        'text-win': bet.results &&
                            bet.options[population[0].betOption]?.i === bet.results.option.i,
                        'text-lose': bet.results && bet.options[population[0].betOption]?.i !== bet.results.option.i
                    }">
                    <span>placed {{formatMoney(population[0].betMoney)}} $ on {{bet.options[population[0].betOption].i}}</span>
                    <span class="px-2">⇒</span>
                    <span>{{
                        !bet.results ?
                        "could win " + formatMoney(getPotentialGain(population[0])) + " $" :
                        bet.options[population[0].betOption]?.i === bet.results.option.i ?
                            "won " + formatMoney(getPotentialGain(population[0])) + " $" :
                            "lost " + formatMoney(population[0].betMoney) + " $"
                    }}</span>
                </div>
            </div>
            <hr />
            <div class="row mt-3">
                <h4 class="text-center" v-html="status"/>
            </div>
            <div class="row">
                <div class="progress"
                    :class="{
                        warning: bet.progress.warning,
                    }"
                    :style="{
                        width: bet.progress.width + '%',
                        transition: bet.progress.transitionTime ?
                            'width ' + bet.progress.transitionTime + 'ms' :
                            'none',
                        transitionTimingFunction: 'linear',
                    }">
                </div>
            </div>
            <div class="row mt-3">
                <h5 class="text-center">Bet Infos:</h5>
                <div class="w-100 d-flex justify-content-evenly">
                    <span>Bet #{{bet.number}}</span>
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
                            winner: bet.results?.option.i === o.i,
                            betable: bet.betable,
                            'cursor-pointer': bet.betable,
                        }"
                        @click="createPlayerBet(o)">
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
                        winner: b.betOption !== null && bet.results?.option.i === bet.options[b.betOption]?.i
                    }"
                    @click="stats.target = stats.target?.name !== b.name ? b : null">
                        <div class="bet-money"
                            :style="{height:getStatBetMoneyHeight(b)+'%'}"></div>
                        <div class="money"
                            :style="{height:getStatMoneyHeight(b)+'%'}"></div>
                </div>
            </div>
            <div v-if="stats.target" class="stats-details w-100 d-flex justify-content-evenly pt-2">
                <span>Participant #{{stats.target.i+1}}: {{stats.target.name}}</span>
                <span>Money: {{formatMoney(stats.target.money)}} $</span>
                <span>Rank #{{getStatGlobalRank(stats.target)}}</span>
            </div>
            <div v-if="stats.target && stats.target.betOption !== null"
                class="stats-details w-100 d-flex justify-content-center"
                :class="{
                    'text-win': bet.results &&
                        bet.options[stats.target.betOption]?.i === bet.results.option.i,
                    'text-lose': bet.results && bet.options[stats.target.betOption]?.i !== bet.results.option.i
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
                    bet.options[stats.target.betOption]?.i === bet.results.option.i ?
                        "won " + formatMoney(getPotentialGain(stats.target)) + " $" :
                        "lost " + formatMoney(stats.target.betMoney) + " $"
                }}</span>
            </div>
            <div v-if="stats.target?.history.length" class="stats-details w-100 d-flex flex-column px-2">
                <h5 class="d-flex justify-content-center">
                    <span class="d-flex align-items-center cursor-pointer" @click="stats.history.open = !stats.history.open">
                        <span class="mx-1">History</span>
                        <span class="mx-1 arrow" :class="{reverse: stats.history.open}" />
                    </span>
                </h5>
                <div v-if="stats.history.open"
                    v-for="h in stats.target.history"
                    class="w-100 history-entry">
                    <span v-if="h.draw">Bet #{{h.betNumber}}: placed {{formatMoney(h.amountBet)}} $ but no one won</span>
                    <span v-else-if="h.win" class="text-win">Bet #{{h.betNumber}}: placed {{formatMoney(h.amountBet)}} $ and won {{formatMoney(h.amountWon)}} $</span>
                    <span v-else class="text-lose">Bet #{{h.betNumber}}: placed {{formatMoney(h.amountBet)}} $ and lost</span>
                </div>
            </div>
        </div>
    `,
};
