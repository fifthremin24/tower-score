var scoreCalcMixin = {
    data: {
        // フロアごとのフロアボーナスとターンスコアの開始値
        FLOOR_SETTING: {
            // 蒸気と暗闇の塔 ④
            steam4: { bonus: 400, turn_score_base: 5 },
            // 蒸気と暗闇の塔 ③
            steam3: { bonus: 400, turn_score_base: 5 },
            // 蒸気と暗闇の塔 ②
            steam2: { bonus: 400, turn_score_base: 10 },
            // 蒸気と暗闇の塔 ①
            steam1: { bonus: 400, turn_score_base: 5 },
            // とことんの塔 (n5とn10は20ターンでフルスコア、それ以外は15ターンでフルスコア)
            endless5b: { bonus: 160, turn_score_base: 20 },
            endless5n: { bonus: 160, turn_score_base: 15 },
            endless4b: { bonus: 120, turn_score_base: 20 },
            endless4n: { bonus: 120, turn_score_base: 15 },
            endless3b: { bonus: 80, turn_score_base: 20 },
            endless3n: { bonus: 80, turn_score_base: 15 },
            endless2b: { bonus: 40, turn_score_base: 20 },
            endless2n: { bonus: 40, turn_score_base: 15 },
            endless1b: { bonus: 0, turn_score_base: 20 },
            endless1n: { bonus: 0, turn_score_base: 15 },
        },
        TURN_SCORE_MIN: 100, // スコア100が最小
        TURN_SCORE_MAX: 4000, // スコア4000が最大
        TURN_SCORE_DEDUCTION: 60, // 1ターン毎60点減点
        DAMAGE_SCORE_MIN: 0, // 0ダメだとスコア0
        DAMAGE_SCORE_MAX: 5000, // 約5億ダメでスコア5000が最大らしい
        CHAIN_SCORE_MIN: 300,
        CHAIN_SCORE_MAX: 4800, // 16連鎖でスコア4800が最大らしい
    },
    methods: {
        turnScoreRange: function (floor) {
            let base = this.FLOOR_SETTING[floor].turn_score_base;
            return [base, Math.floor((this.TURN_SCORE_MAX / this.TURN_SCORE_DEDUCTION) + base)];
        },
        calcTotalScore: function(turn, damage, chain, floor) {
            let base = this.calcBaseScore(turn, damage, chain, floor);
            return base + this.calcBonusScore(base, floor);
        },
        calcBaseScore: function(turn, damage, chain, floor) {
            return this.calcChainScore(chain) + this.calcDamageScore(damage) + this.calcTurnScore(turn, floor);
        },
        calcTurnScore: function(turn, floor) {
            turn = this._normalize(turn, 0);
            // とことんの塔と蒸気と暗闇の塔でターンスコアの減点開始のターンが違う
            let base = this.FLOOR_SETTING[floor].turn_score_base;
            if (turn <= base)
                return this.TURN_SCORE_MAX;
            let r = this.TURN_SCORE_MAX - ((turn - base) * this.TURN_SCORE_DEDUCTION);
            return this._normalize(r, this.TURN_SCORE_MIN, this.TURN_SCORE_MAX);
        },
        calcDamageScore: function(damage) {
            // 計算式はみんなのスコアを1ページ分とって回帰分析して算出 (クリアターンも同じ)
            // https://keisan.casio.jp/exec/system/1402032384
            //
            // 以下の式が得られます。
            //   y=A+Bln(x)
            //   A=-650.793
            //   B=282.3762
            //
            // 底の変換公式を利用してeを底とする自然対数から10を底とする常用対数に変換します。
            //   ln(x) = log_e(x) = log_10(x) / log_10(e)
            //
            // 元の式に当てはめて計算します。
            //   y = A+B(log_10(x) / log_10(e))
            //     = -650.793 + 282.3762 * (log_10(x) / log_10(e))
            //     = -650.793 + log_10(x) * (282.3762 / log_10(e))
            //     = -650.793 + log_10(x) * 650.195
            //     ≒ -650 + log_10(x) * 650
            //     = (log_10(x) - 1) * 650
            //
            // 変換した式を計算すると650という似た数字が現れます。
            // 650.793や、650.195の元となった数字の282.3762は回帰分析によって得られた近似式であり
            // 誤差を含むので元の式は650で間違いないでしょう。
            damage = this._normalize(damage, 0);
            if (damage <= 0) return 0;
            let base = Math.log10(damage);
            if (base <= 1) return 1;
            let r = Math.ceil(650 * (base - 1));
            return this._normalize(r, this.DAMAGE_SCORE_MIN, this.DAMAGE_SCORE_MAX);
        },
        calcChainScore: function(chain) {
            chain = this._normalize(chain, 0);
            let r = 300 * chain;
            return this._normalize(r, this.CHAIN_SCORE_MIN, this.CHAIN_SCORE_MAX);
        },
        calcBonusScore: function(base, floor) {
            let bonus = this.FLOOR_SETTING[floor].bonus;
            return Math.ceil(base * bonus / 100);
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