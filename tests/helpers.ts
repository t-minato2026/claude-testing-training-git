import { type Page, expect } from '@playwright/test';

// ----------------------------------------------------------------
// URL 定数
// ----------------------------------------------------------------

export const BASE_URL = 'http://localhost:8082/atrs';
export const TOP_URL = `${BASE_URL}/ticket/search?topForm`;
export const LOGIN_URL = `${BASE_URL}/auth/login?form`;
export const REGISTER_URL = `${BASE_URL}/member/register?form`;
export const UPDATE_URL = `${BASE_URL}/member/update?form`;

// ----------------------------------------------------------------
// テストデータ定数
// ----------------------------------------------------------------

/** サンプルアプリ初期会員データ */
export const VALID_MEMBER = {
  id: '0000000001',
  password: 'aaaaa11111',
  name: '電電 花子',
} as const;

// ----------------------------------------------------------------
// 日付ユーティリティ
// ----------------------------------------------------------------

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

/** 今日から n 日後の日付文字列 (yyyy/MM/dd) を返す */
export function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

// ----------------------------------------------------------------
// 共通ヘルパー関数
// ----------------------------------------------------------------

/** TOP画面からログイン画面へ遷移してログインする */
export async function doLogin(
  page: Page,
  memberId = VALID_MEMBER.id,
  password = VALID_MEMBER.password,
): Promise<void> {
  await page.goto(TOP_URL);
  await page.locator('a[href="/atrs/auth/login?form"]').click();
  await page.locator('#membershipNumber').fill(memberId);
  await page.locator('#password').fill(password);
  await page.locator('#login-btn').click();
  await expect(page).toHaveURL(TOP_URL);
}

/**
 * ヘッダのユーザ名をクリックしてメニューを開き、ログアウトリンクをクリックする。
 * ログアウトはサーバへの POST フォーム送信（logoutForm）で行われる。
 */
export async function doLogout(page: Page): Promise<void> {
  await page.locator('#header').getByText(VALID_MEMBER.name).click();
  await page.getByRole('link', { name: 'ログアウト' }).click();
}

/**
 * TOP 画面の空席照会フォームを指定条件で送信し、空席照会画面（B102）へ遷移する。
 * depAirport / arrAirport は空港ドロップダウンの表示テキスト（例："東京(羽田)"）を指定する。
 */
export async function searchFlights(
  page: Page,
  opts: {
    flightType?: 'roundTrip' | 'oneWay';
    depAirport?: string;
    arrAirport?: string;
    outwardDate?: string;
    homewardDate?: string;
    boardingClass?: string;
  } = {},
): Promise<void> {
  const {
    flightType = 'roundTrip',
    depAirport = '東京(羽田)',
    arrAirport = '大阪(伊丹)',
    outwardDate = daysFromNow(1),
    homewardDate = daysFromNow(2),
    boardingClass = '一般席',
  } = opts;

  await page.goto(TOP_URL);
  await page.getByLabel('往復').check();
  if (flightType === 'oneWay') await page.getByLabel('片道').check();

  await page.locator('#ticketSearchForm_depAirportCd').selectOption({ label: depAirport });
  await page.locator('#ticketSearchForm_arrAirportCd').selectOption({ label: arrAirport });

  await page.locator('input[name="outwardDate"]').fill(outwardDate);
  if (flightType === 'roundTrip') {
    await page.locator('input[name="homewardDate"]').fill(homewardDate);
  }

  await page.getByLabel(boardingClass).check();
  await page.locator('#flights-search-button').click();
}

/**
 * 空席照会画面（B102）で往路・復路の最初のフライトを選択し、予約ボタンを押す（B20103）。
 */
export async function selectFlightsAndReserve(
  page: Page,
  flightType: 'roundTrip' | 'oneWay' = 'roundTrip',
): Promise<void> {
  await page.locator('input[name="outward-flight-select"]').first().check();
  if (flightType === 'roundTrip') {
    await page.locator('input[name="homeward-flight-select"]').first().check();
  }
  await page.locator('#reserve-flights-button').click();
}

/**
 * お客様情報入力画面（B202）のゲスト用フォームに最小限の有効値を入力する。
 * 搭乗者1人・代表者情報を埋める。
 */
export async function fillGuestReserveForm(page: Page): Promise<void> {
  // 搭乗者1
  await page.locator('[name="passengerFormList[0].familyName"]').fill('テスト');
  await page.locator('[name="passengerFormList[0].givenName"]').fill('ハナコ');
  await page.locator('[name="passengerFormList[0].age"]').fill('25');
  await page.locator('input[name="passengerFormList[0].gender"]').first().check();

  // 代表者情報
  await page.locator('[name="repFamilyName"]').fill('テスト');
  await page.locator('[name="repGivenName"]').fill('ハナコ');
  await page.locator('[name="repAge"]').fill('25');
  await page.locator('input[name="repGender"]').first().check();
  await page.locator('[name="repTel1"]').fill('03');
  await page.locator('[name="repTel2"]').fill('1234');
  await page.locator('[name="repTel3"]').fill('5678');
  await page.locator('[name="repMail"]').fill('playwright.test@example.com');
}

/**
 * 会員情報登録フォーム（C101）の全必須項目に有効な値を入力する。
 */
export async function fillMemberRegisterForm(
  page: Page,
  overrides: {
    mail?: string;
    reMail?: string;
    password?: string;
    rePassword?: string;
    tel1?: string;
    tel2?: string;
    dateOfBirth?: string;
  } = {},
): Promise<void> {
  await page.locator('[name="kanjiFamilyName"]').fill('山田');
  await page.locator('[name="kanjiGivenName"]').fill('太郎');
  await page.locator('[name="kanaFamilyName"]').fill('ヤマダ');
  await page.locator('[name="kanaGivenName"]').fill('タロウ');
  await page.locator('input[name="gender"]').first().check();
  await page.locator('input[name="dateOfBirth"]').fill(overrides.dateOfBirth ?? '1990/01/15');
  await page.locator('[name="tel1"]').fill(overrides.tel1 ?? '03');
  await page.locator('[name="tel2"]').fill(overrides.tel2 ?? '1234');
  await page.locator('[name="tel3"]').fill('5678');
  await page.locator('[name="zipCode1"]').fill('100');
  await page.locator('[name="zipCode2"]').fill('0001');
  await page.locator('[name="address"]').fill('東京都千代田区1-1-1');
  await page.locator('[name="mail"]').fill(overrides.mail ?? 'playwright.test@example.com');
  await page.locator('[name="reEnterMail"]').fill(overrides.reMail ?? 'playwright.test@example.com');
  await page.locator('input[name="creditTypeCd"]').first().check();
  await page.locator('[name="creditNo"]').fill('1234567890123456');
  await page.locator('select[name="creditMonth"]').selectOption({ index: 1 });
  await page.locator('select[name="creditYear"]').selectOption({ index: 1 });
  await page.locator('[name="password"]').fill(overrides.password ?? 'testpass01');
  await page.locator('[name="reEnterPassword"]').fill(overrides.rePassword ?? 'testpass01');
}
