import CryptoJS from 'crypto-js';

/**
 * 驗證 Telegram Login Widget 的哈希
 * 參考：https://core.telegram.org/widgets/login#checking-authorization
 */
export function verifyTelegramHash(data: any, botToken: string): boolean {
  try {
    const { hash, ...rest } = data;

    // 1. 檢查 auth_date 是否過期（24小時）
    const authDate = rest.auth_date;
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) {
      return false;
    }

    // 2. 按照 key 排序並構建檢查字符串
    const checkKeys = Object.keys(rest).sort();
    const checkString = checkKeys
      .map(key => `${key}=${rest[key]}`)
      .join('\n');

    // 3. 計算 HMAC-SHA256
    const secretKey = CryptoJS.HmacSHA256(botToken, 'WebAppData');
    const calculatedHash = CryptoJS.HmacSHA256(checkString, secretKey).toString();

    // 4. 比較（常數時間比較更安全）
    return CryptoJS.enc.Hex.parse(calculatedHash).toString() === hash;
  } catch (error) {
    console.error('Telegram hash verification failed:', error);
    return false;
  }
}

/**
 * 生成 Telegram 登入網址
 */
export function generateTelegramLoginUrl(botName: string, redirectUrl: string): string {
  const params = new URLSearchParams({
    bot: botName,
    origin: redirectUrl
  });
  return `https://t.me/${botName}?start=${params.toString()}`;
}

/**
 * 解析 Telegram HTML 格式（bold, italic, link...）
 */
export function parseTelegramHtml(text: string): string {
  // 簡單的 HTML 標籤轉換
  return text
    .replace(/<b>(.*?)<\/b>/gi, '<strong>$1</strong>')
    .replace(/<i>(.*?)<\/i>/gi, '<em>$1</em>')
    .replace(/<a href="(.*?)">(.*?)<\/a>/gi, '<a href="$1" target="_blank">$2</a>')
    .replace(/<code>(.*?)<\/code>/gi, '<code>$1</code>');
}

/**
 * 生成安全的随機字符串
 */
export function generateRandomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 計算兩個日期之間的天數
 */
export function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
