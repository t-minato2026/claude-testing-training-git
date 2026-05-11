# ATRS 全プロセス フローモデリング図

対象システム：航空チケット予約システム（ATRS）  
参照：ATRS 外部設計書 Markdown版 第1.7.0版  
作成日：2026-05-08

---

## 1. システム全体概要フロー

```mermaid
flowchart TD
    START([アクセス]) --> TOP

    TOP["TOP画面 A001\n空席照会条件フォーム"]

    TOP -->|未ログイン時| REG["会員登録 C1"]
    TOP -->|ヘッダ・ログインボタン| LOGIN["ログイン A1"]
    TOP -->|照会ボタン| SEARCH["空席照会 B1"]
    LOGIN --> TOP
    REG --> TOP
    SEARCH --> BOOK["予約 B2"]
    BOOK --> DONE["予約完了 B204"]
    BOOK --> FAIL["予約失敗 B205"]
    FAIL --> SEARCH

    TOP -->|ヘッダ・ログイン済み| CHANGE["会員情報変更 C2"]
    TOP -->|ヘッダ・ログアウト| LOGOUT["ログアウト A2"]
    LOGOUT --> TOP

    style TOP fill:#ddeeff,stroke:#336699
    style LOGIN fill:#ffe4cc,stroke:#cc6600
    style LOGOUT fill:#ffe4cc,stroke:#cc6600
    style SEARCH fill:#d4edda,stroke:#28a745
    style BOOK fill:#d4edda,stroke:#28a745
    style REG fill:#fff3cd,stroke:#856404
    style CHANGE fill:#fff3cd,stroke:#856404
    style DONE fill:#c3e6cb,stroke:#155724
    style FAIL fill:#f8d7da,stroke:#721c24
```

---

## 2. A1 ログインプロセス

```mermaid
flowchart TD
    S([開始]) --> A101[/"ログイン画面 A101\n初期表示"/]
    A101 --> INP["会員番号・パスワード入力"]
    INP --> BTN["ログインボタン押下\nA10101"]
    BTN --> CV{クライアント検証}

    CV -- "NG\n・会員番号 未入力\n・桁数不正（10桁以外）\n・文字種不正（半角数字以外）\n・パスワード 未入力" --> CE["クライアントエラー表示\ne.ar.a1.C5001"]
    CE --> INP

    CV -- OK --> SV{サーバ認証}
    SV -- "NG\n会員番号未登録\nパスワード不一致\ne.ar.a1.2001" --> SE["サーバエラー表示\n（同一メッセージ: User Enumeration対策）"]
    SE --> INP

    SV -- OK --> TOP[/"TOP画面 A001\nヘッダにログインユーザ名表示\nDB更新・セッション生成"/]
    TOP --> E([終了])

    style CV fill:#fff3cd
    style SV fill:#fff3cd
    style CE fill:#f8d7da
    style SE fill:#f8d7da
    style TOP fill:#d4edda
```

---

## 3. A2 ログアウトプロセス

```mermaid
flowchart TD
    S([ログイン済み・任意画面]) --> MENU["ヘッダのユーザ名クリック\nA00207\nログインユーザメニュー表示"]
    MENU --> LO["ログアウトリンク押下\nA20101"]
    LO --> DB["DB更新\nログイン状態 → ログアウト"]
    DB --> SS["セッション破棄"]
    SS --> TOP[/"TOP画面 A001\n未ログイン状態\nヘッダ：「会員登録」「ログイン」ボタン表示"/]
    TOP --> E([終了])

    style DB fill:#e2d9f3
    style SS fill:#e2d9f3
    style TOP fill:#d4edda
```

---

## 4. B1 空席照会プロセス

