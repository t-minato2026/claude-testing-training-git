<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<footer id="footer">
    <div class="container">
<%--
/****************************************************************
 * ■■■ FaRSeT トレーニング用不具合実装 START ■■■
 *
 * @bug_id        2 (Alternative)
 * @bug_title     [表示内容の誤り] フッターのコピーライト表記が、実在しない企業名になっている
 * @author        Sota Toyama
 * @see           「FaRSeTトレーニング用のATRSのサンプル不具合の案」
 *
 * @purpose
 * - 仕様書で定義された文言や固定値が、正しく実装されているかを確認するテストの重要性を学習させます。
 *
 * @modification
 * - フッター(footer.jsp)のコピーライト表記を、「NTT Corporation」から「Stark Industries」に書き換えました。
 *
 * @impact
 * - 全ページのフッターに表示されるコピーライトの会社名が「Stark Industries」になります。
 *
 * @revert
 * - このFaRSeTコメントブロックを削除し、直下の<span>タグ内の会社名を「Stark Industries」から「NTT Corporation」に戻します。
 *
 ****************************************************************/
--%>
        <span>Copyright(c) 2015 Stark Industries.</span>
    </div>
</footer>