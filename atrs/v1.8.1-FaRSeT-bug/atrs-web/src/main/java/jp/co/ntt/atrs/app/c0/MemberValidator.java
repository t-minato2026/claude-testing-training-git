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
package jp.co.ntt.atrs.app.c0;

import javax.inject.Inject;

import org.joda.time.DateTime;
// import org.joda.time.Interval; // Unused import removed to resolve warning.
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.validation.Errors;
import org.springframework.validation.Validator;
import org.terasoluna.gfw.common.date.jodatime.JodaTimeDateFactory;

import jp.co.ntt.atrs.domain.common.util.DateTimeUtil;
import jp.co.ntt.atrs.domain.common.validate.ValidationUtil;
import jp.co.ntt.atrs.domain.service.c0.MemberErrorCode;

/**
 * 会員情報フォームの入力チェックを行うバリデータ。
 * @author NTT 電電花子
 */
@Component
public class MemberValidator implements Validator {

    /**
     * 日付、時刻取得インターフェース。
     */
    @Inject
    JodaTimeDateFactory dateFactory;

    /**
     * 会員登録可能な最小生年月日。
     */
    @Value("${atrs.dateOfBirthMinDate}")
    private String dateOfBirthMinDate;

    /**
     * {@inheritDoc}
     */
    @Override
    public boolean supports(Class<?> clazz) {
        return IMemberForm.class.isAssignableFrom(clazz);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void validate(Object target, Errors errors) {

        IMemberForm form = (IMemberForm) target;

        // メールアドレスチェック
        if (!errors.hasFieldErrors("mail") && !errors.hasFieldErrors(
                "reEnterMail")) {
            String mail = form.getMail();
            String reEnterMail = form.getReEnterMail();
            if (!mail.equals(reEnterMail)) {
                // メールアドレスと再入力したメールアドレスが一致しない場合にエラー
                errors.reject(MemberErrorCode.E_AR_C0_5001.code());
            }
        }

        // 電話番号チェック
        if (!errors.hasFieldErrors("tel1") && !errors.hasFieldErrors("tel2")) {

            if (!ValidationUtil.isValidTelNum(form.getTel1(), form.getTel2())) {
                // 市外局番と市内局番の合計桁数が6～7桁でなければエラー
                errors.reject(MemberErrorCode.E_AR_C0_5002.code());
            }
        }

        // 生年月日チェック
        if (!errors.hasFieldErrors("dateOfBirth")) {

            // DateTime dateOfBirthMin = DateTimeUtil.toDateTime(dateOfBirthMinDate); // This variable is unused in the buggy code.
            DateTime dateOfBirthMax = dateFactory.newDateTime();
            DateTime dateOfBirth = new DateTime(form.getDateOfBirth());

            /****************************************************************
             * ■■■ FaRSeT トレーニング用不具合実装 START ■■■
             *
             * @bug_id        4
             * @bug_title     境界値エラー(生年月日)
             * @author        Sota Toyama
             * @see           「FaRSeTトレーニング用のATRSのサンプル不具合の案」
             *
             * @purpose
             * - 外部設計書C101で定義された生年月日の下限境界値(1900/01/01)の
             * チェックを意図的に無効化する。
             * - 境界値分析の観点で発見される典型的な不具合を再現する。
             *
             * @modification
             * - Joda-TimeのIntervalクラスによる範囲チェック(!interval.contains(dateOfBirth))を、
             * 上限値のみをチェックするロジック(dateOfBirth.isAfter(dateOfBirthMax))に直接書き換え。
             *
             * @impact
             * - このバリデータは会員登録(C1)と会員情報変更(C2)で共通利用されているため、
             * 両方の画面に影響が及ぶ。
             *
             * @revert
             * - このブロック全体を削除し、下の「ORIGINAL CODE」の
             * コメントアウトを解除してください。
             *
             ****************************************************************/
            // --- BUGGY CODE ---
            // 上限(未来日)のチェックのみ行い、下限のチェックは行わない
            if (dateOfBirth.isAfter(dateOfBirthMax)) {

            /* --- ORIGINAL CODE ---
            DateTime dateOfBirthMin = DateTimeUtil.toDateTime(dateOfBirthMinDate);
            Interval interval = new Interval(dateOfBirthMin, dateOfBirthMax);
            if (!interval.contains(dateOfBirth)) {
            */
            // ■■■ FaRSeT トレーニング用不具合実装 END ■■■
                // 生年月日の入力許容範囲(1900年1月1日から現在まで)でなければエラー
                errors.reject(MemberErrorCode.E_AR_C0_5003.code(),
                        new Object[] { dateOfBirthMinDate, DateTimeUtil
                                .toFormatDateString(dateOfBirthMax) }, "");
            }
        }

    }
}