```mermaid
flowchart TD
    S([TOP画面 A001]) --> INP["照会条件入力\n・フライト種別（往復/片道）\n・出発空港・到着空港\n・往路搭乗日（・復路搭乗日）\n・搭乗クラス"]
    INP --> BTN["照会ボタン押下\nB10101"]
    BTN --> CV{クライアント検証}

    CV -- "NG\n・出発日 未入力/不正\n・フライト種別 未選択\n・搭乗クラス 未選択" --> CE["エラー表示\nフォーム脇にクライアントメッセージ"]
    CE --> INP

    CV -- OK --> SV{サーバ検証}
    SV -- "NG\ne.ar.b1.5001 同一区間\ne.ar.b1.5002 復路日＜往路日" --> SE["サーバエラー表示\n画面上部にエラーメッセージ"]
    SE --> INP

    SV -- OK --> B102[/"空席照会画面 B102\nフライト一覧表示\n（便名・時刻・空席数・運賃）"/]

    B102 --> PD["前日照会ボタン\nB10202"]
    B102 --> ND["翌日照会ボタン\nB10203"]
    PD --> B102
    ND --> B102

    B102 --> RINP["条件を変更して\n再検索 B10102"]
    RINP --> CV2{クライアント/\nサーバ検証}
    CV2 -- "NG\n（B10101同様）" --> RE["エラー表示"]
    RE --> B102
    CV2 -- "OK" --> B102

    B102 --> NEXT([予約プロセス B2 へ])

    style CV fill:#fff3cd
    style SV fill:#fff3cd
    style CV2 fill:#fff3cd
    style CE fill:#f8d7da
    style SE fill:#f8d7da
    style RE fill:#f8d7da
    style B102 fill:#d4edda
```

---

## 5. B2 予約プロセス

```mermaid
flowchart TD
    S([空席照会画面 B102]) --> BTN["予約ボタン押下\nB20103\n（フライト選択後）"]
    BTN --> CV{クライアント検証\nB20103}

    CV -- "NG\n・往路フライト未選択\n・復路出発時刻不正\n　→ e.ar.b2.C6001" --> CE["空席照会画面\nエラー表示"]
    CE --> S

    CV -- OK --> LI{ログイン済み?}

    LI -- "未ログイン" --> DLG[/"予約方法選択ダイアログ B201\n「ゲスト」or「ログインして予約」"/]
    LI -- "ログイン済み" --> B202[/"お客様情報入力画面 B202\n会員情報自動補完済み"/]

    DLG -- "ゲストとして予約\nB20101" --> B202G[/"お客様情報入力画面 B202\n（ゲスト：空フォーム）"/]
    DLG -- "ログインして予約\nB20102\n[認証NG]\ne.ar.b2.C2001" --> DLG
    DLG -- "ログインして予約\nB20102\n[認証OK]" --> B202L[/"お客様情報入力画面 B202\n会員情報自動補完済み"/]

    B202 --> CF
    B202G --> CF
    B202L --> CF

    CF["予約確認ボタン押下\nB20201"] --> CV2{クライアント検証}

    CV2 -- "NG\n・必須/桁数/文字種\n・Eメール形式不正" --> CE2["B202 クライアントエラー表示"]
    CE2 --> CF

    CV2 -- OK --> SV{サーバ検証}

    SV -- "NG\ne.ar.b2.5002 搭乗者0件\ne.ar.b2.5003 電話番号桁数\ne.ar.b2.2004 代表者年齢\ne.ar.b2.2007 レディース割性別\ne.ar.b2.2010 グループ割人数\ne.ar.b2.2002/2003 代表者会員番号\ne.ar.b2.2005/2006 搭乗者会員番号" --> SE2["B202 サーバエラー表示"]
    SE2 --> CF

    SV -- OK --> B203[/"申込確認画面 B203\n選択フライト・搭乗者情報\n合計金額 確認"/]

    B203 --> KD["予約確定ボタン押下\nB20301"]
    KD --> DB{DB予約登録}

    DB -- "成功\n予約番号・支払期限発行" --> B204[/"予約完了画面 B204\n予約番号・合計金額\nお支払い期限表示"/]
    DB -- "失敗\ne.ar.b2.2008 予約可能期間外\ne.ar.b2.2009 空席不足" --> B205[/"予約失敗画面 B205\n失敗理由表示\n再検索リンク"/]

    B204 --> E([終了])
    B205 --> S

    style CV fill:#fff3cd
    style CV2 fill:#fff3cd
    style SV fill:#fff3cd
    style DB fill:#fff3cd
    style LI fill:#e2d9f3
    style CE fill:#f8d7da
    style CE2 fill:#f8d7da
    style SE2 fill:#f8d7da
    style B204 fill:#c3e6cb
    style B205 fill:#f8d7da
```

