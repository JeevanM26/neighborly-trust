/* ---------------------------------------------------------
   Telegram Bot Dynamic Passcode / OTP Generator for Owners
   Neighborly Trust — Security & 2FA Engine
--------------------------------------------------------- */

export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

const DEFAULT_CONFIG: TelegramConfig = {
  botToken: typeof process !== 'undefined' && process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN ? process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN : '',
  chatId: '',
};

// Generate a random 4-digit numeric OTP
export function generateDynamicPasscode(length: number = 4): string {
  let passcode = '';
  for (let i = 0; i < length; i++) {
    passcode += Math.floor(Math.random() * 10).toString();
  }
  return passcode;
}

export function getTelegramConfig(): TelegramConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const savedToken = localStorage.getItem('nt_telegram_bot_token');
    const savedChatId = localStorage.getItem('nt_telegram_chat_id');
    const envToken = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || '' : '';
    return {
      botToken: savedToken !== null && savedToken !== '' ? savedToken : envToken,
      chatId: savedChatId !== null ? savedChatId : DEFAULT_CONFIG.chatId,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveTelegramConfig(config: TelegramConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('nt_telegram_bot_token', config.botToken);
    localStorage.setItem('nt_telegram_chat_id', config.chatId);
  } catch (e) {
    console.error('Failed to save Telegram config', e);
  }
}

export async function sendTelegramOtp(
  phone: string,
  passcode: string,
  customConfig?: TelegramConfig
): Promise<{ success: boolean; message: string }> {
  const config = customConfig || getTelegramConfig();

  if (!config.botToken || !config.chatId) {
    return {
      success: false,
      message: 'Telegram Bot Token or Chat ID not set. (Using local demo code)',
    };
  }

  const text = `🔐 *Neighborly Trust — Owner Login OTP*\n\n📱 Owner Mobile: \`+91 ${phone}\`\n💬 Your 4-digit OTP is: *${passcode}*\n\n⏰ Valid for 5 minutes. Do not share this OTP with anyone.`;

  try {
    const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: text,
        parse_mode: 'Markdown',
      }),
    });

    const data = await res.json();
    if (data.ok) {
      return { success: true, message: 'Passcode sent to Telegram!' };
    } else {
      return {
        success: false,
        message: data.description || 'Failed to send Telegram message.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Network error connecting to Telegram Bot API.',
    };
  }
}
