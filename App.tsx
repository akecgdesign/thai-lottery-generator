
import React, { useState, useMemo, useCallback } from 'react';
import { 
  Hash, Zap, Calendar, Filter, Calculator, ChevronLeft, ChevronRight, 
  ArrowRightLeft, Shuffle, X, TrendingUp, BarChart3, History, RotateCcw
} from 'lucide-react';
import NumberSelector from './components/NumberSelector';
import ResultCard, { HighlightStatus } from './components/ResultCard';

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

const WAXING_NUMBERS: Record<number, number[]> = {
  0: [1, 8, 7, 4, 5, 2], 1: [2, 9, 5, 8, 1, 6], 2: [5, 9, 3, 4, 7, 2, 6, 0], 3: [4, 5, 8, 7, 0, 1], 4: [5, 9, 2, 8, 0, 7, 4], 5: [6, 9, 2, 5, 0], 6: [7, 0, 8, 3, 6, 1, 4]
};

const WANING_NUMBERS: Record<number, number[]> = {
  0: [1, 8, 3, 5, 2, 6, 4], 1: [2, 9, 4, 6, 5, 7, 0], 2: [5, 0, 7, 4, 8, 1], 3: [4, 1, 0, 6, 9, 8, 7, 2, 5], 4: [5, 2, 7, 0, 1], 5: [8, 6, 4, 1, 3, 7], 6: [8, 7, 3, 4, 1, 6]
};

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const THAI_DAYS_LONG = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];

type BetType = 'top2' | 'bottom2' | 'sets3' | 'back6' | 'crossingCut3' | 'crossingOnly3';
type SelectionMode = 'single' | 'cross';

const getMoonPhaseInfo = (date: Date) => {
  const referenceDate = new Date(2024, 0, 11);
  const diffTime = date.getTime() - referenceDate.getTime();
  const diffDays = diffTime / (1000 * 3600 * 24);
  const lunarCycle = 29.530588853;
  const age = (diffDays % lunarCycle + lunarCycle) % lunarCycle;
  let type: 'ขึ้น' | 'แรม' = age < 14.765 ? 'ขึ้น' : 'แรม';
  let day = Math.floor(type === 'ขึ้น' ? age + 1 : age - 14.765 + 1);
  if (day > 15) day = 15;
  if (day < 1) day = 1;
  return { type, day, label: `${type} ${day} ค่ำ` };
};

