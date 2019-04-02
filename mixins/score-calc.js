var scoreCalcMixin = {
    data: {
        TURN_SCORE_BASE: {
            ENDLESS_TOWER: 5200,
            STEAM_TOWER: 4300,
        },
        TURN_SCORE_MIN: 100, // 70ターン以上でスコア100が最小
        TURN_SCORE_MAX: 4000, // スコア4000が最大
        DAMAGE_SCORE_MIN: 100,
        DAMAGE_SCORE_MAX: 5000, // 約5億ダメでスコア5000が最大らしい
        CHAIN_SCORE_MIN: 300,
        CHAIN_SCORE_MAX: 4800, // 16連鎖でスコア4800が最大らしい
    },
    methods: {
        calcTotalScore: function(turn, damage, chain, bonus) {
            let base = this.calcBaseScore(turn, damage, chain, bonus);
            return base + this.calcBonusScore(base, bonus);
        },
        calcBaseScore: function(turn, damage, chain, bonus) {
            return this.calcChainScore(chain) + this.calcDamageScore(damage) + this.calcTurnScore(turn, bonus);
        },
        calcTurnScore: function(turn, bonus) {
            turn = this._normalize(turn, 0);
            // とことんの塔と蒸気と暗闇の塔でターンスコアの開始値が違う
            let base = this.isSteamTower(bonus) ? this.TURN_SCORE_BASE.STEAM_TOWER : this.TURN_SCORE_BASE.ENDLESS_TOWER;
            let r = base - (60 * turn);
            return this._normalize(r, this.TURN_SCORE_MIN, this.TURN_SCORE_MAX);
        },
        calcDamageScore: function(damage) {
            // 計算式はみんなのスコアを1ページ分とって回帰分析して算出 (クリアターンも同じ)
            // https://keisan.casio.jp/edamageec/system/1402032384
            damage = this._normalize(damage, 0);
            let r = Math.round(282.25228 * Math.log(damage) - 648.872);
            return this._normalize(r, this.DAMAGE_SCORE_MIN, this.DAMAGE_SCORE_MAX);
        },
        calcChainScore: function(chain) {
            chain = this._normalize(chain, 0);
            let r = 300 * chain;
            return this._normalize(r, this.CHAIN_SCORE_MIN, this.CHAIN_SCORE_MAX);
        },
        calcBonusScore: function(base, bonus) {
            bonus = this._normalize(bonus, 0);
            return Math.round(base * bonus / 100);
        },
        isSteamTower: function(bonus) {
            return 400 <= bonus; // dirty hack: 400%以上なら蒸気と暗闇の塔と判断
        },
        _normalize: function(x, min, max) {
            if (min && x < min) {
                x = min;
            }
            if (max && max < x) {
                x = max;
            }
            return x;
        },
    },
}