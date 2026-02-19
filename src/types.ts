export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
}

export interface DayProgress {
  fasting: boolean;
  prayers: {
    fajr: boolean;
    dhuhr: boolean;
    asr: boolean;
    maghrib: boolean;
    isha: boolean;
    tarawih: boolean;
  };
  quran: {
    juz: number;
    completed: boolean;
  };
}

export interface RamadanDay {
  ramadanDate: number;
  gregorianDate: Date;
  isToday: boolean;
}
