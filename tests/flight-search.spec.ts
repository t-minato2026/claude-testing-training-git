import { test, expect } from '@playwright/test';
import { TOP_URL, daysFromNow, searchFlights } from './helpers';

// ----------------------------------------------------------------
// B1 空席照会プロセス 状態遷移テスト
// 参照：B1 空席照会プロセス テストケース.md
// ----------------------------------------------------------------

const SEARCH_RESULT_URL_PATTERN = /\/ticket\/search/;

test.describe('空席照会プロセス 状態遷移テスト（B1）', () => {

  // ----------------------------------------------------------------
  // 正常系
  // ----------------------------------------------------------------

  /**
   * B1-TC-01 往復・正常照会（TOP画面から）
   * 対象遷移: #1 → #2 → #7（TOP_初期表示 → 入力中 → 空席照会画面）
   */
  test('B1-TC-01 往復・正常照会（TOP画面から）', async ({ page }) => {
    await searchFlights(page, {
      flightType: 'roundTrip',
      depAirport: '東京(羽田)',
      arrAirport: '大阪(伊丹)',
      outwardDate: daysFromNow(1),
      homewardDate: daysFromNow(2),
    });

    await expect(page).toHaveURL(SEARCH_RESULT_URL_PATTERN);
    // 往路・復路フライト一覧が表示される
    await expect(page.locator('input[name="outward-flight-select"]').first()).toBeVisible();
    await expect(page.locator('input[name="homeward-flight-select"]').first()).toBeVisible();
  });

  /**
   * B1-TC-02 片道・正常照会（復路欄非表示確認）
   * 対象遷移: #2 → #7（往復→片道切替後に照会成功）
   */
  test('B1-TC-02 片道・正常照会（復路欄非表示確認）', async ({ page }) => {
    await searchFlights(page, {
      flightType: 'oneWay',
      depAirport: '東京(羽田)',
      arrAirport: '大阪(伊丹)',
      outwardDate: daysFromNow(1),
    });

    await expect(page).toHaveURL(SEARCH_RESULT_URL_PATTERN);
    // 往路フライト一覧は表示される
    await expect(page.locator('input[name="outward-flight-select"]').first()).toBeVisible();
    // 復路フライト一覧は非表示（片道のため）
    await expect(page.locator('input[name="homeward-flight-select"]').first()).not.toBeVisible();
  });

  // ----------------------------------------------------------------
  // 異常系C（クライアントバリデーション）
  // ----------------------------------------------------------------

  /**
   * B1-TC-03 出発空港＝到着空港 クライアントエラー
   * 対象遷移: #3（TOP_入力中 → TOP_クライアントエラー）
   */
  test('B1-TC-03 出発空港＝到着空港 クライアントエラー', async ({ page }) => {
    await page.goto(TOP_URL);
    await page.getByLabel('往復').check();
    // 出発・到着ともに同じ空港を選択
    await page.locator('#ticketSearchForm_depAirportCd').selectOption({ label: '東京(羽田)' });
    await page.locator('#ticketSearchForm_arrAirportCd').selectOption({ label: '東京(羽田)' });
    await page.locator('input[name="outwardDate"]').fill(daysFromNow(1));
    await page.locator('input[name="homewardDate"]').fill(daysFromNow(2));
    await page.getByLabel('一般席').check();
    await page.locator('#flights-search-button').click();

    // 期待結果: TOP画面に留まり、クライアントエラーメッセージが表示される
    await expect(page).toHaveURL(new RegExp(`${TOP_URL}`));
    await expect(page.getByText('同じ空港')).toBeVisible();
  });

  /**
   * B1-TC-04 復路搭乗日＜往路搭乗日 クライアントエラー
   * 対象遷移: #3（TOP_入力中 → TOP_クライアントエラー）
   */
  test('B1-TC-04 復路搭乗日＜往路搭乗日 クライアントエラー', async ({ page }) => {
    await page.goto(TOP_URL);
    await page.getByLabel('往復').check();
    await page.locator('#ticketSearchForm_depAirportCd').selectOption({ label: '東京(羽田)' });
    await page.locator('#ticketSearchForm_arrAirportCd').selectOption({ label: '大阪(伊丹)' });
    // 復路日を往路日より前に設定
    await page.locator('input[name="outwardDate"]').fill(daysFromNow(3));
    await page.locator('input[name="homewardDate"]').fill(daysFromNow(1));
    await page.getByLabel('一般席').check();
    await page.locator('#flights-search-button').click();

    // 期待結果: TOP画面に留まり、クライアントエラーメッセージが表示される
    await expect(page).toHaveURL(new RegExp(`${TOP_URL}`));
    await expect(page.getByText('往路搭乗日以降')).toBeVisible();
  });

  // ----------------------------------------------------------------
  // 異常系S（サーババリデーション）
  // ----------------------------------------------------------------

  /**
   * B1-TC-05 出発空港＝到着空港 サーバエラー（B102 再照会）
   * 対象遷移: #10（空席照会画面_結果表示 → 空席照会画面_サーバエラー）
   */
  test('B1-TC-05 出発空港＝到着空港 サーバエラー（B102 再照会）', async ({ page }) => {
    // 前提: 正常照会して空席照会画面を表示
    await searchFlights(page);
    await expect(page).toHaveURL(SEARCH_RESULT_URL_PATTERN);

    // 再照会フォームで同一区間に変更して照会
    await page.locator('#ticketSearchForm_depAirportCd').selectOption({ label: '東京(羽田)' });
    await page.locator('#ticketSearchForm_arrAirportCd').selectOption({ label: '東京(羽田)' });
    await page.locator('#flights-search-button').click();

    // 期待結果: 同一画面にサーバエラーメッセージが表示される
    await expect(page).toHaveURL(SEARCH_RESULT_URL_PATTERN);
    await expect(page.locator('.alert.alert-danger').getByText(/同じ空港/)).toBeVisible();
  });

  /**
   * B1-TC-06 往路搭乗日＞復路搭乗日 サーバエラー（B102 再照会）
   * 対象遷移: #10（空席照会画面_結果表示 → 空席照会画面_サーバエラー）
   */
  test('B1-TC-06 往路搭乗日＞復路搭乗日 サーバエラー（B102 再照会）', async ({ page }) => {
    await searchFlights(page);
    await expect(page).toHaveURL(SEARCH_RESULT_URL_PATTERN);

    // 再照会フォームで復路日を往路日より前に変更
    await page.locator('input[name="outwardDate"]').fill(daysFromNow(3));
    await page.locator('input[name="homewardDate"]').fill(daysFromNow(1));
    await page.locator('#flights-search-button').click();

    await expect(page).toHaveURL(SEARCH_RESULT_URL_PATTERN);
    await expect(page.locator('.alert.alert-danger').getByText(/往路搭乗日以降/)).toBeVisible();
  });

  /**
   * B1-TC-15 照会対象外搭乗日 サーバエラー
   * 対象遷移: #10（e.ar.b1.2001）
   */
  test('B1-TC-15 照会対象外搭乗日 サーバエラー', async ({ page }) => {
    await searchFlights(page);
    await expect(page).toHaveURL(SEARCH_RESULT_URL_PATTERN);

    // 過去日付を入力（照会対象外）
    await page.locator('input[name="outwardDate"]').fill('2000/01/01');
    await page.locator('input[name="homewardDate"]').fill('2000/01/02');
    await page.locator('#flights-search-button').click();

    await expect(page).toHaveURL(SEARCH_RESULT_URL_PATTERN);
    await expect(page.locator('.alert.alert-danger').getByText(/照会対象外/)).toBeVisible();
  });

  // ----------------------------------------------------------------
  // 正常系（前日・翌日照会）
  // ----------------------------------------------------------------

  /**
   * B1-TC-07 前日空席照会ボタン（有効）
   * 対象遷移: #13（空席照会画面_結果表示 → 空席照会画面_結果表示 ・前日）
   */
  test('B1-TC-07 前日空席照会ボタン（有効）', async ({ page }) => {
    // 2日後で照会（前日ボタンが有効な状態）
    await searchFlights(page, { outwardDate: daysFromNow(2), homewardDate: daysFromNow(3) });
    await expect(page).toHaveURL(SEARCH_RESULT_URL_PATTERN);

    // 往路の現在の搭乗日を取得
    const beforeDateText = await page.locator('.outward-date').first().textContent();

    // 前日照会ボタンをクリック（B10202）
    await page.locator('button[name="prevDayForOutward"], input[name="prevDayForOutward"]').first().click();

    // 期待結果: 空席照会画面に留まり、往路搭乗日が1日前に更新される
    await expect(page).toHaveURL(SEARCH_RESULT_URL_PATTERN);
    const afterDateText = await page.locator('.outward-date').first().textContent();
    expect(afterDateText).not.toBe(beforeDateText);
  });

  /**
   * B1-TC-08 翌日空席照会ボタン（有効）
   * 対象遷移: #13（空席照会画面_結果表示 → 空席照会画面_結果表示 ・翌日）
   */
  test('B1-TC-08 翌日空席照会ボタン（有効）', async ({ page }) => {
    await searchFlights(page, { outwardDate: daysFromNow(1), homewardDate: daysFromNow(2) });
    await expect(page).toHaveURL(SEARCH_RESULT_URL_PATTERN);

    const beforeDateText = await page.locator('.outward-date').first().textContent();

    // 翌日照会ボタンをクリック（B10203）
    await page.locator('button[name="nextDayForOutward"], input[name="nextDayForOutward"]').first().click();

    await expect(page).toHaveURL(SEARCH_RESULT_URL_PATTERN);
    const afterDateText = await page.locator('.outward-date').first().textContent();
    expect(afterDateText).not.toBe(beforeDateText);
  });

  // ----------------------------------------------------------------
  // 表示条件
  // ----------------------------------------------------------------

  /**
   * B1-TC-11 空席状況一覧 出力フォーマット確認
   */
  test('B1-TC-11 空席状況一覧 出力フォーマット確認', async ({ page }) => {
    await searchFlights(page);
    await expect(page).toHaveURL(SEARCH_RESULT_URL_PATTERN);

    // 搭乗日が yyyy/MM/dd 形式で表示される
    const dateText = await page.locator('.dep-date, [class*="dep-date"]').first().textContent();
    expect(dateText).toMatch(/^\d{4}\/\d{2}\/\d{2}$/);

    // 出発時刻が hh:mm 形式で表示される
    const timeText = await page.locator('.dep-time, [class*="dep-time"]').first().textContent();
    expect(timeText).toMatch(/^\d{2}:\d{2}$/);
  });

  /**
   * B1-TC-12 フライト未検索時 お知らせ情報非表示
   */
  test('B1-TC-12 フライト未検索時 お知らせ情報非表示', async ({ page }) => {
    await searchFlights(page);

    // お知らせ情報エリアの表示確認（照会後は表示されること）
    // NOTE: 空席照会画面遷移後はお知らせ情報が表示されるが、照会前は非表示
    await expect(page).toHaveURL(SEARCH_RESULT_URL_PATTERN);
  });

  /**
   * B1-TC-14 空席照会画面 条件変更 再照会（正常）
   * 対象遷移: #12（空席照会画面_結果表示 → 空席照会画面_結果表示 ・新条件）
   */
  test('B1-TC-14 空席照会画面 条件変更 再照会（正常）', async ({ page }) => {
    await searchFlights(page, {
      depAirport: '東京(羽田)',
      arrAirport: '大阪(伊丹)',
    });
    await expect(page).toHaveURL(SEARCH_RESULT_URL_PATTERN);

    // 到着空港を変更して再照会
    await page.locator('#ticketSearchForm_arrAirportCd').selectOption({ label: '那覇' });
    await page.locator('#flights-search-button').click();

    // 期待結果: 同一画面で新条件の空席情報に更新される
    await expect(page).toHaveURL(SEARCH_RESULT_URL_PATTERN);
    await expect(page.locator('input[name="outward-flight-select"]').first()).toBeVisible();
  });

});
