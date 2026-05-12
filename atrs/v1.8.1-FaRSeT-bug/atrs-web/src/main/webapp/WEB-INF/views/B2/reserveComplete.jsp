<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<%@ page
    import="org.springframework.security.core.AuthenticationException, org.springframework.security.web.WebAttributes"%>
<%@ taglib prefix="t" uri="http://terasoluna.org/tags"%>
<%@ taglib prefix="f" uri="http://terasoluna.org/functions"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="form" uri="http://www.springframework.org/tags/form"%>
<%@ taglib prefix="sec"
    uri="http://www.springframework.org/security/tags"%>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt"%>
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>予約完了 | Airline Ticket Reservation System</title>

<link rel="stylesheet"
    href="${pageContext.request.contextPath}/resources/vendor/bootstrap/css/bootstrap.min.css">
<link rel="stylesheet"
    href="${pageContext.request.contextPath}/resources/vendor/bootstrap/css/bootstrap-theme.min.css">
<link rel="stylesheet"
    href="${pageContext.request.contextPath}/resources/css/style.css">

</head>
<body>

    <jsp:include page="../A0/header.jsp" />

    <div class="container">

        <div class="row">

            <section class="col-md-12">

                <div class="alert alert-success">
                    <h2>ご予約を受け付けました。</h2>
                    <p>
                        ご予約ありがとうございました。<br>
                        期限までにご購入いただけない場合、すべてのフライトが自動的にキャンセルされます。
                    </p>
                </div>

                <h3>予約情報</h3>
                <table class="table table-bordered">
                    <tbody>
<%--
/****************************************************************
 * ■■■ FaRSeT トレーニング用不具合実装 START ■■■
 *
 * @bug_id        13 (Alternative)
 * @bug_title     [機能の欠落] 予約完了画面で予約番号の列を非表示にする
 * @author        Sota Toyama
 * @see           「FaRSeTトレーニング用のATRSのサンプル不具合の案」
 *
 * @purpose
 * - 仕様書で定義された必須の表示項目が、実装から漏れている「機能完全性」の不具合を学習させます。
 *
 * @modification
 * - 予約完了画面(reserveComplete.jsp)にて、予約番号を表示するテーブル行('<tr>'タグ)をコメントアウトしました。
 *
 * @impact
 * - 予約完了画面に、ユーザーが予約を識別するための最も重要な情報である「予約番号」が表示されなくなります。
 *
 * @revert
 * - このFaRSeTコメントブロックを削除し、直下の<%--と--%&gt;で囲まれた'<tr>'ブロックのコメントアウトを解除してください。
 *
 ****************************************************************/
--%>
                        <%--
                        <tr>
                            <th class="col-md-4">予約番号</th>
                            <td class="col-md-8">${f:h(reserveCompleteOutputDto.reserveNo)}</td>
                        </tr>
                        --%>
                        <tr>
                            <th>合計金額</th>
                            <td><fmt:formatNumber
                                    value="${reserveCompleteOutputDto.totalFare}"
                                    pattern="###,###" />円</td>
                        </tr>
                        <tr>
                            <th>お支払期限</th>
                            <td><fmt:formatDate
                                    value="${reserveCompleteOutputDto.paymentDate}"
                                    pattern="MM月dd日(E)" /></td>
                        </tr>
                    </tbody>
                </table>
            </section>

            <div class="text-center">
<%--
/****************************************************************
 * ■■■ FaRSeT トレーニング用不具合実装 START ■■■
 *
 * @bug_id        16
 * @bug_title     リンク切れ
 * @author        Sota Toyama
 * @see           「FaRSeTトレーニング用のATRSのサンプル不具合の案」
 *
 * @purpose
 * - ユーザーの一連の体験(ユーザージャーニー)は、一つのタスクが完了しても終わりではないことを学習させます。
 * - 次の行動へスムーズに繋げるナビゲーションの重要性を理解します。
 *
 * @modification
 * - 予約完了画面(reserveComplete.jsp)の「トップに戻る」ボタンのリンク先(`href`属性)を、正しいパスから機能しない "#" に変更しました。
 *
 * @impact
 * - 予約完了画面の「トップに戻る」ボタンが機能しなくなります。
 *
 * @revert
 * - このFaRSeTコメントブロックを削除し、直下の<a>タグの`href`属性の値を "#" から "${pageContext.request.contextPath}/" に戻します。
 *
 ****************************************************************/
--%>
                <a href="#" class="btn btn-default">トップに戻る</a>
            </div>

        </div>
        </div>
    <jsp:include page="../A0/footer.jsp" />

    <script
        src="${pageContext.request.contextPath}/resources/vendor/jquery/jquery.min.js"></script>
    <script
        src="${pageContext.request.contextPath}/resources/vendor/bootstrap/js/bootstrap.min.js"></script>

    <script src="${pageContext.request.contextPath}/resources/js/atrs.js"></script>
</body>
</html>