import { test, expect, type Page } from '@playwright/test';
import {
  TOP_URL,
  VALID_MEMBER,
  doLogin,
  daysFromNow,
  searchFlights,
  selectFlightsAndReserve,
  fillGuestReserveForm,
} from './helpers';

// ----------------------------------------------------------------
// B2 予約プロセス 状態遷移テスト
// 参照：B2 予約プロセス テストケース.md
// ----------------------------------------------------------------

const RESERVE_URL_PATTERN = /\/ticket\/reserve/;
const CONFIRM_URL_PATTERN = /\/ticket\/reserve/;

/** B202 → B203 まで進む共通ヘルパー（ゲスト） */
async function goToConfirmAsGuest(page: Page): Promise<void> {
  await searchFlights(page);
  await selectFlightsAndReserve(page);
  // 未ログイン: ダイアログが表示される → ゲストとして予約
  await page.locator('button:has-text("ゲスト"), input[value*="ゲスト"]').click();
  await fillGuestReserveForm(page);
  await page.locator('input[name="confirm"]').click();
}

test.describe('予約プロセス 状態遷移テスト（B2）', () => {

  // ----------------------------------------------------------------
  // 正常系
  // ----------------------------------------------------------------

  /**
   * B2-TC-01 未ログイン・ゲストとして予約
   * 対象遷移: #3 → #5（空席照会画面 → B201ダイアログ → B202入力中）
   */
  test('B2-TC-01 未ログイン・ゲストとして予約', async ({ page }) => {
    await searchFlights(page);
    await selectFlightsAndReserve(page);

    // 未ログイン: 予約方法選択ダイアログ（B201）が表示される
    await expect(page.locator('button:has-text("ゲスト"), input[value*="ゲスト"]')).toBeVisible();

    // ゲストとして予約ボタン押下（B20101）
    await page.locator('button:has-text("ゲスト"), input[value*="ゲスト"]').click();

    // 期待結果: B202 に遷移し、代表者情報が入力可能なテキストボックスで表示される
    await expect(page).toHaveURL(RESERVE_URL_PATTERN);
    await expect(page.locator('[name="repFamilyName"]')).toBeVisible();
    await expect(page.locator('[name="repFamilyName"]')).toBeEditable();
  });

  /**
   * B2-TC-02 未ログイン・ログインして予約
   * 対象遷移: #3 → #6（B201ダイアログ → 認証成功 → B202入力中）
   */
  test('B2-TC-02 未ログイン・ログインして予約', async ({ page }) => {
    await searchFlights(page);
    await selectFlightsAndReserve(page);

    // ダイアログで「ログインして予約」を選択（B20102）
    await page.locator('input[name="membershipNumber"]').fill(VALID_MEMBER.id);
    await page.locator('input[name="password"]').fill(VALID_MEMBER.password);
    await page.locator('button:has-text("ログインして予約"), input[value*="ログインして予約"]').click();

    // 期待結果: B202 に遷移し、会員情報が搭乗者1に初期値設定されている
    await expect(page).toHaveURL(RESERVE_URL_PATTERN);
    // ログイン済みのため代表者情報はラベル表示（入力不可）
    await expect(page.locator('[name="repFamilyName"]')).not.toBeVisible();
  });

  /**
   * B2-TC-03 ログイン済み・直接予約（ダイアログなし）
   * 対象遷移: #4（空席照会画面 → B202入力中、ログイン済みのためダイアログをスキップ）
   */
  test('B2-TC-03 ログイン済み・直接予約（ダイアログなし）', async ({ page }) => {
    await doLogin(page);
    await searchFlights(page);
    await selectFlightsAndReserve(page);

    // 期待結果: ダイアログが表示されず直接 B202 に遷移する
    await expect(page).toHaveURL(RESERVE_URL_PATTERN);
    // 代表者情報はラベル表示（ログイン済み）
    await expect(page.locator('[name="repFamilyName"]')).not.toBeVisible();
  });

  /**
   * B2-TC-04 B202 ログイン済み初期値設定確認
   * 対象遷移: #4（会員情報の自動補完確認）
   */
  test('B2-TC-04 B202 ログイン済み初期値設定確認', async ({ page }) => {
    await doLogin(page);
    await searchFlights(page);
    await selectFlightsAndReserve(page);

    await expect(page).toHaveURL(RESERVE_URL_PATTERN);
    // 搭乗者1に会員のカタカナ氏名が設定されている
    const familyNameValue = await page.locator('[name="passengerFormList[0].familyName"]').inputValue();
    expect(familyNameValue.length).toBeGreaterThan(0);
    // コピーボタンは非表示（ログイン済みのため）
    await expect(page.locator('#copy-to-representive-button')).not.toBeVisible();
  });

  /**
   * B2-TC-05 B202 搭乗者追加（3→6件、6件で追加ボタン非表示）
   */
  test('B2-TC-05 B202 搭乗者追加（3→6件）', async ({ page }) => {
    await searchFlights(page);
    await selectFlightsAndReserve(page);
    await page.locator('button:has-text("ゲスト"), input[value*="ゲスト"]').click();

    await expect(page).toHaveURL(RESERVE_URL_PATTERN);
    // 初期搭乗者数を確認（3件）
    await expect(page.locator('[id^="passenger"]')).toHaveCount(3);

    // 3回追加ボタンを押す
    for (let i = 0; i < 3; i++) {
      await page.locator('#add-passenger-button').click();
    }

    // 期待結果: 搭乗者が6件になり追加ボタンが非表示
    await expect(page.locator('[id^="passenger"]')).toHaveCount(6);
    await expect(page.locator('#add-passenger-button')).not.toBeVisible();
  });

  // ----------------------------------------------------------------
  // 異常系C（クライアントバリデーション）
  // ----------------------------------------------------------------

  /**
   * B2-TC-16 往路フライト未選択 クライアントエラー
   * 対象遷移: #1（空席照会画面_結果表示 → 空席照会画面_クライアントエラー）
   */
  test('B2-TC-16 往路フライト未選択 クライアントエラー', async ({ page }) => {
    await searchFlights(page);

    // フライトを選択せずに予約ボタンを押す（B20103）
    await page.locator('#reserve-flights-button').click();

    // 期待結果: B202 に遷移せず、エラーメッセージが表示される
    await expect(page).not.toHaveURL(RESERVE_URL_PATTERN);
    await expect(page.getByText(/フライトを選択/)).toBeVisible();
  });

  /**
   * B2-TC-17 B201 ログインして予約 認証失敗エラー
   * 対象遷移: B201内（B201_表示中 → B201_ログインエラー → B201_表示中）
   */
  test('B2-TC-17 B201 ログインして予約 認証失敗エラー', async ({ page }) => {
    await searchFlights(page);
    await selectFlightsAndReserve(page);

    // ダイアログで誤ったパスワードを入力
    await page.locator('input[name="membershipNumber"]').fill(VALID_MEMBER.id);
    await page.locator('input[name="password"]').fill('wrongpass1');
    await page.locator('button:has-text("ログインして予約"), input[value*="ログインして予約"]').click();

    // 期待結果: B202 に遷移せず、ダイアログにエラーメッセージが表示される
    await expect(page).not.toHaveURL(RESERVE_URL_PATTERN);
    await expect(
      page.getByText(/会員番号またはパスワードが確認できませんでした/),
    ).toBeVisible();
  });

  /**
   * B2-TC-18 B202 必須項目未入力 クライアントエラー
   * 対象遷移: #7（B202_入力中 → B202_クライアントエラー）
   */
  test('B2-TC-18 B202 必須項目未入力 クライアントエラー', async ({ page }) => {
    await searchFlights(page);
    await selectFlightsAndReserve(page);
    await page.locator('button:has-text("ゲスト"), input[value*="ゲスト"]').click();
    await expect(page).toHaveURL(RESERVE_URL_PATTERN);

    // 搭乗者カタカナ氏名を入力せずに予約確認ボタンを押す（B20201）
    await page.locator('input[name="confirm"]').click();

    // 期待結果: B203 に遷移せず、クライアントエラーが表示される
    await expect(page).toHaveURL(RESERVE_URL_PATTERN);
    await expect(page.locator('.parsley-errors-list, .invalid')).toBeVisible();
  });

  // ----------------------------------------------------------------
  // 異常系S（サーババリデーション）
  // ----------------------------------------------------------------

  /**
   * B2-TC-06 B202 搭乗者0件でサーバエラー
   * 対象遷移: #9（B202_入力中 → B202_サーバエラー e.ar.b2.5002）
   */
  test('B2-TC-06 B202 搭乗者0件でサーバエラー', async ({ page }) => {
    await searchFlights(page);
    await selectFlightsAndReserve(page);
    await page.locator('button:has-text("ゲスト"), input[value*="ゲスト"]').click();
    await expect(page).toHaveURL(RESERVE_URL_PATTERN);

    // 搭乗者情報を入力せず（全空欄）、代表者情報だけ入力して送信
    await page.locator('[name="repFamilyName"]').fill('テスト');
    await page.locator('[name="repGivenName"]').fill('ハナコ');
    await page.locator('[name="repAge"]').fill('25');
    await page.locator('input[name="repGender"]').first().check();
    await page.locator('[name="repTel1"]').fill('03');
    await page.locator('[name="repTel2"]').fill('1234');
    await page.locator('[name="repTel3"]').fill('5678');
    await page.locator('[name="repMail"]').fill('test@example.com');
    await page.locator('input[name="confirm"]').click();

    // 期待結果: B202 に留まり、e.ar.b2.5002 エラーが表示される
    await expect(page).toHaveURL(RESERVE_URL_PATTERN);
    await expect(page.locator('.alert.alert-danger').getByText(/お客様情報を入力/)).toBeVisible();
  });

  /**
   * B2-TC-07 B202 予約代表者 年齢18歳未満エラー
   * 対象遷移: #9（e.ar.b2.2004）
   */
  test('B2-TC-07 B202 予約代表者 年齢18歳未満エラー', async ({ page }) => {
    await searchFlights(page);
    await selectFlightsAndReserve(page);
    await page.locator('button:has-text("ゲスト"), input[value*="ゲスト"]').click();
    await expect(page).toHaveURL(RESERVE_URL_PATTERN);

    await fillGuestReserveForm(page);
    // 代表者年齢を17に上書き
    await page.locator('[name="repAge"]').fill('17');
    await page.locator('input[name="confirm"]').click();

    await expect(page).toHaveURL(RESERVE_URL_PATTERN);
    await expect(page.locator('.alert.alert-danger').getByText(/18歳以上/)).toBeVisible();
  });

  // ----------------------------------------------------------------
  // 正常系（B203 → B204）
  // ----------------------------------------------------------------

  /**
   * B2-TC-10 B202→B203 申込内容確認画面 合計金額・内容表示
   * 対象遷移: #11（B202_入力中 → 申込確認画面）
   */
  test('B2-TC-10 B202→B203 申込内容確認画面 合計金額・内容表示', async ({ page }) => {
    await goToConfirmAsGuest(page);

    // 期待結果: B203 に遷移し、合計金額が ###,###円 形式で表示される
    await expect(page.getByText(/確認/)).toBeVisible();
    await expect(page.getByText(/\d+,\d+円/)).toBeVisible();
  });

  /**
   * B2-TC-11 B203 修正ボタンでB202に戻る（入力内容保持）
   * 対象遷移: B203 → B202（修正ボタン B20302）
   */
  test('B2-TC-11 B203 修正ボタンでB202に戻る（入力内容保持）', async ({ page }) => {
    await goToConfirmAsGuest(page);

    // 修正ボタンを押す（B20302）
    await page.locator('input[value*="修正"], button:has-text("修正")').click();

    // 期待結果: B202 に遷移し、入力内容が保持されている
    await expect(page).toHaveURL(RESERVE_URL_PATTERN);
    await expect(page.locator('[name="repMail"]')).toHaveValue('playwright.test@example.com');
  });

  /**
   * B2-TC-12 B203→B204 予約確定・完了画面表示
   * 対象遷移: #12（申込確認画面 → 予約完了画面）
   */
  test('B2-TC-12 B203→B204 予約確定・完了画面表示', async ({ page }) => {
    await goToConfirmAsGuest(page);

    // 予約確定ボタンを押す（B20301）
    await page.locator('input[value*="予約確定"], button:has-text("予約確定")').click();

    // 期待結果: 予約完了画面（B204）に遷移し、予約番号・金額・支払期限が表示される
    await expect(page.getByText(/予約番号/)).toBeVisible();
    await expect(page.getByText(/\d+,\d+円/)).toBeVisible();
    await expect(page.getByText(/お支払/)).toBeVisible();
  });

  // ----------------------------------------------------------------
  // 遷移テスト
  // ----------------------------------------------------------------

  /**
   * B2-TC-14 B205 トップに戻るボタン
   */
  test('B2-TC-14 B205 トップに戻るボタン（スキップ：空席不足データ必要）', async ({ page }) => {
    test.skip(true, '空席不足状態のテストデータが必要');
  });

  /**
   * B2-TC-15 B204 トップに戻るボタン
   * 対象遷移: B204 → TOP（B20401）
   */
  test('B2-TC-15 B204 トップに戻るボタン', async ({ page }) => {
    await goToConfirmAsGuest(page);
    await page.locator('input[value*="予約確定"], button:has-text("予約確定")').click();
    await expect(page.getByText(/予約番号/)).toBeVisible();

    // トップに戻るボタン押下（B20401）
    await page.locator('input[value*="トップ"], button:has-text("トップ"), a:has-text("トップ")').click();

    await expect(page).toHaveURL(TOP_URL);
  });

  /**
   * B2-TC-20 B205 空席照会へ戻るリンク
   * 対象遷移: #14（予約失敗画面 → 空席照会画面）
   * NOTE: 空席不足状態を作るのが困難なため、UI構造確認として実装
   */
  test.skip('B2-TC-20 B205 空席照会へ戻るリンク（スキップ：空席不足データ必要）', async () => {
    // 空席不足状態を再現するには同一フライトへの多数同時予約が必要
  });

});
