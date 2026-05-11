import { useState, useEffect } from 'react';

export type MarketType = 'SA' | 'US';

export interface MarketStatus {
  isOpen: boolean;
  label: string;      // "Market is open" | "Market is closed"
  statusText: string; // "Closes today at 3:00 PM" | "Opens Sunday at 10:00 AM"
}

// JS getDay(): 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat

function getSaudiStatus(): MarketStatus {
  // UTC+3
  const now = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const day = now.getUTCDay();     // 0=Sun..6=Sat
  const h   = now.getUTCHours();
  const m   = now.getUTCMinutes();
  const min = h * 60 + m;

  // أيام التداول: الأحد (0) - الخميس (4)
  const isTradeDay = day >= 0 && day <= 4;
  const afterOpen  = min >= 10 * 60;        // 10:00 ص
  const beforeClose = min < 15 * 60;        // 3:00 م

  const isOpen = isTradeDay && afterOpen && beforeClose;

  if (isOpen) {
    return {
      isOpen: true,
      label: 'Market is open',
      statusText: 'Closes today at 3:00 PM',
    };
  }

  // حسّب متى يفتح
  if (isTradeDay && !afterOpen) {
    return {
      isOpen: false,
      label: 'Market is closed',
      statusText: 'Opens today at 10:00 AM',
    };
  }

  // بعد الإغلاق أو في عطلة
  const daysToNext = day === 4   // الخميس → الأحد
    ? 3
    : day === 5                  // الجمعة → الأحد
    ? 2
    : day === 6                  // السبت → الأحد
    ? 1
    : 1;                         // أثناء أيام العمل بعد الإغلاق → الغد

  const nextDay = daysToNext === 1 && isTradeDay
    ? 'tomorrow'
    : day === 4 ? 'Sunday' : day === 5 ? 'Sunday' : 'Sunday';

  return {
    isOpen: false,
    label: 'Market is closed',
    statusText: `Opens ${nextDay} at 10:00 AM`,
  };
}

function getUSStatus(): MarketStatus {
  // UTC-4 (EDT) — للدقة يمكن تحسينها لاحقاً لـ EST/EDT
  const now = new Date(Date.now() - 4 * 60 * 60 * 1000);
  const day = now.getUTCDay();
  const h   = now.getUTCHours();
  const m   = now.getUTCMinutes();
  const min = h * 60 + m;

  // أيام التداول: الاثنين (1) - الجمعة (5)
  const isTradeDay  = day >= 1 && day <= 5;
  const afterOpen   = min >= 9 * 60 + 30;  // 9:30 ص
  const beforeClose = min < 16 * 60;       // 4:00 م

  const isOpen = isTradeDay && afterOpen && beforeClose;

  if (isOpen) {
    return {
      isOpen: true,
      label: 'Market is open',
      statusText: 'Closes today at 4:00 PM ET',
    };
  }

  if (isTradeDay && !afterOpen) {
    return {
      isOpen: false,
      label: 'Market is closed',
      statusText: 'Opens today at 9:30 AM ET',
    };
  }

  const nextDay = day === 5 || day === 6 ? 'Monday' : 'tomorrow';
  return {
    isOpen: false,
    label: 'Market is closed',
    statusText: `Opens ${nextDay} at 9:30 AM ET`,
  };
}

export function getMarketStatus(market: MarketType = 'SA'): MarketStatus {
  return market === 'US' ? getUSStatus() : getSaudiStatus();
}

export function useMarketStatus(market: MarketType = 'SA'): MarketStatus {
  const [status, setStatus] = useState<MarketStatus>(() => getMarketStatus(market));

  useEffect(() => {
    const update = () => setStatus(getMarketStatus(market));
    // تحديث كل دقيقة
    const timer = setInterval(update, 60 * 1000);
    return () => clearInterval(timer);
  }, [market]);

  return status;
}
