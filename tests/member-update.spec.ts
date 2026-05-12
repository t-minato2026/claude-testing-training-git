import { test, expect } from '@playwright/test';
import { TOP_URL, UPDATE_URL, VALID_MEMBER, doLogin, doLogout } from './helpers';

// ----------------------------------------------------------------
// C2 会員情報変更プロセス 状態遷移テスト
// 参照：C2 会員情報変更プロセス テストケース.md
// ----------------------------------------------------------------

const UPDATE_URL_PATTERN = /\/member\/update/;

test.describe('会員情報変更プロセス 状態遷移テスト（C2）', () => {

  test.beforeEach(async ({ page }) => {
    await doLogin(page);
    await page.goto(UPDATE_URL);
    await expect(page).toHaveURL(UPDATE_URL_PATTERN);
  });

  // ----------------------------------------------------------------
  // 表示条件
  // ----------------------------------------------------------------

  /**
   * C2-TC-01 C201 初期値（DB値）表示確認
   * 対象遷移: #1（ログイン済み → 会員情報変更リンク → C201初期表示）
   */
  test('C2-TC-01 C201 初期値（DB値）表示確認', async ({ page }) => {
    // ヘッダのユーザ名クリック → 会員情報変更リンク押下（C20102）
    await page.goto(TOP_URL);
    await page.locator('#header').getByText(VALID_MEMBER.name).click();
    await page.locator('a[href="/atrs/member/update?form"]').click();

    await expect(page).toHaveURL(UPDATE_URL_PATTERN);

    // 期待結果: 氏名などの登録済み値が初期値として表示される
    await expect(page.locator('[name="kanjiFamilyName"]')).not.toHaveValue('');
    await expect(page.locator('[name="kanjiGivenName"]')).not.toHaveValue('');
    await expect(page.locator('[name="mail"]')).not.toHaveValue('');
  });

  // ----------------------------------------------------------------
  // 正常系
  // ----------------------------------------------------------------

  /**
   * C2-TC-02 C201 正常更新（パスワード変更なし）
   * 対象遷移: #2 → #7（C201_入力中 → C201_更新完了）
   */
  test('C2-TC-02 C201 正常更新（パスワード変更なし）', async ({ page }) => {
    // 住所を変更（パスワード欄は空欄のまま）
    await page.locator('[name="address"]').fill('東京都品川区2-2-2');
    await page.locator('input[type="submit"][value="更新"]').click();

    // 期待結果: 成功メッセージ i.ar.c2.2001 が表示される
    await expect(page).toHaveURL(UPDATE_URL_PATTERN);
    await expect(page.getByText(/会員情報を更新しました/)).toBeVisible();
    await expect(page.locator('[name="address"]')).toHaveValue('東京都品川区2-2-2');

    // 後片付け: 住所を元に戻す
    await page.locator('[name="address"]').fill('東京都港区1-1-1');
    await page.locator('input[type="submit"][value="更新"]').click();
    await expect(page.getByText(/会員情報を更新しました/)).toBeVisible();
  });

  /**
   * C2-TC-03 C201 パスワード変更 正常
   * 対象遷移: #2 → #7（パスワード変更を含む更新成功）
   */
  test('C2-TC-03 C201 パスワード変更 正常', async ({ page }) => {
    await page.locator('[name="currentPassword"]').fill(VALID_MEMBER.password);
    await page.locator('[name="password"]').fill('bbbbb22222');
    await page.locator('[name="reEnterPassword"]').fill('bbbbb22222');
    await page.locator('input[type="submit"][value="更新"]').click();

    // 期待結果: 成功メッセージが表示される
    await expect(page).toHaveURL(UPDATE_URL_PATTERN);
    await expect(page.getByText(/会員情報を更新しました/)).toBeVisible();

    // 新パスワードでログインできること（確認後にパスワードを元に戻す）
    await doLogout(page);
    await doLogin(page, VALID_MEMBER.id, 'bbbbb22222');

    // パスワードを元に戻す
    await page.goto(UPDATE_URL);
    await page.locator('[name="currentPassword"]').fill('bbbbb22222');
    await page.locator('[name="password"]').fill(VALID_MEMBER.password);
    await page.locator('[name="reEnterPassword"]').fill(VALID_MEMBER.password);
    await page.locator('input[type="submit"][value="更新"]').click();
    await expect(page.getByText(/会員情報を更新しました/)).toBeVisible();
  });

  /**
   * C2-TC-07 C201 更新完了後に継続して変更
   * 対象遷移: #7 → #8 → #7（更新成功後に再変更して再更新）
   */
  test('C2-TC-07 C201 更新完了後に継続して変更', async ({ page }) => {
    // 1回目の更新
    await page.locator('[name="address"]').fill('東京都新宿区3-3-3');
    await page.locator('input[type="submit"][value="更新"]').click();
    await expect(page.getByText(/会員情報を更新しました/)).toBeVisible();

    // 成功メッセージが表示されたまま、電話番号下4桁を変更して再更新
    await page.locator('[name="tel3"]').fill('9999');
    await page.locator('input[type="submit"][value="更新"]').click();

    // 期待結果: 再度更新が成功し、成功メッセージが表示される
    await expect(page).toHaveURL(UPDATE_URL_PATTERN);
    await expect(page.getByText(/会員情報を更新しました/)).toBeVisible();
    await expect(page.locator('[name="tel3"]')).toHaveValue('9999');

    // 後片付け
    await page.locator('[name="address"]').fill('東京都港区1-1-1');
    await page.locator('[name="tel3"]').fill('5678');
    await page.locator('input[type="submit"][value="更新"]').click();
    await expect(page.getByText(/会員情報を更新しました/)).toBeVisible();
  });

  // ----------------------------------------------------------------
  // 異常系S（サーババリデーション）
  // ----------------------------------------------------------------

  /**
   * C2-TC-04 C201 現在のパスワード不一致エラー（e.ar.c2.2001）
   * 対象遷移: #5（C201_入力中 → C201_サーバエラー）
   */
  test('C2-TC-04 C201 現在のパスワード不一致エラー', async ({ page }) => {
    await page.locator('[name="currentPassword"]').fill('wrongpass1');
    await page.locator('[name="password"]').fill('bbbbb22222');
    await page.locator('[name="reEnterPassword"]').fill('bbbbb22222');
    await page.locator('input[type="submit"][value="更新"]').click();

    // 期待結果: C201 に留まり、現在のパスワード不一致エラーが表示される
    await expect(page).toHaveURL(UPDATE_URL_PATTERN);
    await expect(
      page.locator('.alert.alert-danger').getByText(/現在のパスワード|パスワードが一致しません/),
    ).toBeVisible();
  });

  // ----------------------------------------------------------------
  // 異常系C（クライアントバリデーション）
  // ----------------------------------------------------------------

  /**
   * C2-TC-05 C201 パスワード変更項目不完全エラー（e.ar.c2.5002）
   * 対象遷移: #3（C201_入力中 → C201_クライアントエラー）
   * 現在のパスワードのみ入力して変更パスワードを未入力
   */
  test('C2-TC-05 C201 パスワード変更項目不完全エラー', async ({ page }) => {
    await page.locator('[name="currentPassword"]').fill(VALID_MEMBER.password);
    // 変更パスワード・再入力は空欄のまま
    await page.locator('input[type="submit"][value="更新"]').click();

    // 期待結果: C201 に留まり、パスワード変更項目の不完全エラーが表示される
    await expect(page).toHaveURL(UPDATE_URL_PATTERN);
    await expect(
      page.getByText(/パスワードを変更する場合|現在のパスワード.*変更するパスワード/),
    ).toBeVisible();
  });

  /**
   * C2-TC-06 C201 Eメール不一致エラー（e.ar.c2.C6001）
   * 対象遷移: #3（C201_入力中 → C201_クライアントエラー）
   */
  test('C2-TC-06 C201 Eメール不一致エラー', async ({ page }) => {
    await page.locator('[name="mail"]').fill('new@example.com');
    await page.locator('[name="reEnterMail"]').fill('other@example.com');   // 不一致
    await page.locator('input[type="submit"][value="更新"]').click();

    // 期待結果: C201 に留まり、メールアドレス不一致エラーが表示される
    await expect(page).toHaveURL(UPDATE_URL_PATTERN);
    await expect(page.getByText(/一致しません|メールアドレス/)).toBeVisible();
  });

  /**
   * C2-TC-08 C201 パスワード再入力不一致エラー（e.ar.c2.C6002）
   * 対象遷移: #3（C201_入力中 → C201_クライアントエラー）
   */
  test('C2-TC-08 C201 パスワード再入力不一致エラー', async ({ page }) => {
    await page.locator('[name="currentPassword"]').fill(VALID_MEMBER.password);
    await page.locator('[name="password"]').fill('bbbbb22222');
    await page.locator('[name="reEnterPassword"]').fill('ccccc33333');    // 不一致
    await page.locator('input[type="submit"][value="更新"]').click();

    // 期待結果: C201 に留まり、パスワード再入力不一致エラーが表示される
    await expect(page).toHaveURL(UPDATE_URL_PATTERN);
    await expect(page.getByText(/パスワードが一致しません/)).toBeVisible();
  });

});
