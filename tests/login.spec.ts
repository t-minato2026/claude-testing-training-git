import { test, expect, type Page } from '@playwright/test';

async function submitLoginForm(page: Page, membershipNumber: string, password: string): Promise<void> {
  await page.locator('#membershipNumber').fill(membershipNumber);
  await page.locator('#password').fill(password);
  await page.locator('#login-btn').click();
}

test.describe('ログイン画面 (A101) - 状態遷移テスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('auth/login?form');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('TC-L-001: 正常ログイン', async ({ page }) => {
    await submitLoginForm(page, '0000000001', 'aaaaa11111');
    await expect(page).toHaveURL(/\/ticket\/search/);
    await expect(page.getByText('ようこそ')).toBeVisible();
  });

  test('TC-L-002: クライアントエラー（会員番号 未入力）', async ({ page }) => {
    await submitLoginForm(page, '', 'aaaaa11111');
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByText('入力必須項目です。')).toBeVisible();
  });

  test('TC-L-003: クライアントエラー（パスワード 未入力）', async ({ page }) => {
    await submitLoginForm(page, '0000000001', '');
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByText('入力必須項目です。')).toBeVisible();
  });

  test('TC-L-004: 認証エラー（会員番号 不存在）', async ({ page }) => {
    await submitLoginForm(page, '9999999999', 'aaaaa11111');
    await expect(page).toHaveURL(/\/auth\/dologin/);
    await expect(page.getByText('会員番号またはパスワードが確認できませんでした。入力情報をご確認ください。')).toBeVisible();
  });

  test('TC-L-005: 認証エラー（パスワード 不一致）', async ({ page }) => {
    await submitLoginForm(page, '0000000001', 'wrongpass1');
    await expect(page).toHaveURL(/\/auth\/dologin/);
    await expect(page.getByText('会員番号またはパスワードが確認できませんでした。入力情報をご確認ください。')).toBeVisible();
  });
});
