
import React from 'react';
import { Copy, CheckCircle2 } from 'lucide-react';

interface ThemeConfig {
  bg: string;
  text: string;
  hex: string;
  border: string;
  btn: string;
  tag: string;
}

export type HighlightStatus = 'none' | 'silver' | 'gold' | 'diamond' | 'opt1' | 'opt2' | 'opt3';

interface ResultCardProps {
  title: string;
  subtitle: string;
  data: string[];
  onCopy: () => void;
  isCopied: boolean;
  theme: ThemeConfig;
  isFullHeight?: boolean;
  highlightCheck?: (numStr: string) => HighlightStatus;
}

const ResultCard: React.FC<ResultCardProps> = ({ 
  title, 
  subtitle, 
  data, 
  onCopy, 
  isCopied, 
  theme, 
  isFullHeight = false, 
  highlightCheck 
}) => {
  
  // ใช้ Inline Styles เพื่อให้สีแสดงผลแน่นอนบน Production/GitHub
  const getStatusStyle = (status: HighlightStatus): React.CSSProperties => {
    switch (status) {
      case 'diamond': // ซ้ำครบ 3 กลุ่ม
        return { backgroundColor: '#4f46e5', borderColor: '#3730a3', color: '#ffffff', fontWeight: '900' };
      case 'gold': // ซ้ำกลุ่ม 1 และ 2
        return { backgroundColor: '#fb923c', borderColor: '#ea580c', color: '#ffffff', fontWeight: '900' };
      case 'silver': // ซ้ำคู่อื่นๆ
        return { backgroundColor: '#64748b', borderColor: '#334155', color: '#ffffff' };
      case 'opt1': // มีในกลุ่มกำลังวัน
        return { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1', color: '#334155' };
      default:
        return { backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' };
    }
  };

  return (
    <div className={`
      flex flex-col bg-white rounded-3xl shadow-sm border-2 transition-all duration-500 ${theme.border} overflow-hidden
      ${isFullHeight ? 'h-auto' : 'h-[500px]'}
    `}>
      <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
        <div>
          <h3 className={`font-black text-xl transition-colors duration-500 ${theme.text}`}>{title}</h3>
          <p className="text-[10px] sm:text-xs font-medium text-slate-400 mt-0.5">{subtitle}</p>
        </div>
        <div className={`px-3 py-1.5 rounded-xl text-sm font-black transition-colors duration-500 ${theme.tag} shadow-sm border`}>
          {data.length.toLocaleString()} ชุด
        </div>
      </div>

      <div className={`
        flex-1 p-5 bg-slate-50/50
        ${isFullHeight ? 'h-auto' : 'overflow-y-auto'}
      `}>
        {data.length > 0 ? (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
            {data.map((num, idx) => {
              const status = highlightCheck ? highlightCheck(num) : 'none';
              const customStyle = getStatusStyle(status);
              const isSpecial = status === 'diamond' || status === 'gold';
              
              // เส้นแบ่งทุก 50 ตัว
              const showSeparator = idx !== 0 && idx % 50 === 0;

              return (
                <React.Fragment key={idx}>
                  {showSeparator && (
                    <div className="col-span-full flex items-center py-6 group">
                      <div className="grow h-px bg-slate-200"></div>
                      <div className="px-5">
                        <span className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase bg-white border border-slate-100 px-3 py-1 rounded-full shadow-sm">
                          ชุดที่ {idx + 1}
                        </span>
                      </div>
                      <div className="grow h-px bg-slate-200"></div>
                    </div>
                  )}
                  <span 
                    style={customStyle}
                    className={`
                      inline-flex items-center justify-center h-11 border-2 rounded-xl transition-all text-base
                      ${isSpecial ? 'scale-105 z-10 shadow-md' : 'shadow-sm'}
                      hover:brightness-95 active:scale-90 cursor-default
                    `}
                  >
                    {num}
                  </span>
                </React.Fragment>
              );
            })}
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center text-slate-300 space-y-3">
            <div className="w-16 h-16 rounded-full border-4 border-dashed border-slate-200 animate-pulse"></div>
            <p className="text-sm font-bold tracking-widest uppercase">เลือกตัวเลขเพื่อเริ่มวิน</p>
          </div>
        )}
      </div>

      <div className="p-5 border-t border-slate-100 bg-white mt-auto shrink-0">
        <button
          disabled={data.length === 0}
          onClick={onCopy}
          className={`
            w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-lg transition-all duration-300
            ${data.length === 0 ? 'bg-slate-100 text-slate-300 cursor-not-allowed border-2 border-slate-100' : `${theme.btn} text-white shadow-lg active:scale-95`}
          `}
        >
          {isCopied ? (
            <><CheckCircle2 className="w-6 h-6 animate-bounce" /> คัดลอกสำเร็จ!</>
          ) : (
            <><Copy className="w-6 h-6" /> คัดลอก {data.length} ชุด</>
          )}
        </button>
      </div>
    </div>
  );
};

export default ResultCard;