---

## 6. C1 会員情報登録プロセス

```mermaid
flowchart TD
    S([TOP画面\n未ログイン状態]) --> RB["「会員登録」ボタン押下\nA00203\n（未ログイン時のみ表示）"]
    RB --> C101[/"会員情報登録画面 C101\n初期表示（空フォーム）"/]
    C101 --> INP["会員情報入力\n・氏名（漢字・カナ）・生年月日・性別\n・電話番号・郵便番号・住所\n・Eメール・クレジットカード\n・パスワード"]
    INP --> KB["登録確認ボタン押下\nC10101"]
    KB --> CV{クライアント検証}

    CV -- "NG\n・必須チェック\n・桁数/文字種チェック\n・有効日付チェック\n・Eメール形式チェック\n・Eメール再入力不一致\n　→ e.ar.c1.C6001\n・パスワード再入力不一致\n　→ e.ar.c1.C6002" --> CE["C101 クライアントエラー表示"]
    CE --> INP

    CV -- OK --> SV{サーバ検証}

    SV -- "NG\n・電話番号桁数不正\n　→ e.ar.c0.5002\n・生年月日範囲外\n　→ e.ar.c0.5003" --> SE["C101 サーバエラー表示"]
    SE --> INP

    SV -- OK --> C102[/"会員登録確認画面 C102\n入力内容表示\n（クレジットカード番号・PW はマスク）"/]
    C102 --> KD["登録確定ボタン押下\nC10201"]
    KD --> DB{DB登録}

    DB -- "成功\n会員番号自動採番" --> C103[/"会員登録完了画面 C103\n発行された会員番号を表示"/]
    DB -- "NG\ne.ar.fw.0003 不正リクエスト" --> ERR[/"共通エラー画面 A099"/]

    C103 --> E([終了])
    ERR --> E

    style CV fill:#fff3cd
    style SV fill:#fff3cd
    style DB fill:#fff3cd
    style CE fill:#f8d7da
    style SE fill:#f8d7da
    style C103 fill:#c3e6cb
    style ERR fill:#f8d7da
```

---

## 7. C2 会員情報変更プロセス

```mermaid
flowchart TD
    S([ログイン済み・任意画面]) --> UM["ヘッダのユーザ名クリック\nA00207"]
    UM --> ML["「会員情報変更」リンク押下\nC20102"]
    ML --> DB1["DBから会員情報取得\n（ログインユーザの会員番号で検索）"]
    DB1 --> C201[/"会員情報変更画面 C201\n（フォーム初期値: DBの現在情報）"/]
    C201 --> INP["会員情報編集\n（パスワード変更は任意）"]
    INP --> UB["更新ボタン押下\nC20101"]
    UB --> CV{クライアント検証}

    CV -- "NG\n・必須/桁数/文字種チェック\n・Eメール再入力不一致\n　→ e.ar.c2.C6001\n・パスワード再入力不一致\n　→ e.ar.c2.C6002\n・PW変更項目が部分入力\n　→ e.ar.c2.5002" --> CE["C201 クライアントエラー表示"]
    CE --> INP

    CV -- OK --> SV{サーバ検証}

    SV -- "NG\n・電話番号桁数不正\n　→ e.ar.c0.5002\n・生年月日範囲外\n　→ e.ar.c0.5003\n・現在PW不一致\n　→ e.ar.c2.2001" --> SE["C201 サーバエラー表示"]
    SE --> INP

    SV -- OK --> DB2["DB更新\n・ATRSカード会員情報\n・ATRSカード会員ログイン情報"]
    DB2 --> FETCH["DBから更新後情報を再取得"]
    FETCH --> C201U[/"会員情報変更画面 C201\n更新完了\ni.ar.c2.2001\n「会員情報を更新しました。」表示"/]

    C201U -- "継続して変更する場合" --> INP
    C201U --> E([終了])

    style CV fill:#fff3cd
    style SV fill:#fff3cd
    style DB2 fill:#e2d9f3
    style FETCH fill:#e2d9f3
    style CE fill:#f8d7da
    style SE fill:#f8d7da
    style C201U fill:#c3e6cb
```
