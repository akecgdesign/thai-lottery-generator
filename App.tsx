
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  Hash, 
  Zap,
  Calendar,
  Filter,
  Eye,
  EyeOff,
  Coins,
  Calculator,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  CheckCircle2,
  BarChart3,
  Loader2,
  TrendingUp,
  Award,
  Trash2
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import NumberSelector from './components/NumberSelector';
import ResultCard from './components/ResultCard';

// Initialize AI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const DAY_THEMES: Record<number | string, { bg: string; text: string; hex: string; border: string; btn: string; tag: string; switch: string }> = {
  0: { bg: 'bg-red-600', text: 'text-red-600', hex: '#dc2626', border: 'border-red-100', btn: 'bg-red-600 hover:bg-red-700', tag: 'bg-red-100 text-red-700', switch: 'bg-red-500' },
  1: { bg: 'bg-yellow-400', text: 'text-yellow-600', hex: '#facc15', border: 'border-yellow-100', btn: 'bg-yellow-400 hover:bg-yellow-500 text-slate-900', tag: 'bg-yellow-100 text-yellow-800', switch: 'bg-yellow-400' },
  2: { bg: 'bg-pink-500', text: 'text-pink-600', hex: '#ec4899', border: 'border-pink-100', btn: 'bg-pink-500 hover:bg-pink-600', tag: 'bg-pink-100 text-pink-700', switch: 'bg-pink-500' },
  3: { bg: 'bg-green-600', text: 'text-green-600', hex: '#16a34a', border: 'border-green-100', btn: 'bg-green-600 hover:bg-green-700', tag: 'bg-green-100 text-green-700', switch: 'bg-green-600' },
  4: { bg: 'bg-orange-500', text: 'text-orange-600', hex: '#f97316', border: 'border-orange-100', btn: 'bg-orange-500 hover:bg-orange-600', tag: 'bg-orange-100 text-orange-700', switch: 'bg-orange-500' },
  5: { bg: 'bg-sky-400', text: 'text-sky-600', hex: '#38bdf8', border: 'border-sky-100', btn: 'bg-sky-400 hover:bg-sky-500', tag: 'bg-sky-100 text-sky-700', switch: 'bg-sky-400' },
  6: { bg: 'bg-purple-600', text: 'text-purple-600', hex: '#9333ea', border: 'border-purple-100', btn: 'bg-purple-600 hover:bg-purple-700', tag: 'bg-purple-100 text-purple-700', switch: 'bg-purple-600' },
  default: { bg: 'bg-indigo-600', text: 'text-indigo-600', hex: '#4f46e5', border: 'border-indigo-100', btn: 'bg-indigo-600 hover:bg-indigo-700', tag: 'bg-indigo-100 text-indigo-700', switch: 'bg-indigo-500' }
};

const DAY_NUMBERS = [
  { label: 'อาทิตย์', numbers: [3, 5, 6, 9, 4], dayIdx: 0 },
  { label: 'จันทร์', numbers: [5, 3, 9, 1, 6, 7], dayIdx: 1 },
  { label: 'อังคาร', numbers: [7, 4, 2, 8, 5, 6], dayIdx: 2 },
  { label: 'พุธ', numbers: [4, 8, 5, 7, 1, 6], dayIdx: 3 },
  { label: 'พฤหัส', numbers: [7, 2, 1, 9, 6, 5], dayIdx: 4 },
  { label: 'ศุกร์', numbers: [2, 0, 4, 1, 5, 7], dayIdx: 5 },
  { label: 'เสาร์', numbers: [8, 3, 2, 0, 1, 9], dayIdx: 6 },
];

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const THAI_DAYS_LONG = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];

type BetType = 'top2' | 'bottom2' | 'sets3' | 'back6' | 'crossing3';

interface StatResult {
  digit: number;
  frequency: number;
}

