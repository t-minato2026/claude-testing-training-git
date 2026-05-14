import { test, expect } from '@playwright/test';
import {
  VALID_MEMBER,
  daysFromNow,
  searchFlights,
  selectFlightsAndReserve,
} from './helpers';

function parseFare(text: string): number {
  return parseInt(text.replace(/[¥,\s]/g, ''), 10);
}

test.describe('合計金額算出 - 子供料金適用確認', () => {

  /**
   * TC-R-001 子供料金の適用確認
   * 12歳未満（5歳）の搭乗者を含む場合、合計金額が大人2名分の運賃合計より少ないことを確認する。
   * 子供料金 = 基本運賃 × 60% − 割引額 のため、大人運賃 × 2 を下回るはず。
   */
  test('TC-R-001 子供搭乗者（5歳）を含む場合、合計金額が大人2名分より少ないこと', async ({ page }) => {
    // 1. 片道・東京(羽田)→大阪(伊丹)・7日後で空席照会
    //    searchFlights 内で #ticketSearchForm_depAirportCd の toBeVisible() を確認済み
    await searchFlights(page, {
      flightType: 'oneWay',
      depAirport: '東京(羽田)',
      arrAirport: '大阪(伊丹)',
      outwardDate: daysFromNow(7),
    });

    // 2. 最初のフライトを選択して「予約」ボタンを押す
    //    selectFlightsAndReserve 内で往路フライト一覧の toBeVisible() を確認済み
    await selectFlightsAndReserve(page, 'oneWay');

    // 3. B201ダイアログ：会員番号とパスワードを入力してログインして予約
    await expect(page.locator('input[name="membershipNumber"]')).toBeVisible();
    await page.locator('input[name="membershipNumber"]').fill(VALID_MEMBER.id);
    await page.locator('input[name="password"]').fill(VALID_MEMBER.password);
    await page.locator('button:has-text("ログインして予約"), input[value*="ログインして予約"]').click();

    // 4. B202 に遷移したことを確認してから搭乗者を追加する
    await expect(page.locator('#add-passenger-button')).toBeVisible();
    await page.locator('#add-passenger-button').click();

    // 5. 搭乗者2（5歳・男性）の情報を入力
    await expect(page.locator('[name="passengerFormList[1].familyName"]')).toBeVisible();
    await page.locator('[name="passengerFormList[1].familyName"]').fill('テスト');
    await page.locator('[name="passengerFormList[1].givenName"]').fill('タロウ');
    await page.locator('[name="passengerFormList[1].age"]').fill('5');
    await page.locator('input[name="passengerFormList[1].gender"]').first().check();

    // 6. 「予約確認」ボタンを押して B203 へ遷移する
    await page.locator('input[name="confirm"]').click();

    // 7. B203 に遷移したことを確認してから金額を取得する
    //    reserveConfirm.jsp: <h3>合計金額</h3> → <p> に ¥###,### 形式で表示
    await expect(page.locator('h3:has-text("合計金額")')).toBeVisible();

    const fareLocator = page
      .locator('section:has(h3:has-text("選択フライト")) table tbody tr td:last-child')
      .first();
    await expect(fareLocator).toBeVisible();
    const adultFare = parseFare((await fareLocator.textContent()) ?? '');

    const totalLocator = page.locator('h3:has-text("合計金額") + p');
    await expect(totalLocator).toBeVisible();
    const totalFare = parseFare((await totalLocator.textContent()) ?? '');

    // 取得した金額が有効値であることを確認
    expect(adultFare).toBeGreaterThan(0);
    expect(totalFare).toBeGreaterThan(0);

    // 合計金額が大人2名分の運賃より少ないことを確認
    // （子供料金 < 大人運賃 のため、大人1名＋子供1名 < 大人2名分 となるはず）
    expect(totalFare).toBeLessThan(adultFare * 2);
  });

});
