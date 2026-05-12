import { test, expect } from '@playwright/test';
import { BASE_URL, TOP_URL, LOGIN_URL, UPDATE_URL, VALID_MEMBER, doLogin, doLogout } from './helpers';

// ----------------------------------------------------------------
// A2 ログアウトプロセス 状態遷移テスト
// 参照：A2 ログアウトプロセス テストケース.md
// ----------------------------------------------------------------

test.describe('ログアウトプロセス 状態遷移テスト（A2）', () => {

  /**
   * A2-TC-01 正常ログアウト
   * 対象遷移: #1（ログイン済み任意画面）→ #2（ユーザ名クリック→メニュー）→ #3（ログアウト→TOP未ログイン）
   */
  test('A2-TC-01 正常ログアウト', async ({ page }) => {
    // 前提条件: ログイン済み
    await doLogin(page);
    await expect(page.locator('#header').getByText(VALID_MEMBER.name)).toBeVisible();

    // 遷移 #2: ヘッダのユーザ名クリック → ログインユーザメニュー表示
    await page.locator('#header').getByText(VALID_MEMBER.name).click();
    await expect(page.getByRole('link', { name: 'ログアウト' })).toBeVisible();

    // 遷移 #3: ログアウトリンク押下（A20101）→ TOP画面_未ログイン
    await doLogout(page);

    // 期待結果: TOP画面に遷移し、未ログイン状態になっていること
    await expect(page).toHaveURL(TOP_URL);
    await expect(page.locator('a[href="/atrs/auth/login?form"]')).toBeVisible();
    await expect(page.locator('a[href="/atrs/member/register?form"]')).toBeVisible();
    await expect(page.locator('#header').getByText(VALID_MEMBER.name)).not.toBeVisible();
  });

  /**
   * A2-TC-02 ログアウト後の未認証状態確認
   * 対象遷移: #4（TOP画面_未ログイン → ログイン必須ページ直アクセス → ログイン画面リダイレクト）
   */
  test('A2-TC-02 ログアウト後の未認証状態確認', async ({ page }) => {
    // 前提条件: ログアウト済み（ログイン後にログアウト）
    await doLogin(page);
    await doLogout(page);
    await expect(page).toHaveURL(TOP_URL);

    // 遷移 #4: ログイン必須ページ（会員情報変更）に直接アクセス
    await page.goto(UPDATE_URL);

    // 期待結果: ログイン画面（A101）にリダイレクトされること
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/auth/login`));
    await expect(page.locator('#membershipNumber')).toBeVisible();
  });

});
