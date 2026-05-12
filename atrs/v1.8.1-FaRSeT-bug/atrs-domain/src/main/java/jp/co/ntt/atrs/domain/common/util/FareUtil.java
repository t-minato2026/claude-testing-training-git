/*
 * Copyright(c) 2015 NTT Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
package jp.co.ntt.atrs.domain.common.util;

import java.math.BigDecimal;

/**
 * 運賃に関するユーティリティクラス。
 * @author NTT 電電太郎
 */
public class FareUtil {

    /**
     * 運賃切り上げに使用するスケール値。
     */
    private static final int CEIL_FARE_SCALE = -2;

    /**
     * コンストラクタ。
     */
    private FareUtil() {
        // 処理なし
    }

    /**
     * 運賃の100円未満の値を切上げる。
     * @param fare 運賃
     * @return 100円未満を切上げた運賃
     */
    public static int ceilFare(int fare) {
        /****************************************************************
         * ■■■ FaRSeT トレーニング用不具合実装 START ■■■
         *
         * @bug_id        7
         * @bug_title     計算ロジックの誤り
         * @author        Sota Toyama
         * @see           「FaRSeTトレーニング用のATRSのサンプル不具合の案」
         *
         * @purpose
         * - ビジネス上の金銭に関わるルール(端数処理)が、ソフトウェア上でいかに正確に実装されるべきかを学習させます。
         * - 一見小さな計算ミスが、積もり積もって大きな損失に繋がるリスクを理解します。
         *
         * @modification
         * - 運賃計算ユーティリティ(FareUtil.java)の`ceilFare`メソッドにて、端数処理を`BigDecimal.ROUND_UP`(切り上げ)から`BigDecimal.ROUND_DOWN`(切り下げ)に変更しました。
         *
         * @impact
         * - 運賃計算時に100円未満の端数が発生した場合、仕様である「切り上げ」ではなく「切り下げ」で計算されるようになります。
         *
         * @revert
         * - このFaRSeTコメントブロックと、直下の「BUGGY CODE」を削除し、
         * さらにその下にある「ORIGINAL CODE」のコメントアウト(/*と*&#47;)を解除してください。
         *
         ****************************************************************/

        // --- BUGGY CODE ---
        return new BigDecimal(fare).setScale(CEIL_FARE_SCALE,
                BigDecimal.ROUND_DOWN).intValue();

        /* --- ORIGINAL CODE ---
        return new BigDecimal(fare).setScale(CEIL_FARE_SCALE,
                BigDecimal.ROUND_UP).intValue();
        */
        // ■■■ FaRSeT トレーニング用不具合実装 END ■■■
    }
}