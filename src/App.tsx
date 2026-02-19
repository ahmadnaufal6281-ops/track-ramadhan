/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  UserCheck, 
  UserMinus, 
  Users, 
  RotateCcw, 
  CheckCircle2, 
  Circle,
  Calendar,
  BarChart3,
  TrendingUp,
  History
} from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { cn } from './lib/utils';

const FRIENDS = [
  "Yolanda",
  "Fadhil",
  "Nisa",
  "Aurel",
  "Jihan",
  "Alisa",
  "Opang",
  "Clara",
  "Caca"
];

interface AttendanceRecord {
  name: string;
  time: string | null;
  isPresent: boolean;
}

interface DailyData {
  [date: string]: AttendanceRecord[];
}

interface LogEntry {
  id: string;
  name: string;
  action: 'masuk' | 'keluar';
  time: string;
  date: string;
}

export default function App() {
  const [time, setTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // Multi-day attendance state
  const [history, setHistory] = useState<DailyData>(() => {
    const saved = localStorage.getItem('attendance_history_v2');
    if (saved) return JSON.parse(saved);
    return {};
  });

  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const saved = localStorage.getItem('attendance_logs_v2');
    return saved ? JSON.parse(saved) : [];
  });

  // Update digital clock every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('attendance_history_v2', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('attendance_logs_v2', JSON.stringify(logs));
  }, [logs]);

  // Get attendance for selected date
  const currentAttendance = useMemo(() => {
    if (history[selectedDate]) return history[selectedDate];
    return FRIENDS.map(name => ({ name, time: null, isPresent: false }));
  }, [history, selectedDate]);

  const toggleAttendance = (name: string) => {
    const now = new Date();
    const timeStr = format(now, 'HH:mm:ss');
    
    setHistory(prev => {
      const dayData = prev[selectedDate] || FRIENDS.map(n => ({ name: n, time: null, isPresent: false }));
      const updatedDayData = dayData.map(record => {
        if (record.name === name) {
          const isNowPresent = !record.isPresent;
          
          // Add to logs
          const newLog: LogEntry = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            action: isNowPresent ? 'masuk' : 'keluar',
            time: timeStr,
            date: selectedDate
          };
          setLogs(prevLogs => [newLog, ...prevLogs].slice(0, 100));

          return {
            ...record,
            isPresent: isNowPresent,
            time: isNowPresent ? timeStr : null
          };
        }
        return record;
      });
      return { ...prev, [selectedDate]: updatedDayData };
    });
  };

  const resetAttendance = () => {
    if (window.confirm('Yakin ingin mereset data hari ini?')) {
      setHistory(prev => ({
        ...prev,
        [selectedDate]: FRIENDS.map(name => ({ name, time: null, isPresent: false }))
      }));
    }
  };

  // Weekly Stats Calculation
  const weeklyStats = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }, (_, i) => format(addDays(start, i), 'yyyy-MM-dd'));
    
    return days.map(date => {
      const dayData = history[date] || [];
      return {
        name: format(parseISO(date), 'EEE', { locale: id }),
        fullDate: date,
        count: dayData.filter(r => r.isPresent).length,
        isToday: isSameDay(parseISO(date), new Date())
      };
    });
  }, [history]);

  // Friend Stats Calculation
  const friendStats = useMemo(() => {
    return FRIENDS.map(name => {
      let totalPresent = 0;
      Object.values(history).forEach((dayData) => {
        const records = dayData as AttendanceRecord[];
        if (records.find(r => r.name === name && r.isPresent)) {
          totalPresent++;
        }
      });
      return { name, total: totalPresent };
    }).sort((a, b) => b.total - a.total);
  }, [history]);

  const presentCount = currentAttendance.filter(r => r.isPresent).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans selection:bg-blue-100">
      {/* Header with Digital Clock */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Absensi Teman Rumah</h1>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Calendar size={12} />
                {format(time, 'EEEE, d MMMM yyyy', { locale: id })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 text-white px-6 py-2 rounded-2xl shadow-inner flex items-center gap-3">
              <Clock size={20} className="text-blue-400" />
              <span className="text-2xl font-mono font-bold tracking-tighter">
                {format(time, 'HH:mm:ss')}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Top Section: Stats & Weekly Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary Cards */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Hadir Hari Ini</p>
                <p className="text-3xl font-bold text-blue-600">{presentCount} <span className="text-slate-300 text-lg">/ {FRIENDS.length}</span></p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <UserCheck size={24} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Paling Rajin</p>
                <TrendingUp size={16} className="text-emerald-500" />
              </div>
              <div className="space-y-3">
                {friendStats.slice(0, 3).map((friend, idx) => (
                  <div key={friend.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                        idx === 0 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"
                      )}>
                        {idx + 1}
                      </span>
                      <span className="text-sm font-bold text-slate-700">{friend.name}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-400">{friend.total} Hari</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Weekly Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-600" />
                Statistik Mingguan
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Kehadiran</span>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} 
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: '#F8FAFC' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-[10px] font-bold shadow-xl">
                            {payload[0].value} Teman Hadir
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {weeklyStats.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.isToday ? '#2563EB' : '#E2E8F0'} 
                        className="transition-all duration-300 hover:fill-blue-400"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Attendance List */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-bold text-slate-900">Daftar Kehadiran</h2>
                  <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button 
                  onClick={resetAttendance}
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw size={14} />
                  Reset Hari Ini
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                <AnimatePresence initial={false}>
                  {currentAttendance.map((record) => (
                    <motion.div 
                      key={record.name}
                      layout
                      className={cn(
                        "px-8 py-5 flex items-center justify-between transition-colors group",
                        record.isPresent ? "bg-blue-50/30" : "hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg transition-all",
                          record.isPresent 
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                            : "bg-slate-100 text-slate-400"
                        )}>
                          {record.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className={cn(
                            "font-bold transition-colors",
                            record.isPresent ? "text-blue-900" : "text-slate-700"
                          )}>
                            {record.name}
                          </h3>
                          {record.isPresent ? (
                            <p className="text-xs font-medium text-blue-500 flex items-center gap-1">
                              <Clock size={10} />
                              Hadir jam {record.time}
                            </p>
                          ) : (
                            <p className="text-xs font-medium text-slate-400">Belum absen</p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => toggleAttendance(record.name)}
                        className={cn(
                          "px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
                          record.isPresent
                            ? "bg-white border border-blue-200 text-blue-600 shadow-sm hover:bg-blue-50"
                            : "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200"
                        )}
                      >
                        {record.isPresent ? (
                          <>
                            <CheckCircle2 size={16} />
                            Hadir
                          </>
                        ) : (
                          <>
                            <Circle size={16} />
                            Absen
                          </>
                        )}
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>
          </div>

          {/* Sidebar: Logs */}
          <div className="space-y-6">
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
                <History size={14} />
                Riwayat Aktivitas
              </h3>
              <div className="bg-white rounded-[2rem] border border-slate-200 p-2 shadow-sm max-h-[600px] overflow-y-auto">
                <AnimatePresence initial={false}>
                  {logs.length > 0 ? (
                    <div className="space-y-1">
                      {logs.map((log) => (
                        <motion.div 
                          key={log.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between py-3 px-4 rounded-2xl hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              log.action === 'masuk' ? "bg-emerald-500" : "bg-rose-500"
                            )} />
                            <div>
                              <p className="text-xs font-bold text-slate-700">{log.name}</p>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {log.action === 'masuk' ? 'Telah Hadir' : 'Telah Keluar'} • {log.date === format(new Date(), 'yyyy-MM-dd') ? 'Hari Ini' : log.date}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                            {log.time}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center space-y-2">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                        <History size={20} />
                      </div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Belum ada riwayat</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </section>
          </div>
        </div>

        {/* Footer Info */}
        <footer className="text-center py-12 space-y-4 border-t border-slate-100">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">
            Sistem Absensi Digital Teman Rumah v2.0
          </p>
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hadir</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-300" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Belum Hadir</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
