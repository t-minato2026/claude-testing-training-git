import { test, expect, type Page } from '@playwright/test';

// ----------------------------------------------------------------
// 定数
// ----------------------------------------------------------------

const BASE_URL = 'http://localhost:8082/atrs';
const LOGIN_URL = `${BASE_URL}/auth/login?form`;
const TOP_URL = `${BASE_URL}/ticket/search?topForm`;

/** 初期会員データ（サンプルアプリマニュアル 初期会員一覧より） */
const VALID_MEMBER = {
  id: '0000000001',
  password: 'aaaaa11111',
  name: '電電 花子',
} as const;

const SHORT_MEMBER_ID = '123456789';          // 9桁（桁数不正・下限境界-1）
const ALPHA_MEMBER_ID = '123456789a';         // 10文字・英字含む（文字種不正）
const UNREGISTERED_MEMBER_ID = '9999999999'; // 未登録の会員番号
const WRONG_PASSWORD = 'wrongpass1';          // 誤ったパスワード

/** サーバエラーメッセージ（e.ar.a1.2001） */
const SERVER_ERROR_MSG =
  '会員番号またはパスワードが確認できませんでした。入力情報をご確認ください。';

/**
 * クライアント桁数エラーメッセージ（e.ar.a1.C5001）
 * 実際の表示テキスト: '10 文字で入力してください。'
 */
const CLIENT_LENGTH_ERROR_MSG = '10 文字で入力してください。';

/**
 * クライアント文字種エラーメッセージ
 * parsley-config.js: type.integer: '数値で入力してください。'
 */
const CLIENT_TYPE_ERROR_MSG = '数値で入力してください。';

// ----------------------------------------------------------------
// ヘルパー関数
// ----------------------------------------------------------------

