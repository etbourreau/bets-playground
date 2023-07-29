const random = (min, max) => {
    return parseInt(Math.random() * (max - min) + min);
};

const wait = async (ms) => new Promise((r) => setTimeout(r, ms));

const formatMoney = (money) => {
    if (money < 1_000) {
        return parseInt(money);
    } else if (money < 1_000_000) {
        return `${parseInt(money / 100) / 10}K`;
    } else if (money < 1_000_000_000) {
        return `${parseInt(money / 100_000) / 10}M`;
    } else {
        return `${parseInt(money / 100_000_000) / 10}B`;
    }
};
