
import React, { useState, useMemo, useCallback } from 'react';
import { 
  Hash, 
  Zap,
  Calendar,
  Filter,
  Eye,
  EyeOff,
  Coins,
  Calculator,
  Layers,
  Repeat,
  Scissors,
  Check,
  ArrowRightLeft,
  LayoutGrid
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

const generateLotteryDates = () => {
  const dates = [];
  const year = 2026;
  const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const THAI_DAYS_LONG = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
  for (let month = 0; month < 12; month++) {
    [1, 16].forEach(day => {
      let actualDay = day;
      // แก้ไข: เลื่อนวันหวยออก 1 พ.ค. 2569 เป็น 2 พ.ค. 2569 (เนื่องจาก 1 พ.ค. เป็นวันแรงงาน)
      if (month === 4 && day === 1) {
        actualDay = 2;
      }
      const date = new Date(year, month, actualDay);
      const dayOfWeek = date.getDay();
      dates.push({ 
        label: `${actualDay} ${THAI_MONTHS[month]} 2569 (${THAI_DAYS_LONG[dayOfWeek]})`, 
        dayOfWeek: dayOfWeek, 
        id: `${year}-${month + 1}-${actualDay}` 
      });
    });
  }
  return dates;
};

const LOTTERY_DATES = generateLotteryDates();

type BetType = 'top2' | 'bottom2' | 'sets3' | 'back6' | 'crossing3';

const App: React.FC = () => {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedDraw, setSelectedDraw] = useState<string>("");
  const [currentDayIdx, setCurrentDayIdx] = useState<number | null>(null);
  const [isFiltering, setIsFiltering] = useState<boolean>(false);
  const [betAmount, setBetAmount] = useState<string>("1");
  const [win3Mode, setWin3Mode] = useState<'sets' | '6back' | 'crossing'>('6back');
  const [win2Mode, setWin2Mode] = useState<'straight' | 'reverse'>('reverse');
  const [selectedBets, setSelectedBets] = useState<BetType[]>(['top2', 'bottom2', 'back6']);

  const activeTheme = currentDayIdx !== null ? DAY_THEMES[currentDayIdx] : DAY_THEMES.default;

  const toggleNumber = useCallback((num: number) => {
    setSelectedNumbers(prev => prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num].sort((a, b) => a - b));
  }, []);

  const handleDrawChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedDraw(val);
    const draw = LOTTERY_DATES.find(d => d.id === val);
    if (draw) {
      setCurrentDayIdx(draw.dayOfWeek);
      const luckyData = DAY_NUMBERS.find(d => d.dayIdx === draw.dayOfWeek);
      if (luckyData) setSelectedNumbers([...luckyData.numbers].sort((a, b) => a - b));
    }
  };

  const activeDrawLabel = useMemo(() => {
    const draw = LOTTERY_DATES.find(d => d.id === selectedDraw);
    return draw ? `งวดประจำวันที่ ${draw.label}` : '';
  }, [selectedDraw]);

  const isDayCombination = useCallback((digits: string) => {
    if (currentDayIdx === null) return true;
    const dayNums = DAY_NUMBERS.find(d => d.dayIdx === currentDayIdx)?.numbers || [];
    return digits.split('').every(d => dayNums.includes(parseInt(d)));
  }, [currentDayIdx]);

  const isCrossingCut = useCallback((numStr: string) => {
    const outerSet = [1, 4, 7, 0, 3, 9, 6];
    const midSet = [2, 5, 8];
    const d1 = parseInt(numStr[0]);
    const d2 = parseInt(numStr[1]);
    const d3 = parseInt(numStr[2]);
    return midSet.includes(d2) && (outerSet.includes(d1) || outerSet.includes(d3));
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
  }, [selectedNumbers, isFiltering, isDayCombination, win2Mode]);

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
  }, [selectedNumbers, isFiltering, isDayCombination]);

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
  }, [selectedNumbers, isFiltering, isDayCombination]);

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

  const toggleBetSelection = (type: BetType) => {
    setSelectedBets(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const copyResults = (data: string[], type: string) => {
    navigator.clipboard.writeText(data.join(', '));
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen pb-12 bg-slate-50 transition-colors duration-500">
      <header className={`${activeTheme.bg} text-white py-6 px-4 shadow-lg sticky top-0 z-50 transition-colors duration-500`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Zap className={`w-8 h-8 ${currentDayIdx === 1 ? 'text-indigo-600' : 'text-yellow-300'} fill-current`} />
            <h1 className={`text-2xl font-bold tracking-tight ${currentDayIdx === 1 ? 'text-slate-800' : 'text-white'}`}>วินเลขนำโชค</h1>
          </div>
          {activeDrawLabel && (
            <div className="text-right">
              <span className={`text-lg sm:text-2xl font-bold transition-colors duration-500 ${currentDayIdx === 1 ? 'text-slate-700' : 'text-white'}`}>
                {activeDrawLabel}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
              <label className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Calendar className={`w-5 h-5 ${activeTheme.text}`} /> เลือกงวดปี 2569
              </label>
              <select value={selectedDraw} onChange={handleDrawChange} className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 rounded-xl appearance-none font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="" disabled>--- กรุณาเลือกงวด ---</option>
                {LOTTERY_DATES.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
           </section>

           <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
             <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
               <Zap className={`w-5 h-5 ${activeTheme.text}`} /> เลขกำลังวัน
             </h2>
             <div className="flex flex-wrap gap-2">
               {DAY_NUMBERS.map(day => (
                 <button key={day.label} onClick={() => { setCurrentDayIdx(day.dayIdx); setSelectedNumbers([...day.numbers].sort((a,b)=>a-b)); }} className={`${DAY_THEMES[day.dayIdx].bg} ${day.dayIdx === 1 ? 'text-slate-800' : 'text-white'} px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all`}>
                   {day.label}
                 </button>
               ))}
             </div>
           </section>
        </div>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Hash className={`w-5 h-5 ${activeTheme.text}`} /> ชุดตัวเลข ({selectedNumbers.length})
            </h2>
            <div className="flex gap-2">
              <button onClick={() => setSelectedNumbers([0,1,2,3,4,5,6,7,8,9])} className={`text-xs font-bold ${activeTheme.text} px-3 py-1.5 rounded-lg hover:bg-slate-50`}>เลือกทั้งหมด</button>
              <button onClick={() => { setSelectedNumbers([]); setCurrentDayIdx(null); setSelectedDraw(""); }} className="text-xs font-bold text-rose-500 px-3 py-1.5 rounded-lg hover:bg-rose-50">ล้างออก</button>
            </div>
          </div>
          <NumberSelector selectedNumbers={selectedNumbers} onToggle={toggleNumber} themeColor={activeTheme.bg} />
        </section>

        <section className={`bg-white rounded-2xl p-6 shadow-md border transition-all duration-500 ${activeTheme.border}`}>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-2xl font-black text-slate-800">
                <Calculator className={`w-8 h-8 ${activeTheme.text}`} />
                เครื่องคิดเลขคำนวณเงิน
              </div>
              <div className="relative w-full md:w-72">
                <Coins className={`absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 ${activeTheme.text}`} />
                <input 
                  type="number" 
                  value={betAmount} 
                  onChange={(e) => setBetAmount(e.target.value)} 
                  className={`w-full pl-12 pr-4 py-4 bg-slate-50 border-2 rounded-2xl font-black text-2xl text-slate-700 focus:outline-none transition-all ${activeTheme.border}`} 
                  placeholder="บาทต่อชุด" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { id: 'top2' as BetType, label: '2 ตัวบน', count: win2Digits.length },
                { id: 'bottom2' as BetType, label: '2 ตัวล่าง', count: win2Digits.length },
                { id: 'sets3' as BetType, label: '3 ตัวชุด', count: win3Sets.length },
                { id: 'back6' as BetType, label: '3 ตัว (6 กลับ)', count: win3Permutations.length },
                { id: 'crossing3' as BetType, label: '3 ตัวข้ามเศียร', count: win3CrossingCut.length },
              ].map((bet) => (
                <button 
                  key={bet.id}
                  onClick={() => toggleBetSelection(bet.id)}
                  className={`group relative flex flex-col rounded-3xl border-2 transition-all text-left overflow-hidden ${selectedBets.includes(bet.id) ? `border-transparent shadow-xl scale-[1.03] ${activeTheme.bg}` : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}
                >
                  <div className={`px-4 py-2 text-sm font-black uppercase tracking-widest flex justify-between items-center ${selectedBets.includes(bet.id) ? 'bg-black/10 text-white' : 'bg-slate-50 text-slate-400'}`}>
                    {bet.label}
                    {selectedBets.includes(bet.id) && <Check className="w-5 h-5 text-white" />}
                  </div>
                  <div className="p-5">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-3xl font-black ${selectedBets.includes(bet.id) ? 'text-white' : 'text-slate-800'}`}>
                        {(bet.count * (parseFloat(betAmount) || 0)).toLocaleString()}
                      </span>
                      <span className={`text-base font-bold ${selectedBets.includes(bet.id) ? 'text-white/80' : 'text-slate-400'}`}>บาท</span>
                    </div>
                    <div className={`mt-2 text-sm font-bold ${selectedBets.includes(bet.id) ? 'text-white/70' : 'text-slate-400'}`}>
                      {bet.count} ชุด
                    </div>
                  </div>
                </button>
              ))}

              <div className={`relative flex flex-col rounded-3xl border-4 transition-all duration-500 overflow-hidden ${activeTheme.border} bg-slate-900 shadow-2xl scale-[1.05] z-10`}>
                <div className={`${activeTheme.bg} px-4 py-3 text-sm font-black uppercase text-white tracking-widest text-center`}>
                  ยอดเงินรวมสุทธิ
                </div>
                <div className="p-6 flex flex-col items-center justify-center bg-slate-900">
                  <div className="flex items-baseline gap-3">
                    <span className={`text-4xl font-black text-white leading-none`}>
                      {totalCost.toLocaleString()}
                    </span>
                    <span className={`text-xl font-black text-white opacity-60`}>บาท</span>
                  </div>
                  <div className="mt-2 text-xs font-bold text-white/40 tracking-widest">
                    TOTAL PAYOUT CALCULATED
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 pt-4 gap-4">
           <div className="flex items-center gap-2">
             <Filter className={`w-5 h-5 ${activeTheme.text}`} />
             <span className="font-bold text-slate-700">ผลลัพธ์การวินเลข</span>
           </div>
           
           <div className="flex flex-wrap gap-2">
              <div className="flex bg-white p-1 rounded-full shadow-sm border border-slate-100">
                <button 
                  onClick={() => setWin2Mode('straight')} 
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${win2Mode === 'straight' ? activeTheme.bg + ' text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" /> ชุดตรง
                </button>
                <button 
                  onClick={() => setWin2Mode('reverse')} 
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${win2Mode === 'reverse' ? activeTheme.bg + ' text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" /> กลับเลข
                </button>
              </div>

              {currentDayIdx !== null && (
                <button onClick={() => setIsFiltering(!isFiltering)} className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 ${isFiltering ? activeTheme.bg + ' text-white shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                  {isFiltering ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <span className="text-xs font-bold">กรองเลขกำลังวัน</span>
                </button>
              )}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <ResultCard 
            title="วินเลข 2 ตัวบน" 
            subtitle={isFiltering ? "กรองเฉพาะเลขกำลังวัน" : (win2Mode === 'straight' ? "เลขวิน 2 ตัวตรง" : "เลขวิน 2 ตัวกลับ")}
            data={win2Digits} 
            onCopy={() => copyResults(win2Digits, 'top2')}
            isCopied={copied === 'top2'}
            theme={activeTheme}
          />

          <ResultCard 
            title="วินเลข 2 ตัวล่าง" 
            subtitle={isFiltering ? "กรองเฉพาะเลขกำลังวัน" : (win2Mode === 'straight' ? "เลขวิน 2 ตัวตรง" : "เลขวิน 2 ตัวกลับ")}
            data={win2Digits} 
            onCopy={() => copyResults(win2Digits, 'top2')}
            isCopied={copied === 'top2'}
            theme={activeTheme}
          />

          <div className="space-y-4">
             <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100 overflow-x-auto no-scrollbar">
                <button onClick={() => setWin3Mode('sets')} className={`flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${win3Mode === 'sets' ? activeTheme.bg + ' text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                  <Layers className="w-3.5 h-3.5" /> ชุด
                </button>
                <button onClick={() => setWin3Mode('6back')} className={`flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${win3Mode === '6back' ? activeTheme.bg + ' text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                  <Repeat className="w-3.5 h-3.5" /> 6 กลับ
                </button>
                <button onClick={() => setWin3Mode('crossing')} className={`flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${win3Mode === 'crossing' ? activeTheme.bg + ' text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                  <Scissors className="w-3.5 h-3.5" /> ตัดข้ามเศียร
                </button>
             </div>

             <ResultCard 
                title={win3Mode === 'sets' ? "วินเลข 3 ตัว (ชุด)" : win3Mode === 'crossing' ? "วินเลข 3 ตัว (ตัดข้ามเศียร)" : "วินเลข 3 ตัว (6 กลับ)"}
                subtitle={isFiltering ? "กรองเฉพาะเลขกำลังวัน" : (win3Mode === 'sets' ? "เลขวิน 3 ตัว (ไม่รวมหาม/ตอง)" : win3Mode === 'crossing' ? "ตัดเลข 2,5,8 ที่อยู่ตรงกลาง" : "เลข 6 กลับ ครบทุกตำแหน่ง")}
                data={win3DisplayData} 
                onCopy={() => copyResults(win3DisplayData, '3digit')}
                isCopied={copied === '3digit'}
                theme={activeTheme}
                isFullHeight={true}
             />
          </div>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto px-4 mt-12 mb-8 text-center text-slate-400 text-xs">
        <p>© 2569 วินเลขนำโชค - ระบบคำนวณเงินและตัดเลขข้ามเศียร อัตโนมัติ</p>
      </footer>
    </div>
  );
};

export default App;