const App: React.FC = () => {
  const [currentYearBE, setCurrentYearBE] = useState<number>(new Date().getFullYear() + 543);
  const [selectedDraw, setSelectedDraw] = useState<string>("");
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [currentDayIdx, setCurrentDayIdx] = useState<number | null>(null);
  const [isFiltering, setIsFiltering] = useState<boolean>(false);
  const [betAmount, setBetAmount] = useState<string>("1");
  const [win3Mode, setWin3Mode] = useState<'sets' | '6back' | 'crossing'>('6back');
  const [win2Mode, setWin2Mode] = useState<'reverse' | 'straight'>('reverse');
  const [selectedBets, setSelectedBets] = useState<BetType[]>(['top2', 'bottom2', 'back6']);
  
  // Statistics State
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [statsData, setStatsData] = useState<{ top2: StatResult[], bottom2: StatResult[], top3: StatResult[] } | null>(null);
  const [showStats, setShowStats] = useState(false);

  const activeTheme = currentDayIdx !== null ? DAY_THEMES[currentDayIdx] : DAY_THEMES.default;

  const lotteryDates = useMemo(() => {
    const dates = [];
    const adYear = currentYearBE - 543;
    for (let month = 0; month < 12; month++) {
      [1, 16].forEach(day => {
        let actualDay = day;
        if (month === 0 && day === 16) actualDay = 17;
        if (month === 4 && day === 1) actualDay = 2;
        const date = new Date(adYear, month, actualDay);
        const dayOfWeek = date.getDay();
        dates.push({ 
          label: `${actualDay} ${THAI_MONTHS[month]} ${currentYearBE} (${THAI_DAYS_LONG[dayOfWeek]})`, 
          dayOfWeek: dayOfWeek, 
          id: `${adYear}-${month + 1}-${actualDay}` 
        });
      });
    }
    return dates;
  }, [currentYearBE]);

  useEffect(() => {
    setSelectedDraw("");
    setCurrentDayIdx(null);
  }, [currentYearBE]);

  const toggleNumber = useCallback((num: number) => {
    setSelectedNumbers(prev => prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num].sort((a, b) => a - b));
  }, []);

  const handleDrawChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedDraw(val);
    const draw = lotteryDates.find(d => d.id === val);
    if (draw) {
      setCurrentDayIdx(draw.dayOfWeek);
      const luckyData = DAY_NUMBERS.find(d => d.dayIdx === draw.dayOfWeek);
      if (luckyData) setSelectedNumbers([...luckyData.numbers].sort((a, b) => a - b));
    }
  };

  const fetchStatistics = async () => {
    if (!selectedDraw) return;
    setIsStatsLoading(true);
    setShowStats(true);
    try {
      const draw = lotteryDates.find(d => d.id === selectedDraw);
      const drawInfo = draw ? draw.label : "งวดทั่วไป";
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `จงทำหน้าที่เป็นผู้เชี่ยวชาญด้านสถิติตัวเลขสลากกินแบ่งรัฐบาลไทย วิเคราะห์สถิติตัวเลข 0-9 ที่ออกบ่อยที่สุดในรอบ 20 ปี ย้อนหลังสำหรับงวดวันที่ ${drawInfo} (หรือลักษณะงวดกลางเดือน/ต้นเดือนที่ใกล้เคียง) 
        ระบุค่าความถี่ (Frequency) ของตัวเลข 0-9 ใน 3 หมวด: 2 ตัวบน, 2 ตัวล่าง, และ 3 ตัวบน 
        ส่งผลลัพธ์กลับมาเป็น JSON ตามโครงสร้าง: { top2: [{digit, frequency}], bottom2: [{digit, frequency}], top3: [{digit, frequency}] }`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              top2: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { digit: { type: Type.INTEGER }, frequency: { type: Type.INTEGER } } } },
              bottom2: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { digit: { type: Type.INTEGER }, frequency: { type: Type.INTEGER } } } },
              top3: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { digit: { type: Type.INTEGER }, frequency: { type: Type.INTEGER } } } }
            }
          }
        }
      });
      
      const data = JSON.parse(response.text);
      setStatsData(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsStatsLoading(false);
    }
  };

  const applyTop7FromStats = () => {
    if (!statsData) return;
    // รวมคะแนนความถี่จากทั้ง 3 หมวดเพื่อหา 7 เลขที่แข็งแกร่งที่สุดโดยรวม
    const masterFreq: Record<number, number> = {};
    [...statsData.top2, ...statsData.bottom2, ...statsData.top3].forEach(item => {
      masterFreq[item.digit] = (masterFreq[item.digit] || 0) + item.frequency;
    });

    const top7 = Object.entries(masterFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 7)
      .map(([digit]) => parseInt(digit))
      .sort((a, b) => a - b);

    setSelectedNumbers(top7);
  };

  const isCrossingCut = useCallback((numStr: string) => {
    const groupA = [1, 4, 7, 0];
    const groupB = [2, 5, 8];
    const groupC = [3, 9, 6];
    
    const d1 = parseInt(numStr[0]);
    const d2 = parseInt(numStr[1]);
    const d3 = parseInt(numStr[2]);

    const inA = (n: number) => groupA.includes(n);
    const inB = (n: number) => groupB.includes(n);
    const inC = (n: number) => groupC.includes(n);

    // ตรรกะข้ามเศียร: ถ้าตัวกลางเป็นกลุ่ม B ห้ามมีฐาน A และ C อยู่คนละฝั่งหัวท้าย
    if (inB(d2)) {
      if (inA(d1) && inC(d3)) return true; // A-B-C (ตัด)
      if (inC(d1) && inA(d3)) return true; // C-B-A (ตัด)
    }
    // กรณี A-B-A หรือ C-B-C (อนุญาต ไม่ตัด)
    return false;
  }, []);

  const win2Digits = useMemo(() => {
    if (selectedNumbers.length < 2) return [];
    let results: string[] = [];
    if (win2Mode === 'straight') {
      for (let i = 0; i < selectedNumbers.length; i++) {
        for (let j = i + 1; j < selectedNumbers.length; j++) {
          results.push(`${selectedNumbers[i]}${selectedNumbers[j]}`);
        }
      }
    } else {
      for (let i = 0; i < selectedNumbers.length; i++) {
        for (let j = 0; j < selectedNumbers.length; j++) {
          if (i === j) continue;
          results.push(`${selectedNumbers[i]}${selectedNumbers[j]}`);
        }
      }
    }
    return isFiltering ? results.filter(isDayCombination) : results;
  }, [selectedNumbers, isFiltering, win2Mode]);

  const win3Sets = useMemo(() => {
    if (selectedNumbers.length < 3) return [];
    let results: string[] = [];
    for (let i = 0; i < selectedNumbers.length; i++) {
      for (let j = i + 1; j < selectedNumbers.length; j++) {
        for (let k = j + 1; k < selectedNumbers.length; k++) {
          results.push(`${selectedNumbers[i]}${selectedNumbers[j]}${selectedNumbers[k]}`);
        }
      }
    }
    return isFiltering ? results.filter(isDayCombination) : results;
  }, [selectedNumbers, isFiltering]);

  const win3Permutations = useMemo(() => {
    if (selectedNumbers.length < 3) return [];
    let results: string[] = [];
    for (let i = 0; i < selectedNumbers.length; i++) {
      for (let j = 0; j < selectedNumbers.length; j++) {
        if (i === j) continue;
        for (let k = 0; k < selectedNumbers.length; k++) {
          if (k === i || k === j) continue;
          results.push(`${selectedNumbers[i]}${selectedNumbers[j]}${selectedNumbers[k]}`);
        }
      }
    }
    return isFiltering ? results.filter(isDayCombination) : results;
  }, [selectedNumbers, isFiltering]);

  const isDayCombination = useCallback((digits: string) => {
    if (currentDayIdx === null) return true;
    const dayNums = DAY_NUMBERS.find(d => d.dayIdx === currentDayIdx)?.numbers || [];
    return digits.split('').every(d => dayNums.includes(parseInt(d)));
  }, [currentDayIdx]);

  const win3CrossingCut = useMemo(() => {
    return win3Permutations.filter(num => !isCrossingCut(num));
  }, [win3Permutations, isCrossingCut]);

  const win3DisplayData = useMemo(() => {
    if (win3Mode === 'sets') return win3Sets;
    if (win3Mode === 'crossing') return win3CrossingCut;
    return win3Permutations;
  }, [win3Mode, win3Sets, win3Permutations, win3CrossingCut]);

  const totalCost = useMemo(() => {
    const amount = parseFloat(betAmount) || 0;
    let sum = 0;
    if (selectedBets.includes('top2')) sum += win2Digits.length * amount;
    if (selectedBets.includes('bottom2')) sum += win2Digits.length * amount;
    if (selectedBets.includes('sets3')) sum += win3Sets.length * amount;
    if (selectedBets.includes('back6')) sum += win3Permutations.length * amount;
    if (selectedBets.includes('crossing3')) sum += win3CrossingCut.length * amount;
    return sum;
  }, [selectedBets, win2Digits.length, win3Sets.length, win3Permutations.length, win3CrossingCut.length, betAmount]);

  const copyResults = (data: string[], type: string) => {
    navigator.clipboard.writeText(data.join(', '));
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen pb-12 bg-slate-50 transition-colors duration-500 font-sans">
      <header className={`${activeTheme.bg} text-white py-6 px-4 shadow-lg sticky top-0 z-50 transition-colors duration-500`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Zap className={`w-8 h-8 ${currentDayIdx === 1 ? 'text-indigo-600' : 'text-yellow-300'} fill-current`} />
            <h1 className={`text-2xl font-bold tracking-tight ${currentDayIdx === 1 ? 'text-slate-800' : 'text-white'}`}>วินเลขนำโชค</h1>
          </div>
          {lotteryDates.find(d => d.id === selectedDraw) && (
            <div className="text-right">
              <span className={`text-lg sm:text-2xl font-bold transition-colors duration-500 ${currentDayIdx === 1 ? 'text-slate-700' : 'text-white'}`}>
                งวดประจำวันที่ {lotteryDates.find(d => d.id === selectedDraw)?.label}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8 space-y-6">
        {/* Draw Selector & Stats Action */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
           <section className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
              <div className="space-y-3">
                <label className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Calendar className={`w-5 h-5 ${activeTheme.text}`} /> กำหนดปี พ.ศ.
                </label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setCurrentYearBE(prev => prev - 1)} className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                  </button>
                  <input 
                    type="number" 
                    value={currentYearBE}
                    onChange={(e) => setCurrentYearBE(parseInt(e.target.value) || new Date().getFullYear() + 543)}
                    className="flex-1 text-center font-bold text-2xl py-2 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition-all"
                  />
                  <button onClick={() => setCurrentYearBE(prev => prev + 1)} className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">เลือกงวดเพื่อดูสถิติย้อนหลัง</label>
                <select value={selectedDraw} onChange={handleDrawChange} className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-4 px-4 rounded-xl appearance-none font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                  <option value="" disabled>--- กรุณาเลือกงวด ---</option>
                  {lotteryDates.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                </select>
                <button 
                  disabled={!selectedDraw || isStatsLoading}
                  onClick={fetchStatistics}
                  className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${!selectedDraw ? 'bg-slate-100 text-slate-300' : 'bg-slate-900 text-amber-400 hover:bg-slate-800 border-2 border-amber-500/20'}`}
                >
                  {isStatsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <BarChart3 className="w-5 h-5" />}
                  วิเคราะห์สถิติย้อนหลัง 20 ปี
                </button>
              </div>
           </section>

           <section className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
             <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
               <Zap className={`w-5 h-5 ${activeTheme.text}`} /> ทางลัดเลขกำลังวัน (ตามงวด)
             </h2>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
               {DAY_NUMBERS.map(day => (
                 <button key={day.label} onClick={() => { setCurrentDayIdx(day.dayIdx); setSelectedNumbers([...day.numbers].sort((a,b)=>a-b)); }} className={`${DAY_THEMES[day.dayIdx].bg} ${day.dayIdx === 1 ? 'text-slate-800' : 'text-white'} px-4 py-3 rounded-xl text-sm font-bold shadow-sm hover:brightness-95 active:scale-95 transition-all flex flex-col items-center gap-1`}>
                   <span className="opacity-80 text-[10px] uppercase tracking-tighter">วัน{day.label}</span>
                   <span>{day.numbers.join('-')}</span>
                 </button>
               ))}
             </div>
           </section>
        </div>

        {/* Stats Result View */}
        {showStats && (
          <section className="bg-slate-900 rounded-3xl p-8 shadow-2xl border border-amber-500/40 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <TrendingUp className="w-48 h-48 text-amber-400" />
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 relative z-10">
              <div>
                <h2 className="text-3xl font-black text-amber-400 flex items-center gap-3">
                  <Award className="w-8 h-8" /> สถิติเลขมงคล 20 ปี
                </h2>
                <p className="text-slate-400 text-sm mt-1">อ้างอิงงวด {lotteryDates.find(d => d.id === selectedDraw)?.label}</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={applyTop7FromStats}
                  className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 px-8 py-4 rounded-2xl font-black transition-all shadow-xl active:scale-95 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-6 h-6" /> ใช้วินเลข Top 7
                </button>
                <button onClick={() => setShowStats(false)} className="text-slate-400 hover:text-white px-4 py-3 font-bold transition-all">ปิดหน้าต่างสถิติ</button>
              </div>
            </div>

            {isStatsLoading ? (
              <div className="py-24 flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <Loader2 className="w-16 h-16 text-amber-400 animate-spin" />
                  <BarChart3 className="w-6 h-6 text-amber-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-amber-400 font-bold animate-pulse tracking-[0.2em] uppercase text-sm">กำลังคำนวณสถิติประวัติศาสตร์...</p>
              </div>
            ) : statsData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {(['top2', 'bottom2', 'top3'] as const).map((key) => (
                  <div key={key} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <h3 className="text-white font-bold mb-6 flex items-center justify-between border-b border-white/10 pb-3">
                      <span className="text-amber-400">{key === 'top2' ? '2 ตัวบน' : key === 'bottom2' ? '2 ตัวล่าง' : '3 ตัวบน'}</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest">ความถี่ที่พบ</span>
                    </h3>
                    <div className="space-y-4">
                      {statsData[key].slice(0, 10).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl transition-all ${idx < 7 ? 'bg-amber-400 text-slate-900 shadow-lg shadow-amber-400/20' : 'bg-slate-800 text-slate-500'}`}>
                            {item.digit}
                          </div>
                          <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-1000 ${idx < 7 ? 'bg-gradient-to-r from-amber-400 to-amber-300' : 'bg-slate-600 opacity-20'}`} 
                              style={{ width: `${(item.frequency / Math.max(...statsData[key].map(i => i.frequency))) * 100}%` }}
                            ></div>
                          </div>
                          <span className={`text-sm font-mono font-black ${idx < 7 ? 'text-amber-400' : 'text-slate-600'}`}>{item.frequency}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Number Selector */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Hash className={`w-5 h-5 ${activeTheme.text}`} /> เลือกเลขวิน (0-9)
            </h2>
            <div className="flex gap-2 items-center">
              <span className="text-sm font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full mr-2">
                เลือกแล้ว {selectedNumbers.length} ตัว
              </span>
              <button onClick={() => setSelectedNumbers([0,1,2,3,4,5,6,7,8,9])} className={`text-xs font-bold ${activeTheme.text} px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors`}>เลือกทั้งหมด</button>
              <button onClick={() => { setSelectedNumbers([]); setCurrentDayIdx(null); setSelectedDraw(""); }} className="text-xs font-bold text-rose-500 px-3 py-2 rounded-lg hover:bg-rose-100 transition-colors flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> ล้างเลข
              </button>
            </div>
          </div>
          <NumberSelector selectedNumbers={selectedNumbers} onToggle={toggleNumber} themeColor={activeTheme.bg} />
        </section>

        {/* Calculation Summary */}
        <section className={`bg-white rounded-3xl p-8 shadow-md border-2 transition-all duration-500 ${activeTheme.border}`}>
          <div className="flex flex-col gap-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-3 text-3xl font-black text-slate-800">
                <Calculator className={`w-8 h-8 ${activeTheme.text}`} /> ตั้งราคาแทง
              </div>
              <div className="relative w-full md:w-96">
                <Coins className={`absolute left-5 top-1/2 -translate-y-1/2 w-8 h-8 ${activeTheme.text}`} />
                <input 
                  type="number" 
                  value={betAmount} 
                  onChange={(e) => setBetAmount(e.target.value)} 
                  className={`w-full pl-16 pr-20 py-6 bg-slate-50 border-2 rounded-3xl font-black text-4xl text-slate-700 focus:outline-none transition-all ${activeTheme.border} text-right`} 
                  placeholder="0" 
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xl">บาท</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { id: 'top2' as BetType, label: '2 ตัวบน', count: win2Digits.length },
                { id: 'bottom2' as BetType, label: '2 ตัวล่าง', count: win2Digits.length },
                { id: 'sets3' as BetType, label: '3 ตัวชุด (ไม่หาม)', count: win3Sets.length },
                { id: 'back6' as BetType, label: '3 ตัว (6 กลับ)', count: win3Permutations.length },
                { id: 'crossing3' as BetType, label: '3 ตัวข้ามเศียร', count: win3CrossingCut.length },
              ].map((bet) => (
                <button 
                  key={bet.id} 
                  onClick={() => setSelectedBets(prev => prev.includes(bet.id) ? prev.filter(t => t !== bet.id) : [...prev, bet.id])} 
                  className={`group relative flex flex-col rounded-3xl border-2 transition-all text-left overflow-hidden ${selectedBets.includes(bet.id) ? `border-transparent shadow-xl scale-[1.03] ${activeTheme.bg}` : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}
                >
                  <div className={`px-5 py-3 text-[10px] font-black uppercase tracking-widest flex justify-between items-center ${selectedBets.includes(bet.id) ? 'bg-black/10 text-white' : 'bg-slate-50 text-slate-400'}`}>
                    {bet.label}
                    {selectedBets.includes(bet.id) && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <div className="p-7">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-4xl font-black ${selectedBets.includes(bet.id) ? 'text-white' : 'text-slate-800'}`}>{(bet.count * (parseFloat(betAmount) || 0)).toLocaleString()}</span>
                      <span className={`text-base font-bold ${selectedBets.includes(bet.id) ? 'text-white/80' : 'text-slate-400'}`}>บาท</span>
                    </div>
                    <div className={`mt-2 text-sm font-bold ${selectedBets.includes(bet.id) ? 'text-white/70' : 'text-slate-400'}`}>{bet.count} ชุด</div>
                  </div>
                </button>
              ))}

              <div className={`relative flex flex-col rounded-3xl border-4 transition-all duration-500 overflow-hidden ${activeTheme.border} bg-slate-900 shadow-2xl scale-[1.05] z-10`}>
                <div className={`${activeTheme.bg} px-5 py-4 text-sm font-black uppercase text-white tracking-widest text-center`}>ยอดรวมสุทธิทั้งสิ้น</div>
                <div className="p-10 flex flex-col items-center justify-center bg-slate-900">
                  <div className="flex items-baseline gap-4">
                    <span className={`text-6xl font-black text-white tabular-nums`}>{totalCost.toLocaleString()}</span>
                    <span className={`text-2xl font-black text-white opacity-60`}>บาท</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Results Sections */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 pt-10 gap-4">
           <div className="flex items-center gap-2">
             <Filter className={`w-7 h-7 ${activeTheme.text}`} />
             <span className="text-2xl font-black text-slate-800">รายการเลขที่วินได้</span>
           </div>
           <div className="flex flex-wrap gap-2">
              <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
                <button onClick={() => setWin2Mode('straight')} className={`px-6 py-3 rounded-xl text-xs font-black transition-all ${win2Mode === 'straight' ? activeTheme.bg + ' text-white' : 'text-slate-400 hover:text-slate-600'}`}>ชุดตรง</button>
                <button onClick={() => setWin2Mode('reverse')} className={`px-6 py-3 rounded-xl text-xs font-black transition-all ${win2Mode === 'reverse' ? activeTheme.bg + ' text-white' : 'text-slate-400 hover:text-slate-600'}`}>กลับเลข</button>
              </div>
              {currentDayIdx !== null && (
                <button onClick={() => setIsFiltering(!isFiltering)} className={`flex items-center gap-2 px-6 py-3 rounded-2xl border-2 transition-all ${isFiltering ? activeTheme.bg + ' text-white border-transparent shadow-lg' : 'bg-white text-slate-500 border-slate-200'}`}>
                  {isFiltering ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  <span className="text-xs font-black">กรองเฉพาะเลขเด่นงวดนี้</span>
                </button>
              )}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <ResultCard title="วินเลข 2 ตัวบน" subtitle="ตัดเลขเบิ้ล/ตองอัตโนมัติ" data={win2Digits} onCopy={() => copyResults(win2Digits, 'top2')} isCopied={copied === 'top2'} theme={activeTheme} />
          <ResultCard title="วินเลข 2 ตัวล่าง" subtitle="ตัดเลขเบิ้ล/ตองอัตโนมัติ" data={win2Digits} onCopy={() => copyResults(win2Digits, 'bottom2')} isCopied={copied === 'bottom2'} theme={activeTheme} />
          <div className="space-y-6">
             <div className="flex bg-white p-2 rounded-3xl shadow-sm border border-slate-100 overflow-x-auto">
                <button onClick={() => setWin3Mode('sets')} className={`flex-1 min-w-[100px] py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${win3Mode === 'sets' ? activeTheme.bg + ' text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>3 ตัวตรง</button>
                <button onClick={() => setWin3Mode('6back')} className={`flex-1 min-w-[100px] py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${win3Mode === '6back' ? activeTheme.bg + ' text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>3 ตัว 6 กลับ</button>
                <button onClick={() => setWin3Mode('crossing')} className={`flex-1 min-w-[100px] py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${win3Mode === 'crossing' ? activeTheme.bg + ' text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>ตัดข้ามเศียร</button>
             </div>
             <ResultCard 
                title={win3Mode === 'sets' ? "วินเลข 3 ตัวตรง" : win3Mode === 'crossing' ? "วินเลข 3 ตัว (ตัดข้ามเศียร)" : "วินเลข 3 ตัว (6 กลับ)"} 
                subtitle={win3Mode === 'crossing' ? "ตัดตามกฎ A-B-C / C-B-A (ตามรูป)" : "ตัดเลขเบิ้ล/หาม/ตองอัตโนมัติ"} 
                data={win3DisplayData} 
                onCopy={() => copyResults(win3DisplayData, '3digit')} 
                isCopied={copied === '3digit'} 
                theme={activeTheme} 
                isFullHeight={true} 
              />
          </div>
        </div>
      </main>
      <footer className="max-w-6xl mx-auto px-4 mt-20 mb-10 text-center">
        <p className="text-slate-400 text-[10px] uppercase tracking-[0.3em] font-black">© ระบบวินเลขนำโชค - สถิติอัจฉริยะ 20 ปี และระบบตัดข้ามเศียรความละเอียดสูง</p>
      </footer>
    </div>
  );
};

export default App;
