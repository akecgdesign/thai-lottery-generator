
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  Hash, 
  Zap,
  Calendar,
  Filter,
  Coins,
  Calculator,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Sparkles,
  ArrowRightLeft,
  Shuffle,
  Award,
  Trash2
} from 'lucide-react';
import NumberSelector from './components/NumberSelector';
import ResultCard from './components/ResultCard';

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

type BetType = 'top2' | 'bottom2' | 'sets3' | 'back6' | 'crossingCut3' | 'crossingOnly3';
type SelectionMode = 'single' | 'cross';

interface StatResult {
  digit: number;
  frequency: number;
}

const App: React.FC = () => {
  const [currentYearBE, setCurrentYearBE] = useState<number>(new Date().getFullYear() + 543);
  const [selectedDraw, setSelectedDraw] = useState<string>("");
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('single');
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [option1Numbers, setOption1Numbers] = useState<number[]>([]);
  const [option2Numbers, setOption2Numbers] = useState<number[]>([]);
  
  const [copied, setCopied] = useState<string | null>(null);
  const [currentDayIdx, setCurrentDayIdx] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState<string>("1");
  const [win3Mode, setWin3Mode] = useState<'sets' | '6back' | 'crossing' | 'onlyCrossing'>('6back');
  const [win2Mode, setWin2Mode] = useState<'reverse' | 'straight'>('reverse');
  const [selectedBets, setSelectedBets] = useState<BetType[]>(['top2', 'bottom2', 'back6']);
  
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
        dates.push({ label: `${actualDay} ${THAI_MONTHS[month]} ${currentYearBE} (${THAI_DAYS_LONG[dayOfWeek]})`, dayOfWeek: dayOfWeek, id: `${adYear}-${month + 1}-${actualDay}` });
      });
    }
    return dates;
  }, [currentYearBE]);

  const calculateLocalStats = (seed: string) => {
    const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const generateResults = (offset: number) => {
      return Array.from({ length: 10 }, (_, i) => ({ digit: i, frequency: Math.floor(50 + Math.sin((hash + i + offset) * 0.5) * 40 + Math.cos((i * offset)) * 10) })).sort((a, b) => b.frequency - a.frequency);
    };
    return { top2: generateResults(1), bottom2: generateResults(2), top3: generateResults(3) };
  };

  const handleFetchStats = () => {
    if (!selectedDraw) return;
    setIsStatsLoading(true);
    setShowStats(true);
    setTimeout(() => {
      setStatsData(calculateLocalStats(selectedDraw));
      setIsStatsLoading(false);
    }, 1000);
  };

  const applyTop7FromStats = () => {
    if (!statsData) return;
    const masterFreq: Record<number, number> = {};
    [...statsData.top2, ...statsData.bottom2, ...statsData.top3].forEach(item => { masterFreq[item.digit] = (masterFreq[item.digit] || 0) + item.frequency; });
    const top7 = Object.entries(masterFreq).sort(([, a], [, b]) => b - a).slice(0, 7).map(([digit]) => parseInt(digit)).sort((a, b) => a - b);
    if (selectionMode === 'single') setSelectedNumbers(top7);
    else setOption1Numbers(top7);
  };

  const toggleNumber = useCallback((num: number, pool: 'single' | 'opt1' | 'opt2') => {
    const setter = pool === 'single' ? setSelectedNumbers : pool === 'opt1' ? setOption1Numbers : setOption2Numbers;
    setter(prev => prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num].sort((a, b) => a - b));
  }, []);

  const handleDrawChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedDraw(val);
    const draw = lotteryDates.find(d => d.id === val);
    if (draw) {
      setCurrentDayIdx(draw.dayOfWeek);
      const luckyData = DAY_NUMBERS.find(d => d.dayIdx === draw.dayOfWeek);
      if (luckyData) {
        if (selectionMode === 'single') setSelectedNumbers([...luckyData.numbers].sort((a, b) => a - b));
        else setOption1Numbers([...luckyData.numbers].sort((a, b) => a - b));
      }
    }
  };

  const isCrossingCut = useCallback((numStr: string) => {
    const groupA = [1, 4, 7, 0], groupB = [2, 5, 8], groupC = [3, 9, 6];
    const d1 = parseInt(numStr[0]), d2 = parseInt(numStr[1]), d3 = parseInt(numStr[2]);
    const inA = (n: number) => groupA.includes(n), inB = (n: number) => groupB.includes(n), inC = (n: number) => groupC.includes(n);
    return (inB(d2) && ((inA(d1) && inC(d3)) || (inC(d1) && inA(d3))));
  }, []);

  const win2Digits = useMemo(() => {
    const generatePairs = (nums: number[]) => {
      const pairs: string[] = [];
      if (nums.length < 2) return pairs;
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
          pairs.push(`${nums[i]}${nums[j]}`);
          if (win2Mode === 'reverse') pairs.push(`${nums[j]}${nums[i]}`);
        }
      }
      return pairs;
    };
    if (selectionMode === 'single') return Array.from(new Set(generatePairs(selectedNumbers))).sort();
    const pairs1 = generatePairs(option1Numbers);
    const pairs2 = generatePairs(option2Numbers);
    return Array.from(new Set([...pairs1, ...pairs2])).sort();
  }, [selectedNumbers, option1Numbers, option2Numbers, selectionMode, win2Mode]);

  const win3Sets = useMemo(() => {
    const generateSets = (nums: number[]) => {
      const sets: string[] = [];
      if (nums.length < 3) return sets;
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
          for (let k = j + 1; k < nums.length; k++) {
            sets.push([nums[i], nums[j], nums[k]].sort((a, b) => a - b).join(''));
          }
        }
      }
      return sets;
    };
    if (selectionMode === 'single') return Array.from(new Set(generateSets(selectedNumbers))).sort();
    const sets1 = generateSets(option1Numbers);
    const sets2 = generateSets(option2Numbers);
    return Array.from(new Set([...sets1, ...sets2])).sort();
  }, [selectedNumbers, option1Numbers, option2Numbers, selectionMode]);

  const win3Permutations = useMemo(() => {
    let results: string[] = [];
    for (const combo of win3Sets) {
      const d = combo.split('');
      const perms = [`${d[0]}${d[1]}${d[2]}`, `${d[0]}${d[2]}${d[1]}`, `${d[1]}${d[0]}${d[2]}`, `${d[1]}${d[2]}${d[0]}`, `${d[2]}${d[0]}${d[1]}`, `${d[2]}${d[1]}${d[0]}`];
      perms.forEach(p => results.push(p));
    }
    return Array.from(new Set(results)).sort();
  }, [win3Sets]);

  const win3CrossingCutData = useMemo(() => win3Permutations.filter(num => !isCrossingCut(num)), [win3Permutations, isCrossingCut]);
  const win3CrossingOnlyData = useMemo(() => win3Permutations.filter(num => isCrossingCut(num)), [win3Permutations, isCrossingCut]);

  const win3DisplayData = useMemo(() => {
    if (win3Mode === 'sets') return win3Sets;
    if (win3Mode === 'crossing') return win3CrossingCutData;
    if (win3Mode === 'onlyCrossing') return win3CrossingOnlyData;
    return win3Permutations;
  }, [win3Mode, win3Sets, win3Permutations, win3CrossingCutData, win3CrossingOnlyData]);

  const totalCost = useMemo(() => {
    const amount = parseFloat(betAmount) || 0;
    let sum = 0;
    if (selectedBets.includes('top2')) sum += win2Digits.length * amount;
    if (selectedBets.includes('bottom2')) sum += win2Digits.length * amount;
    if (selectedBets.includes('sets3')) sum += win3Sets.length * amount;
    if (selectedBets.includes('back6')) sum += win3Permutations.length * amount;
    if (selectedBets.includes('crossingCut3')) sum += win3CrossingCutData.length * amount;
    if (selectedBets.includes('crossingOnly3')) sum += win3CrossingOnlyData.length * amount;
    return sum;
  }, [selectedBets, win2Digits.length, win3Sets.length, win3Permutations.length, win3CrossingCutData.length, win3CrossingOnlyData.length, betAmount]);

  const copyResults = (data: string[], type: string) => {
    navigator.clipboard.writeText(data.join(', '));
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen pb-12 bg-slate-50 font-sans">
      <header className={`${activeTheme.bg} text-white py-6 px-4 shadow-lg sticky top-0 z-50 transition-colors duration-500`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className={`w-8 h-8 ${currentDayIdx === 1 ? 'text-indigo-600' : 'text-yellow-300'} fill-current`} />
            <h1 className="text-2xl font-bold">วินเลขนำโชค Pro</h1>
          </div>
          {lotteryDates.find(d => d.id === selectedDraw) && (
            <div className="text-right">
              <span className="text-lg sm:text-2xl font-bold">งวดวันที่ {lotteryDates.find(d => d.id === selectedDraw)?.label}</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8 space-y-8">
        {/* เลือกโหมดการวิน */}
        <section className="bg-white rounded-2xl p-2 shadow-sm border flex items-center gap-2">
          <button onClick={() => setSelectionMode('single')} className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-black text-xl transition-all ${selectionMode === 'single' ? activeTheme.bg + ' text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}><Shuffle className="w-6 h-6" /> วินกลุ่มเดียว</button>
          <button onClick={() => setSelectionMode('cross')} className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-black text-xl transition-all ${selectionMode === 'cross' ? activeTheme.bg + ' text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}><ArrowRightLeft className="w-6 h-6" /> วินแยกกลุ่ม (Opt 1 + 2)</button>
        </section>

        {/* งวดและสถิติ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
           <section className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border space-y-5">
              <div className="space-y-3">
                <label className="text-lg font-semibold flex items-center gap-2 text-slate-800"><Calendar className={`w-5 h-5 ${activeTheme.text}`} /> ปี พ.ศ.</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setCurrentYearBE(prev => prev - 1)} className="p-3 rounded-xl bg-slate-50 border hover:bg-slate-100 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                  <input type="number" value={currentYearBE} onChange={(e) => setCurrentYearBE(parseInt(e.target.value) || 2568)} className="flex-1 text-center font-bold text-2xl py-2 bg-slate-50 rounded-xl outline-none" />
                  <button onClick={() => setCurrentYearBE(prev => prev + 1)} className="p-3 rounded-xl bg-slate-50 border hover:bg-slate-100 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="space-y-3">
                <select value={selectedDraw} onChange={handleDrawChange} className="w-full bg-slate-50 border py-4 px-4 rounded-xl font-medium text-lg focus:ring-2 focus:ring-indigo-500 outline-none mb-3">
                  <option value="" disabled>--- กรุณาเลือกงวด ---</option>
                  {lotteryDates.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                </select>
                <button disabled={!selectedDraw || isStatsLoading} onClick={handleFetchStats} className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all ${!selectedDraw ? 'bg-slate-100 text-slate-300' : 'bg-slate-900 text-amber-400 border-2 border-amber-500/20 hover:bg-slate-800'}`}>
                  {isStatsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />} วิเคราะห์สถิติจำลอง 20 ปี
                </button>
              </div>
           </section>
           <section className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border">
             <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800"><Zap className={`w-5 h-5 ${activeTheme.text}`} /> ทางลัดเลขกำลังวัน (ลง Opt 1)</h2>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
               {DAY_NUMBERS.map(day => (
                 <button key={day.label} onClick={() => { setCurrentDayIdx(day.dayIdx); handleDrawChange({ target: { value: selectedDraw || '' } } as any); }} className={`${DAY_THEMES[day.dayIdx].bg} ${day.dayIdx === 1 ? 'text-slate-800' : 'text-white'} px-4 py-3 rounded-xl text-sm font-bold shadow-sm hover:brightness-95 transition-all`}>
                   <span className="opacity-80 text-[10px] block">วัน{day.label}</span> {day.numbers.join('-')}
                 </button>
               ))}
             </div>
           </section>
        </div>

        {/* ส่วนแสดงสถิติ */}
        {showStats && (
          <section className="bg-slate-900 rounded-3xl p-8 shadow-2xl border border-amber-500/40 relative overflow-hidden transition-all duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 relative z-10">
              <h2 className="text-3xl font-black text-amber-400 flex items-center gap-3"><Award className="w-8 h-8" /> สถิติวิเคราะห์อัจฉริยะ</h2>
              <div className="flex gap-3">
                <button onClick={applyTop7FromStats} className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 px-8 py-4 rounded-2xl font-black shadow-xl active:scale-95 flex items-center gap-2"><CheckCircle2 className="w-6 h-6" /> ใช้วินเลข Top 7 (ลง Opt 1)</button>
                <button onClick={() => setShowStats(false)} className="text-slate-400 hover:text-white px-4 py-3 font-bold">ปิดส่วนสถิติ</button>
              </div>
            </div>
            {isStatsLoading ? (
              <div className="py-24 flex flex-col items-center"><Loader2 className="w-16 h-16 text-amber-400 animate-spin" /><p className="text-amber-400 mt-4 font-bold animate-pulse">กำลังประมวลผลข้อมูลจำลอง...</p></div>
            ) : statsData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {(['top2', 'bottom2', 'top3'] as const).map((key) => (
                  <div key={key} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <h3 className="text-white font-bold mb-6 flex justify-between border-b border-white/10 pb-3">
                      <span className="text-amber-400 uppercase tracking-tighter">{key === 'top2' ? '2 ตัวบน' : key === 'bottom2' ? '2 ตัวล่าง' : '3 ตัวบน'}</span>
                    </h3>
                    <div className="space-y-4">
                      {statsData[key].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl ${idx < 7 ? 'bg-amber-400 text-slate-900' : 'bg-slate-800 text-slate-500'}`}>{item.digit}</div>
                          <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${idx < 7 ? 'bg-amber-400' : 'bg-slate-600 opacity-20'}`} style={{ width: `${(item.frequency / Math.max(...statsData[key].map(i => i.frequency))) * 100}%` }}></div>
                          </div>
                          <span className="text-[10px] text-slate-500 font-bold">{item.frequency}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* แผงเลือกตัวเลข */}
        <section className="bg-white rounded-3xl p-8 shadow-sm border space-y-6">
          {selectionMode === 'single' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between"><h2 className="text-xl font-bold flex items-center gap-2 text-slate-800"><Hash className={`w-6 h-6 ${activeTheme.text}`} /> เลือกเลขวิน (0-9)</h2><button onClick={() => setSelectedNumbers([])} className="text-sm font-bold text-rose-500 px-4 py-1 bg-rose-50 rounded-full border border-rose-100">ล้างเลข</button></div>
              <NumberSelector selectedNumbers={selectedNumbers} onToggle={(n) => toggleNumber(n, 'single')} themeColor={activeTheme.bg} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border">
                <div className="flex items-center justify-between"><h3 className={`font-black uppercase tracking-widest text-sm ${activeTheme.text}`}>เลข Option 1</h3><button onClick={() => setOption1Numbers([])} className="text-xs font-bold text-rose-400 px-3 py-1 bg-white rounded-full border">ล้าง</button></div>
                <NumberSelector selectedNumbers={option1Numbers} onToggle={(n) => toggleNumber(n, 'opt1')} themeColor={activeTheme.bg} />
              </div>
              <div className="space-y-4 bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100">
                <div className="flex items-center justify-between"><h3 className="font-black uppercase tracking-widest text-sm text-indigo-600">เลข Option 2</h3><button onClick={() => setOption2Numbers([])} className="text-xs font-bold text-rose-400 px-3 py-1 bg-white rounded-full border">ล้าง</button></div>
                <NumberSelector selectedNumbers={option2Numbers} onToggle={(n) => toggleNumber(n, 'opt2')} themeColor="bg-indigo-600" />
              </div>
            </div>
          )}
        </section>

        {/* 1. รายการวินเลข 2 ตัว */}
        <div className="space-y-6">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-4">
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Filter className={`w-8 h-8 ${activeTheme.text}`} /> รายการวินเลข 2 ตัว</h2>
              <div className="flex gap-2 bg-slate-200 p-1.5 rounded-2xl shadow-inner border border-slate-300">
                <button onClick={() => setWin2Mode('straight')} className={`px-12 py-3 rounded-xl text-lg font-black transition-all ${win2Mode === 'straight' ? activeTheme.bg + ' text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'}`}>ชุดตรง</button>
                <button onClick={() => setWin2Mode('reverse')} className={`px-12 py-3 rounded-xl text-lg font-black transition-all ${win2Mode === 'reverse' ? activeTheme.bg + ' text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'}`}>กลับเลข</button>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResultCard title="วินเลข 2 ตัวบน" subtitle="ตัดซ้ำอัตโนมัติ" data={win2Digits} onCopy={() => copyResults(win2Digits, 'top2')} isCopied={copied === 'top2'} theme={activeTheme} />
              <ResultCard title="วินเลข 2 ตัวล่าง" subtitle="ตัดซ้ำอัตโนมัติ" data={win2Digits} onCopy={() => copyResults(win2Digits, 'bottom2')} isCopied={copied === 'bottom2'} theme={activeTheme} />
           </div>
        </div>

        {/* 2. รายการวินเลข 3 ตัว */}
        <div className="space-y-6">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-4">
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Filter className={`w-8 h-8 ${activeTheme.text}`} /> รายการวินเลข 3 ตัว</h2>
              <div className="flex bg-slate-200 p-1.5 rounded-2xl shadow-inner border border-slate-300 overflow-x-auto no-scrollbar gap-2">
                {[
                  { id: 'sets', label: '3 ตัวตรง' },
                  { id: '6back', label: '6 กลับ' },
                  { id: 'crossing', label: 'ตัดข้ามเศียร' },
                  { id: 'onlyCrossing', label: 'ข้ามเศียรล้วน' }
                ].map(m => (
                  <button key={m.id} onClick={() => setWin3Mode(m.id as any)} className={`flex-shrink-0 px-10 py-3 rounded-xl text-lg font-black transition-all ${win3Mode === m.id ? activeTheme.bg + ' text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'}`}>
                    {m.label}
                  </button>
                ))}
              </div>
           </div>
           
           <div className="w-full">
              <ResultCard 
                title={win3Mode === 'sets' ? "วินเลข 3 ตัวตรง" : win3Mode === 'crossing' ? "วิน 3 ตัว (ตัดข้ามเศียร)" : win3Mode === 'onlyCrossing' ? "วิน 3 ตัว (ข้ามเศียรล้วน)" : "วินเลข 3 ตัว (6 กลับ)"} 
                subtitle="รวมผลลัพธ์แยกกลุ่มและตัดเลขซ้ำ" 
                data={win3DisplayData} 
                onCopy={() => copyResults(win3DisplayData, '3digit')} 
                isCopied={copied === '3digit'} 
                theme={activeTheme} 
                isFullHeight={true} 
              />
           </div>
        </div>

        {/* 3. สรุปยอดเงินและประเภทการแทง */}
        <section className={`bg-white rounded-3xl p-10 shadow-2xl border-2 ${activeTheme.border} transition-all duration-500 mt-10`}>
          <div className="flex flex-col gap-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-8">
              <div className="text-4xl font-black text-slate-800 flex items-center gap-4"><Calculator className={`w-14 h-14 ${activeTheme.text}`} /> ตั้งราคาแทง</div>
              <div className="relative w-full md:w-96">
                <Coins className={`absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 ${activeTheme.text}`} />
                <input type="number" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} className="w-full pl-24 pr-20 py-10 bg-slate-50 border-2 rounded-[2rem] font-black text-7xl text-right outline-none focus:border-indigo-400 transition-all shadow-inner" />
                <span className="absolute right-8 top-1/2 -translate-y-1/2 font-black text-slate-300 text-3xl">฿</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { id: 'top2' as BetType, label: '2 ตัวบน', count: win2Digits.length },
                { id: 'bottom2' as BetType, label: '2 ตัวล่าง', count: win2Digits.length },
                { id: 'sets3' as BetType, label: '3 ตัวตรง', count: win3Sets.length },
                { id: 'back6' as BetType, label: '3 ตัว (6 กลับ)', count: win3Permutations.length },
                { id: 'crossingCut3' as BetType, label: '3 ตัว (ตัดข้ามเศียร)', count: win3CrossingCutData.length },
                { id: 'crossingOnly3' as BetType, label: '3 ตัว (ข้ามเศียรล้วน)', count: win3CrossingOnlyData.length },
              ].map((bet) => {
                const isSelected = selectedBets.includes(bet.id);
                return (
                  <button 
                    key={bet.id} 
                    onClick={() => setSelectedBets(prev => isSelected ? prev.filter(t => t !== bet.id) : [...prev, bet.id])} 
                    className={`group relative flex flex-col rounded-[2.5rem] border-2 transition-all p-8 text-left ${isSelected ? activeTheme.bg + ' text-white scale-[1.05] border-transparent shadow-[0_20px_50px_rgba(0,0,0,0.2)]' : 'bg-slate-200 text-slate-900 border-slate-300 hover:border-slate-400 hover:bg-slate-300 hover:scale-[1.02]'}`}
                  >
                    <span className={`text-2xl font-black uppercase tracking-tight block mb-4 ${isSelected ? 'opacity-80' : 'text-slate-900'}`}>{bet.label}</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black">{(bet.count * (parseFloat(betAmount) || 0)).toLocaleString()}</span>
                      <span className="text-lg opacity-60 font-bold">บาท</span>
                    </div>
                    <div className="mt-4 text-lg font-bold opacity-70 bg-white/20 inline-block px-4 py-1 rounded-full">{bet.count} ชุด</div>
                  </button>
                );
              })}
              <div className="bg-slate-900 rounded-[2.5rem] border-4 p-10 flex flex-col items-center justify-center shadow-2xl border-indigo-500/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/10 to-transparent"></div>
                <span className="text-lg font-black text-indigo-400 uppercase tracking-widest mb-4 relative z-10">ยอดรวมสุทธิ</span>
                <div className="flex items-baseline gap-4 relative z-10">
                  <span className="text-7xl font-black text-white">{totalCost.toLocaleString()}</span>
                  <span className="text-2xl font-bold text-white opacity-40">บาท</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="max-w-6xl mx-auto px-4 mt-12 text-center text-slate-400 text-sm font-medium">
        © {new Date().getFullYear()} วินเลขนำโชค Pro - ระบบคำนวณและวินเลขประสิทธิภาพสูง
      </footer>
    </div>
  );
};

export default App;
