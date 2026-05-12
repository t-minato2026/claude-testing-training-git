import { test, expect } from '@playwright/test';
import { TOP_URL, REGISTER_URL, fillMemberRegisterForm } from './helpers';

// ----------------------------------------------------------------
// C1 会員情報登録プロセス 状態遷移テスト
// 参照：C1 会員情報登録プロセス テストケース.md
// ----------------------------------------------------------------

const REGISTER_CONFIRM_URL_PATTERN = /\/member\/register/;
const REGISTER_COMPLETE_URL_PATTERN = /\/member\/register/;

test.describe('会員情報登録プロセス 状態遷移テスト（C1）', () => {

  test.beforeEach(async ({ page }) => {
    // 遷移 #1: 未ログイン状態で「会員登録ボタン」を押す（A00203）
    await page.goto(TOP_URL);
    await page.locator('a[href="/atrs/member/register?form"]').click();
    await expect(page).toHaveURL(REGISTER_URL);
  });

  // ----------------------------------------------------------------
  // 正常系
  // ----------------------------------------------------------------

  /**
   * C1-TC-01 正常登録フロー（C101→C102→C103）
   * 対象遷移: #1 → #2 → #7 → #8（全検証OK → 確認画面 → 完了画面）
   */
  test('C1-TC-01 正常登録フロー（C101→C102→C103）', async ({ page }) => {
    // 遷移 #2: 全必須項目を有効な値で入力
    await fillMemberRegisterForm(page);

    // 遷移 #7: 登録確認ボタン押下（C10101）→ C102 に遷移
    await page.locator('input[type="submit"][value="登録確認"]').click();
    await expect(page).toHaveURL(REGISTER_CONFIRM_URL_PATTERN);
    await expect(page.getByText(/確認/)).toBeVisible();

    // 遷移 #8: 登録確定ボタン押下（C10201）→ C103 に遷移
    await page.locator('input[type="submit"][value="登録"], button:has-text("登録")').click();

    // 期待結果: 会員登録完了画面（C103）に遷移し、会員番号が表示される
    await expect(page.getByText(/会員番号/)).toBeVisible();
    await expect(page.getByText(/\d{10}/)).toBeVisible();
  });

  // ----------------------------------------------------------------
  // 異常系C（クライアントバリデーション）
  // ----------------------------------------------------------------

  /**
   * C1-TC-02 C101 必須項目未入力 クライアントエラー
   * 対象遷移: #3（C101_入力中 → C101_クライアントエラー）
   */
  test('C1-TC-02 C101 必須項目未入力 クライアントエラー', async ({ page }) => {
    // 遷移 #3: 氏名(姓)を空欄のまま送信
    await fillMemberRegisterForm(page);
    await page.locator('[name="kanjiFamilyName"]').fill('');
    await page.locator('input[type="submit"][value="登録確認"]').click();

    // 期待結果: C101 に留まり、必須エラーが表示される
    await expect(page).toHaveURL(REGISTER_URL);
    await expect(page.locator('.parsley-errors-list, .invalid')).toBeVisible();
  });

  /**
   * C1-TC-03 C101 Eメール不一致エラー（e.ar.c1.C6001）
   * 対象遷移: #3（クライアントエラー）
   */
  test('C1-TC-03 C101 Eメール不一致エラー', async ({ page }) => {
    await fillMemberRegisterForm(page, {
      mail: 'test@example.com',
      reMail: 'other@example.com',   // 不一致
    });
    await page.locator('input[type="submit"][value="登録確認"]').click();

    await expect(page).toHaveURL(REGISTER_URL);
    await expect(page.getByText(/一致しません|メールアドレス/)).toBeVisible();
  });

  /**
   * C1-TC-04 C101 パスワード不一致エラー（e.ar.c1.C6002）
   * 対象遷移: #3（クライアントエラー）
   */
  test('C1-TC-04 C101 パスワード不一致エラー', async ({ page }) => {
    await fillMemberRegisterForm(page, {
      password: 'password01',
      rePassword: 'password02',      // 不一致
    });
    await page.locator('input[type="submit"][value="登録確認"]').click();

    await expect(page).toHaveURL(REGISTER_URL);
    await expect(page.getByText(/パスワードが一致しません/)).toBeVisible();
  });

  // ----------------------------------------------------------------
  // 異常系S（サーババリデーション）
  // ----------------------------------------------------------------

  /**
   * C1-TC-05 C101 生年月日 範囲外エラー（e.ar.c0.5003）
   * 対象遷移: #5（C101_入力中 → C101_サーバエラー）
   */
  test('C1-TC-05 C101 生年月日 範囲外エラー', async ({ page }) => {
    await fillMemberRegisterForm(page, {
      dateOfBirth: '1899/12/31',     // 120年以上前（範囲外）
    });
    await page.locator('input[type="submit"][value="登録確認"]').click();

    await expect(page).toHaveURL(REGISTER_URL);
    await expect(
      page.locator('.alert.alert-danger').getByText(/生年月日/),
    ).toBeVisible();
  });

  /**
   * C1-TC-06 C101 電話番号 桁数エラー（e.ar.c0.5002）
   * 対象遷移: #5（C101_入力中 → C101_サーバエラー）
   * 電話番号1+電話番号2の合計桁数が 6〜7 桁以外
   */
  test('C1-TC-06 C101 電話番号 桁数エラー', async ({ page }) => {
    await fillMemberRegisterForm(page, {
      tel1: '1',         // 1桁
      tel2: '234',       // 3桁 → 合計 4桁（範囲外）
    });
    await page.locator('input[type="submit"][value="登録確認"]').click();

    await expect(page).toHaveURL(REGISTER_URL);
    await expect(
      page.locator('.alert.alert-danger').getByText(/市外局番|桁数/),
    ).toBeVisible();
  });

  // ----------------------------------------------------------------
  // 表示条件
  // ----------------------------------------------------------------

  /**
   * C1-TC-07 C102 クレジットカード番号マスク表示
   * 対象遷移: #7（確認画面 C102 の表示確認）
   */
  test('C1-TC-07 C102 クレジットカード番号マスク表示', async ({ page }) => {
    await fillMemberRegisterForm(page);
    await page.locator('input[type="submit"][value="登録確認"]').click();
    await expect(page).toHaveURL(REGISTER_CONFIRM_URL_PATTERN);

    // 期待結果: クレジットカード番号が「*」でマスクされている（先頭4桁のみ表示）
    await expect(page.getByText(/\*+/)).toBeVisible();
    // 全桁が表示されていないこと
    await expect(page.getByText('1234567890123456')).not.toBeVisible();
  });

  // ----------------------------------------------------------------
  // 遷移テスト
  // ----------------------------------------------------------------

  /**
   * C1-TC-08 C102 修正ボタンでC101に戻る（入力内容保持）
   */
  test('C1-TC-08 C102 修正ボタンでC101に戻る', async ({ page }) => {
    await fillMemberRegisterForm(page);
    await page.locator('input[type="submit"][value="登録確認"]').click();
    await expect(page).toHaveURL(REGISTER_CONFIRM_URL_PATTERN);

    // 修正ボタン押下（C10202）
    await page.locator('input[value="修正"], button:has-text("修正")').click();

    // 期待結果: C101 に遷移し、入力内容が保持されている
    await expect(page).toHaveURL(REGISTER_URL);
    await expect(page.locator('[name="kanjiFamilyName"]')).toHaveValue('山田');
  });

  /**
   * C1-TC-09 C103 TOPに戻るボタン
   */
  test('C1-TC-09 C103 TOPに戻るボタン', async ({ page }) => {
    await fillMemberRegisterForm(page);
    await page.locator('input[type="submit"][value="登録確認"]').click();
    await page.locator('input[type="submit"][value="登録"], button:has-text("登録")').click();
    await expect(page.getByText(/会員番号/)).toBeVisible();

    // トップに戻るボタン（C10301）
    await page.locator('input[value*="トップ"], a:has-text("トップ"), button:has-text("トップ")').click();

    await expect(page).toHaveURL(TOP_URL);
  });

  /**
   * C1-TC-10 C102→A099 不正リクエスト 共通エラー画面
   * 対象遷移: #9（C10201 [e.ar.fw.0003]）
   */
  test('C1-TC-10 C102→A099 不正リクエスト 共通エラー画面', async ({ page }) => {
    await fillMemberRegisterForm(page);
    await page.locator('input[type="submit"][value="登録確認"]').click();
    await expect(page).toHaveURL(REGISTER_CONFIRM_URL_PATTERN);

    // 登録を完了させてから戻るボタンでC102に戻り、再度送信（二重送信）
    await page.locator('input[type="submit"][value="登録"], button:has-text("登録")').click();
    await expect(page.getByText(/会員番号/)).toBeVisible();
    await page.goBack();
    await page.locator('input[type="submit"][value="登録"], button:has-text("登録")').click();

    // 期待結果: 共通エラー画面（A099）に遷移する
    await expect(page.locator('.alert.alert-danger, #error-message')).toBeVisible();
  });

});
