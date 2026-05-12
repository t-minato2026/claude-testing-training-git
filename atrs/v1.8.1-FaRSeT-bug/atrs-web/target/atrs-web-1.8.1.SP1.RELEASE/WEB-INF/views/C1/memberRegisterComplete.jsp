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
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags"%>
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>会員登録完了 | Airline Ticket Reservation System</title>

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
                    <h2>会員登録しました。</h2>
                    <p>
                        会員登録ありがとうございました。<br> 会員番号は<strong>${f:h(member.membershipNumber)}</strong>です。
                    </p>
                </div>
            </section>

            <div class="text-center">
<%--
/****************************************************************
 * ■■■ FaRSeT トレーニング用不具合実装 START ■■■
 *
 * @bug_id        20
 * @bug_title     画面遷移の誤り
 * @author        Sota Toyama
 * @see           「FaRSeTトレーニング用のATRSのサンプル不具合の案」
 *
 * @purpose
 * - ユーザーにとって自然で、ストレスのない画面遷移(ワークフロー)を設計・検証することの重要性を学習させます。
 *
 * @modification
 * - 会員登録完了画面の「トップに戻る」ボタンのリンク先(`href`属性)を、正常なトップページからログイン画面へ変更しました。
 *
 * @impact
 * - 会員登録完了画面の「トップに戻る」ボタンを押すと、ログイン画面に遷移するようになります。
 *
 * @revert
 * - このFaRSeTコメントブロックを削除し、直下の<a>タグの`href`属性の値を "${pageContext.request.contextPath}/auth/login?form" から "${pageContext.request.contextPath}/" に戻します。
 *
 ****************************************************************/
--%>
                <a href="${pageContext.request.contextPath}/auth/login?form" class="btn btn-default">トップに戻る</a>
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