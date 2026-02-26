// =====================================================
// Phone Number Utilities
// =====================================================

/**
 * 验证中国大陆手机号格式
 * @param phone - 手机号字符串
 * @returns 是否为有效手机号
 */
export function isValidPhone(phone: string): boolean {
  // 中国大陆手机号：1开头，第二位3-9，共11位数字
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * 格式化手机号显示（隐藏中间4位）
 * @param phone - 手机号字符串
 * @returns 格式化后的手机号，如：138****1234
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length !== 11) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(7)}`;
}

/**
 * 清理手机号输入（移除空格、短横线等）
 * @param phone - 原始手机号
 * @returns 清理后的手机号
 */
export function cleanPhone(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, '');
}

/**
 * 获取手机号归属运营商
 * @param phone - 手机号字符串
 * @returns 运营商名称
 */
export function getPhoneCarrier(phone: string): string {
  if (!isValidPhone(phone)) return '未知';

  const prefix = phone.slice(0, 3);

  // 中国移动
  if (/^134[0-8]|^135|^136|^137|^138|^139|^150|^151|^152|^157|^158|^159|^182|^183|^184|^187|^188|^178/.test(prefix)) {
    return '中国移动';
  }

  // 中国联通
  if (/^130|^131|^132|^155|^156|^185|^186|^145/.test(prefix)) {
    return '中国联通';
  }

  // 中国电信
  if (/^133|^153|^180|^181|^189|^173|^177/.test(prefix)) {
    return '中国电信';
  }

  return '未知';
}
