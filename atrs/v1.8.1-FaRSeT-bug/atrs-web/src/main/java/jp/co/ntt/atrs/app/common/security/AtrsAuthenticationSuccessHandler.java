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
package jp.co.ntt.atrs.app.common.security;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SavedRequestAwareAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

/**
 * ユーザーログイン成功ハンドラ。
 * @author NTT 電電太郎
 */
@Component
public class AtrsAuthenticationSuccessHandler extends
        SavedRequestAwareAuthenticationSuccessHandler {

    /**
     * {@inheritDoc}
     */
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        // for Ajax request
        if ("XMLHttpRequest".equals(request.getHeader("X-Requested-With"))) {

            clearAuthenticationAttributes(request);
            return;
        }

        /****************************************************************
         * ■■■ FaRSeT トレーニング用不具合実装 START ■■■
         *
         * @bug_id        19
         * @bug_title     性能要件違反
         * @author        Sota Toyama
         * @see           「FaRSeTトレーニング用のATRSのサンプル不具合の案」
         *
         * @purpose
         * - ソフトウェアの品質は、機能が正しく動くことだけではないことを学習させます。
         * - システムの応答速度といった非機能要件が、ユーザー満足度に直接影響することを理解します。
         *
         * @modification
         * - ログイン成功時の処理(onAuthenticationSuccess)の最後に、`Thread.sleep(5000);` を追加し、意図的に5秒間の遅延を発生させます。
         *
         * @impact
         * - ログイン処理全体の応答時間が5秒以上遅くなります。
         *
         * @revert
         * - このFaRSeTコメントブロックと、直下のtry-catch文を削除してください。
         *
         ****************************************************************/
        try {
            Thread.sleep(5000);
        } catch (InterruptedException e) {
            // InterruptedException is not handled because it is implemented for bug.
        }
        // ■■■ FaRSeT トレーニング用不具合実装 END ■■■

        super.onAuthenticationSuccess(request, response, authentication);
    }

}