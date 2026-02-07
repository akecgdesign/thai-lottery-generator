
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
  
  // กำหนดค่าสีแบบคงที่เพื่อความชัวร์ (Inline Styles)
  const getStatusStyle = (status: HighlightStatus): React.CSSProperties => {
    switch (status) {
      case 'diamond': // ซ้ำครบ 3 กลุ่ม -> ม่วงเข้ม
        return { backgroundColor: '#4f46e5', borderColor: '#3730a3', color: '#ffffff' };
      case 'gold': // ซ้ำ 1 และ 2 -> ส้ม
        return { backgroundColor: '#fb923c', borderColor: '#ea580c', color: '#ffffff' };
      case 'silver': // ซ้ำคู่อื่นๆ -> เทาเข้ม
        return { backgroundColor: '#94a3b8', borderColor: '#475569', color: '#ffffff' };
      case 'opt1': // อยู่ในกลุ่ม 1 อย่างเดียว -> สีประจำวันจางๆ
        return { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', color: '#0f172a' };
      default:
        return { backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' };
    }
  };

  return (
    <div className={`
      flex flex-col bg-white rounded-2xl shadow-sm border transition-all duration-500 ${theme.border} overflow-hidden
      ${isFullHeight ? 'h-auto' : 'h-[500px]'}
    `}>
      <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div>
          <h3 className={`font-bold text-lg transition-colors duration-500 ${theme.text}`}>{title}</h3>
          <p className="text-[10px] sm:text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors duration-500 ${theme.tag}`}>
          {data.length} ชุด
        </div>
      </div>

      <div className={`
        flex-1 p-4 bg-slate-50
        ${isFullHeight ? 'h-auto' : 'overflow-y-auto'}
      `}>
        {data.length > 0 ? (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {data.map((num, idx) => {
              const status = highlightCheck ? highlightCheck(num) : 'none';
              const customStyle = getStatusStyle(status);
              
              // เพิ่ม Effect พิเศษสำหรับสถานะที่ซ้ำเยอะๆ
              const isSpecial = status === 'diamond' || status === 'gold';

              return (
                <span 
                  key={idx} 
                  style={customStyle}
                  className={`
                    inline-flex items-center justify-center h-10 border rounded-lg font-bold shadow-sm transition-all text-sm
                    ${isSpecial ? 'scale-105 z-10' : ''}
                  `}
                >
                  {num}
                </span>
              );
            })}
          </div>
        ) : (
          <div className="h-40 flex flex-col items-center justify-center text-slate-400 opacity-50 space-y-2">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-300"></div>
            <p className="text-sm">ไม่มีข้อมูลตัวเลข</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-100 mt-auto shrink-0">
        <button
          disabled={data.length === 0}
          onClick={onCopy}
          className={`
            w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all duration-300
            ${data.length === 0 ? 'bg-slate-300 text-white cursor-not-allowed' : `${theme.btn} text-white shadow-sm`}
          `}
        >
          {isCopied ? (
            <>
              <CheckCircle2 className="w-5 h-5" /> คัดลอกแล้ว!
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" /> คัดลอกทั้งหมด
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ResultCard;