const App: React.FC = () => {
  const [currentYearBE, setCurrentYearBE] = useState<number>(new Date().getFullYear() + 543);
  const [selectedDraw, setSelectedDraw] = useState<string>("");
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('cross');
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [option1Numbers, setOption1Numbers] = useState<number[]>([]);
  const [option2Numbers, setOption2Numbers] = useState<number[]>([]);
  const [option3Numbers, setOption3Numbers] = useState<number[]>([]);
  
  const [copied, setCopied] = useState<string | null>(null);
  const [currentDayIdx, setCurrentDayIdx] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState<string>("1");
  const [win3Mode, setWin3Mode] = useState<'sets' | '6back' | 'crossing' | 'onlyCrossing'>('6back');
  const [win2Mode, setWin2Mode] = useState<'reverse' | 'straight'>('reverse');
  const [selectedBets, setSelectedBets] = useState<BetType[]>(['top2', 'bottom2', 'back6']);
  const [showStats, setShowStats] = useState(false);

  const activeTheme = currentDayIdx !== null ? DAY_THEMES[currentDayIdx] : DAY_THEMES.default;

  const lotteryDates = useMemo(() => {
    const dates = [];
    const adYear = currentYearBE - 543;
    for (let month = 0; month < 12; month++) {
      [1, 16].forEach(day => {
        let actualDay = day;
        if (month === 0 && day === 1) actualDay = 2;
        if (month === 0 && day === 16) actualDay = 17;
        if (month === 4 && day === 1) actualDay = 2;
        const date = new Date(adYear, month, actualDay);
        const dayOfWeek = date.getDay();
        const moonInfo = getMoonPhaseInfo(date);
        dates.push({ 
          label: `${actualDay} ${THAI_MONTHS[month]} ${currentYearBE} (${THAI_DAYS_LONG[dayOfWeek]} ${moonInfo.label})`, 
          dayOfWeek, 
          moonType: moonInfo.type,
          id: `${adYear}-${month + 1}-${actualDay}` 
        });
      });
    }
    return dates;
  }, [currentYearBE]);

  const currentDrawInfo = useMemo(() => lotteryDates.find(d => d.id === selectedDraw), [selectedDraw, lotteryDates]);

  const calculateTop7 = useCallback((drawId: string, dayOfWeek: number) => {
    const seed = dayOfWeek + (parseInt(drawId.split('-')[2]) || 0);
    const pools = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    return pools.sort((a, b) => ((a * seed + 7) % 10) - ((b * seed + 7) % 10)).slice(0, 7).sort();
  }, []);

  const handleDrawChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedDraw(val);
    const draw = lotteryDates.find(d => d.id === val);
    if (draw) {
      setCurrentDayIdx(draw.dayOfWeek);
      const dayNums = [...DAY_NUMBERS.find(d => d.dayIdx === draw.dayOfWeek)?.numbers || []].sort((a, b) => a - b);
      const moonNums = [...(draw.moonType === 'ขึ้น' ? WAXING_NUMBERS[draw.dayOfWeek] : WANING_NUMBERS[draw.dayOfWeek]) || []].sort((a, b) => a - b);
      const top7 = calculateTop7(val, draw.dayOfWeek);
      setOption1Numbers(dayNums);
      setOption2Numbers(moonNums);
      setOption3Numbers(top7);
      setSelectedNumbers(dayNums); 
    }
  };

  const handleAnalyzeStats = () => {
    if (selectedDraw && currentDayIdx !== null) {
      const top7 = calculateTop7(selectedDraw, currentDayIdx);
      setSelectedNumbers(top7); 
      setShowStats(true);
    }
  };

  const toggleNumber = useCallback((num: number, pool: 'single' | 'opt1' | 'opt2' | 'opt3') => {
    const setterMap = { single: setSelectedNumbers, opt1: setOption1Numbers, opt2: setOption2Numbers, opt3: setOption3Numbers };
    const setter = setterMap[pool];
    setter(prev => prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num].sort((a, b) => a - b));
  }, []);

  const isCrossingCut = useCallback((numStr: string) => {
    const groupA = [1, 4, 7, 0], groupB = [2, 5, 8], groupC = [3, 9, 6];
    const d1 = parseInt(numStr[0]), d2 = parseInt(numStr[1]), d3 = parseInt(numStr[2]);
    const inA = (n: number) => groupA.includes(n), inB = (n: number) => groupB.includes(n), inC = (n: number) => groupC.includes(n);
    return (inB(d2) && ((inA(d1) && inC(d3)) || (inC(d1) && inA(d3))));
  }, []);

  const checkHighlightStatus = useCallback((numStr: string): HighlightStatus => {
    const digits = numStr.split('').map(Number);
    const countMatch = (pool: number[]) => pool.length > 0 && digits.every(d => pool.includes(d));
    
    const in1 = countMatch(option1Numbers);
    const in2 = countMatch(option2Numbers);
    const in3 = countMatch(option3Numbers);

    if (in1 && in2 && in3) return 'diamond'; 
    if (in1 && in2) return 'gold'; 
    if ((in1 && in3) || (in2 && in3)) return 'silver'; 
    if (in1) return 'opt1'; 
    return 'none';
  }, [option1Numbers, option2Numbers, option3Numbers]);

  const combinedActiveNumbers = useMemo(() => {
    if (selectionMode === 'single') return selectedNumbers;
    return Array.from(new Set([...option1Numbers, ...option2Numbers, ...option3Numbers])).sort((a, b) => a - b);
  }, [selectionMode, selectedNumbers, option1Numbers, option2Numbers, option3Numbers]);

  // วิน 2 ตัว: ตัดเลขหาม (เช่น 11) อัตโนมัติด้วยเงื่อนไข i < j
  const win2Digits = useMemo(() => {
    const nums = combinedActiveNumbers;
    const p: string[] = [];
    if (nums.length < 2) return p;
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        p.push(`${nums[i]}${nums[j]}`);
        if (win2Mode === 'reverse') p.push(`${nums[j]}${nums[i]}`);
      }
    }
    return Array.from(new Set(p)).sort();
  }, [combinedActiveNumbers, win2Mode]);

  // วิน 3 ตัว: ตัดเลขหาม/ตอง (เช่น 112, 111) อัตโนมัติด้วยเงื่อนไข i < j < k
  const win3Sets = useMemo(() => {
    const nums = combinedActiveNumbers;
    const s: string[] = [];
    if (nums.length < 3) return s;
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        for (let k = j + 1; k < nums.length; k++) {
          s.push([nums[i], nums[j], nums[k]].sort((a, b) => a - b).join(''));
        }
      }
    }
    return Array.from(new Set(s)).sort();
  }, [combinedActiveNumbers]);

  const win3Permutations = useMemo(() => {
    const res: string[] = [];
    win3Sets.forEach(combo => {
      const d = combo.split('');
      const p = [`${d[0]}${d[1]}${d[2]}`, `${d[0]}${d[2]}${d[1]}`, `${d[1]}${d[0]}${d[2]}`, `${d[1]}${d[2]}${d[0]}`, `${d[2]}${d[0]}${d[1]}`, `${d[2]}${d[1]}${d[0]}`];
      p.forEach(x => res.push(x));
    });
    return Array.from(new Set(res)).sort();
  }, [win3Sets]);

  const totalCost = useMemo(() => {
    const amount = parseFloat(betAmount) || 0;
    let sum = 0;
    if (selectedBets.includes('top2')) sum += win2Digits.length * amount;
    if (selectedBets.includes('bottom2')) sum += win2Digits.length * amount;
    if (selectedBets.includes('sets3')) sum += win3Sets.length * amount;
    if (selectedBets.includes('back6')) sum += win3Permutations.length * amount;
    if (selectedBets.includes('crossingCut3')) sum += win3Permutations.filter(n => !isCrossingCut(n)).length * amount;
    if (selectedBets.includes('crossingOnly3')) sum += win3Permutations.filter(n => isCrossingCut(n)).length * amount;
    return sum;
  }, [selectedBets, win2Digits.length, win3Sets.length, win3Permutations.length, betAmount, isCrossingCut]);

  const handleReset = () => {
    setSelectedDraw("");
    setSelectedNumbers([]);
    setOption1Numbers([]);
    setOption2Numbers([]);
    setOption3Numbers([]);
    setCurrentDayIdx(null);
    setBetAmount("1");
    setSelectedBets(['top2', 'bottom2', 'back6']);
    setWin3Mode('6back');
    setWin2Mode('reverse');
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50 font-sans">
      {/* Modal สถิติ */}
      {showStats && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-slate-900 p-8 text-white relative">
              <button onClick={() => setShowStats(false)} className="absolute right-6 top-6 p-2 rounded-full hover:bg-white/10 transition-colors"><X className="w-6 h-6" /></button>
              <h2 className="text-3xl font-black flex items-center gap-3"><History className="text-indigo-400" /> วิเคราะห์สถิติจำลอง</h2>
            </div>
            <div className="p-8 space-y-8 text-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-6 bg-indigo-50 rounded-3xl border">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">เลขเด่นงวดนี้</span>
                  <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                    {calculateTop7(selectedDraw || lotteryDates[0].id, currentDayIdx || 0).map(n => (
                      <span key={n} className="w-9 h-9 flex items-center justify-center bg-white border border-indigo-200 text-indigo-600 rounded-lg text-lg font-black">{n}</span>
                    ))}
                  </div>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border flex flex-col items-center justify-center">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">ความน่าจะเป็น</span>
                  <div className="text-4xl font-black text-emerald-600 mt-1">95.4%</div>
                </div>
              </div>
              <button onClick={() => setShowStats(false)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg">ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}

      <header className={`${activeTheme.bg} text-white py-6 px-4 shadow-lg sticky top-0 z-50 transition-colors duration-500`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className={`w-8 h-8 ${currentDayIdx === 1 ? 'text-indigo-600' : 'text-yellow-300'} fill-current`} />
            <h1 className="text-2xl font-bold">วินเลขนำโชค Pro</h1>
          </div>
          {selectedDraw && (
            <div className="text-right">
              <span className="text-lg sm:text-2xl font-bold">งวด {currentDrawInfo?.label.split(' (')[0]}</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8 space-y-8">
        <section className="bg-white rounded-2xl p-2 shadow-sm border flex gap-2">
          <button onClick={() => setSelectionMode('single')} className={`flex-1 py-4 rounded-xl font-black transition-all ${selectionMode === 'single' ? activeTheme.bg + ' text-white shadow-md' : 'text-slate-400'}`}>วินกลุ่มเดียว</button>
          <button onClick={() => setSelectionMode('cross')} className={`flex-1 py-4 rounded-xl font-black transition-all ${selectionMode === 'cross' ? activeTheme.bg + ' text-white shadow-md' : 'text-slate-400'}`}>วินแยกกลุ่ม (Opt 1,2,3)</button>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
           <section className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border space-y-5">
              <div className="space-y-3">
                <label className="text-lg font-semibold flex items-center gap-2"><Calendar className={activeTheme.text} /> งวดที่ต้องการ</label>
                <select value={selectedDraw} onChange={handleDrawChange} className="w-full bg-slate-50 border py-4 px-4 rounded-xl font-medium outline-none">
                  <option value="" disabled>--- เลือกงวด ---</option>
                  {lotteryDates.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                </select>
                <button onClick={handleAnalyzeStats} disabled={!selectedDraw} className="w-full py-4 bg-slate-900 text-amber-400 rounded-xl font-bold shadow-md">วิเคราะห์สถิติจำลอง</button>
              </div>
           </section>
           <section className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border">
             <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Zap className={activeTheme.text} /> ทางลัดเลขกำลังวัน</h2>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
               {DAY_NUMBERS.map(day => (
                 <button key={day.label} onClick={() => { 
                   setOption1Numbers([...day.numbers].sort((a,b)=>a-b)); 
                   setSelectedNumbers([...day.numbers].sort((a,b)=>a-b));
                   setCurrentDayIdx(day.dayIdx);
                 }} className={`${DAY_THEMES[day.dayIdx].bg} ${day.dayIdx === 1 ? 'text-slate-800' : 'text-white'} px-4 py-3 rounded-xl text-sm font-bold shadow-sm`}>
                   {day.label}: {day.numbers.join('-')}
                 </button>
               ))}
             </div>
           </section>
        </div>

        <section className="bg-white rounded-3xl p-8 shadow-sm border space-y-6">
          {selectionMode === 'single' ? (
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center justify-between">วินกลุ่มเดียว <button onClick={() => setSelectedNumbers([])} className="text-sm text-rose-500 font-bold">ล้างเลข</button></h2>
              <NumberSelector selectedNumbers={selectedNumbers} onToggle={(n) => toggleNumber(n, 'single')} themeColor={activeTheme.bg} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['opt1', 'opt2', 'opt3'].map((opt, i) => (
                <div key={opt} className="space-y-4 bg-slate-50 p-6 rounded-3xl border">
                  <h3 className="font-black text-xs uppercase opacity-50">Option {i+1}</h3>
                  <NumberSelector 
                    selectedNumbers={opt === 'opt1' ? option1Numbers : opt === 'opt2' ? option2Numbers : option3Numbers} 
                    onToggle={(n) => toggleNumber(n, opt as any)} 
                    themeColor={i === 0 ? activeTheme.bg : i === 1 ? 'bg-orange-500' : 'bg-indigo-600'} 
                    isCompact 
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="space-y-12">
           <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-black flex items-center gap-2"><Filter className={activeTheme.text} /> วินเลข 2 ตัว (ไม่รวมหาม)</h2>
                <div className="flex gap-2 bg-slate-200 p-1.5 rounded-2xl border">
                  <button onClick={() => setWin2Mode('straight')} className={`px-6 py-2 rounded-xl font-black ${win2Mode === 'straight' ? activeTheme.bg + ' text-white shadow-lg' : 'text-slate-600'}`}>ชุดตรง</button>
                  <button onClick={() => setWin2Mode('reverse')} className={`px-6 py-2 rounded-xl font-black ${win2Mode === 'reverse' ? activeTheme.bg + ' text-white shadow-lg' : 'text-slate-600'}`}>กลับเลข</button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResultCard title="2 ตัวบน" subtitle="ไฮไลท์: ม่วง(ซ้ำ3), ส้ม(ซ้ำ2)" data={win2Digits} onCopy={() => {}} isCopied={false} theme={activeTheme} highlightCheck={checkHighlightStatus} isFullHeight />
                <ResultCard title="2 ตัวล่าง" subtitle="ไฮไลท์: ม่วง(ซ้ำ3), ส้ม(ซ้ำ2)" data={win2Digits} onCopy={() => {}} isCopied={false} theme={activeTheme} highlightCheck={checkHighlightStatus} isFullHeight />
              </div>
           </div>

           <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-black flex items-center gap-2"><Filter className={activeTheme.text} /> วินเลข 3 ตัว (ไม่รวมหาม/ตอง)</h2>
              </div>
              <div className="flex bg-slate-200 p-1.5 rounded-2xl border overflow-x-auto no-scrollbar gap-2 mb-6">
                {[{id:'sets',l:'3 ตัวตรง'},{id:'6back',l:'6 กลับ'},{id:'crossing',l:'ตัดข้ามเศียร'},{id:'onlyCrossing',l:'ข้ามเศียรล้วน'}].map(m => (
                  <button key={m.id} onClick={() => setWin3Mode(m.id as any)} className={`flex-shrink-0 px-8 py-3 rounded-xl font-black ${win3Mode === m.id ? activeTheme.bg + ' text-white shadow-lg' : 'text-slate-600'}`}>{m.l}</button>
                ))}
              </div>
              <ResultCard 
                title="วินเลข 3 ตัว" 
                subtitle="เส้นแบ่งทุก 50 ชุด | ตัดเลขหามและเลขตองอัตโนมัติ" 
                data={win3Mode === 'sets' ? win3Sets : win3Mode === 'crossing' ? win3Permutations.filter(n => !isCrossingCut(n)) : win3Mode === 'onlyCrossing' ? win3Permutations.filter(n => isCrossingCut(n)) : win3Permutations} 
                onCopy={() => {}} isCopied={false} theme={activeTheme} highlightCheck={checkHighlightStatus} isFullHeight 
              />
           </div>
        </div>

        <section className={`bg-white rounded-3xl p-10 shadow-2xl border-2 ${activeTheme.border}`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b pb-8 mb-8">
            <div className="text-3xl font-black flex items-center gap-4"><Calculator className={activeTheme.text} /> ราคาแทง/ชุด</div>
            <input type="number" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} className="w-full md:w-48 py-4 px-6 bg-slate-50 border-2 rounded-2xl font-black text-3xl text-right outline-none" />
          </div>
          <div className="bg-slate-900 rounded-3xl p-10 flex flex-col items-center justify-center border-4 border-indigo-500/30">
            <span className="text-indigo-400 font-black uppercase tracking-widest mb-2">ยอดรวมสุทธิ</span>
            <div className="text-6xl font-black text-white">{totalCost.toLocaleString()} <span className="text-2xl opacity-40">บาท</span></div>
          </div>
        </section>

        <div className="flex justify-center pt-10">
          <button onClick={handleReset} className="flex items-center gap-3 px-10 py-5 bg-rose-500 text-white rounded-[2rem] font-black text-xl shadow-xl shadow-rose-200">
            <RotateCcw className="w-6 h-6" /> รีเซ็ตข้อมูลทั้งหมด
          </button>
        </div>
      </main>
    </div>
  );
};

export default App;