/** ヘッダのログインリンクを押してログイン画面へ遷移する（遷移 #1） */
async function navigateToLoginPage(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/`);
  await page.locator('a[href="/atrs/auth/login?form"]').click();
  await expect(page).toHaveURL(LOGIN_URL);
}

/** ログインフォームに入力してログインボタンを押す */
async function submitLoginForm(
  page: Page,
  memberId: string,
  password: string,
): Promise<void> {
  await page.locator('#membershipNumber').fill(memberId);
  await page.locator('#password').fill(password);
  await page.locator('#login-btn').click();
}

/** ログイン画面（フォーム）が表示されていることを確認する */
async function expectOnLoginPage(page: Page): Promise<void> {
  await expect(page.locator('#membershipNumber')).toBeVisible();
  await expect(page.locator('#password')).toBeVisible();
}

// ----------------------------------------------------------------
// テストスイート
// ----------------------------------------------------------------

test.describe('ログインプロセス 状態遷移テスト（A101）', () => {

  /**
   * TC-01 正常ログイン
   * 対象遷移: #1（任意画面→初期表示）→ #2（初期表示→入力中）→ #8（入力中→TOP画面）
   */
  test('TC-01 正常ログイン', async ({ page }) => {
    // 遷移 #1: 任意画面（未ログイン） → ログイン画面_初期表示
    await navigateToLoginPage(page);
    await expectOnLoginPage(page);

    // 遷移 #2 → #8: 入力中 → TOP画面（全検証OK・認証成功）
    await submitLoginForm(page, VALID_MEMBER.id, VALID_MEMBER.password);

    // 期待結果: TOP画面に遷移し、ヘッダにログインユーザ名が表示される
    await expect(page).toHaveURL(TOP_URL);
    await expect(page.locator('#header').getByText(VALID_MEMBER.name)).toBeVisible();
  });

  /**
   * TC-02 クライアントエラー → 入力修正 → ログイン成功
   * 対象遷移: #3（入力中→クライアントエラー）→ #4（クライアントエラー→入力中）→ #8（入力中→TOP画面）
   */
  test('TC-02 クライアントエラー → 入力修正 → ログイン成功', async ({ page }) => {
    await navigateToLoginPage(page);

    // 遷移 #3: 入力中 → クライアントエラー（会員番号9桁・桁数不正）
    // Parsleyが送信をブロック → URLはログイン画面のまま
    await submitLoginForm(page, SHORT_MEMBER_ID, VALID_MEMBER.password);

    await expect(page).toHaveURL(LOGIN_URL);
    await expect(page.getByText(CLIENT_LENGTH_ERROR_MSG)).toBeVisible();

    // 遷移 #4: クライアントエラー → 入力中（会員番号を正しい10桁に修正）
    await page.locator('#membershipNumber').fill(VALID_MEMBER.id);

    // 遷移 #8: 入力中 → TOP画面
    await page.locator('#login-btn').click();

    await expect(page).toHaveURL(TOP_URL);
    await expect(page.locator('#header').getByText(VALID_MEMBER.name)).toBeVisible();
  });

  /**
   * TC-03 サーバエラー（会員番号未登録）→ 入力修正 → ログイン成功
   * 対象遷移: #5（入力中→サーバエラー）→ #6（サーバエラー→入力中）→ #8（入力中→TOP画面）
   */
  test('TC-03 サーバエラー（会員番号未登録）→ 入力修正 → ログイン成功', async ({ page }) => {
    await navigateToLoginPage(page);

    // 遷移 #5: 入力中 → サーバエラー（クライアントOK・会員番号未登録）
    await submitLoginForm(page, UNREGISTERED_MEMBER_ID, VALID_MEMBER.password);

    await expect(page.locator('ul.alert.alert-danger').getByText(SERVER_ERROR_MSG)).toBeVisible();
    await expectOnLoginPage(page); // ログイン画面に留まっていること

    // 遷移 #6 → #8: サーバエラー → 入力修正 → TOP画面
    // サーバエラー後はパスワードフィールドがクリアされるため両フィールドを再入力する
    await submitLoginForm(page, VALID_MEMBER.id, VALID_MEMBER.password);

    await expect(page).toHaveURL(TOP_URL);
    await expect(page.locator('#header').getByText(VALID_MEMBER.name)).toBeVisible();
  });

  /**
   * TC-04 サーバエラー状態での再試行（自己遷移）
   * 対象遷移: #7（サーバエラー→サーバエラー）
   * サーバエラー状態で再度誤った認証情報を入力しても同一エラーが継続することを確認する
   */
  test('TC-04 サーバエラー状態での再試行（自己遷移）', async ({ page }) => {
    await navigateToLoginPage(page);

    // 前提状態: サーバエラー状態へ移行（遷移 #5）
    await submitLoginForm(page, UNREGISTERED_MEMBER_ID, WRONG_PASSWORD);
    await expect(page.locator('ul.alert.alert-danger').getByText(SERVER_ERROR_MSG)).toBeVisible();

    // 遷移 #7: サーバエラー → サーバエラー（別の誤った認証情報で再試行）
    await submitLoginForm(page, '9999999998', WRONG_PASSWORD);

    // 期待結果: ログイン画面に留まり、同一エラーメッセージが継続して表示される
    await expect(page.locator('ul.alert.alert-danger').getByText(SERVER_ERROR_MSG)).toBeVisible();
    await expectOnLoginPage(page);
    await expect(page).not.toHaveURL(TOP_URL); // TOP画面に遷移しないこと
  });

  /**
   * TC-05 クライアントエラー → 修正 → サーバエラー（パスワード不一致）
   * 対象遷移: #3（入力中→クライアントエラー）→ #4（クライアントエラー→入力中）→ #5（入力中→サーバエラー）
   * セキュリティ要件: 会員番号不在とPW不一致が同一メッセージ（e.ar.a1.2001）であることを確認する
   */
  test('TC-05 クライアントエラー → 修正 → サーバエラー（パスワード不一致）', async ({ page }) => {
    await navigateToLoginPage(page);

    // 遷移 #3: 入力中 → クライアントエラー（10文字・英字含む・type=integer違反）
    // Parsleyが送信をブロック → URLはログイン画面のまま
    await submitLoginForm(page, ALPHA_MEMBER_ID, WRONG_PASSWORD);

    await expect(page).toHaveURL(LOGIN_URL);
    await expect(page.getByText(CLIENT_TYPE_ERROR_MSG)).toBeVisible();

    // 遷移 #4: クライアントエラー → 入力中（正しい会員番号に修正、パスワードは誤ったまま）
    // クライアントエラーはフォーム未送信のためパスワードフィールドは保持されている
    await page.locator('#membershipNumber').fill(VALID_MEMBER.id);

    // 遷移 #5: 入力中 → サーバエラー（クライアントOK・パスワード不一致）
    await page.locator('#login-btn').click();

    // 期待結果: 「パスワードが誤り」ではなく e.ar.a1.2001 が表示される（User Enumeration 対策）
    await expect(page.locator('ul.alert.alert-danger').getByText(SERVER_ERROR_MSG)).toBeVisible();
    await expectOnLoginPage(page); // ログイン画面に留まっていること
  });
});
