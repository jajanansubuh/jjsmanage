interface CetakPrintViewProps {
  items: any[];
}

export function CetakPrintView({ items }: CetakPrintViewProps) {
  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          
          .label-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 5mm;
            padding: 5mm;
          }
          .label-item {
            border: 1px solid #000;
            padding: 4mm;
            text-align: center;
            height: 35mm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            visibility: visible !important;
          }
          .label-name {
            font-size: 11pt;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 1mm;
            visibility: visible !important;
          }
          .label-code {
            font-size: 9pt;
            font-family: monospace;
            visibility: visible !important;
          }
        }
      `}</style>

      <div className="hidden print:block print-area">
        <div className="label-grid">
          {items.map(item => (
            Array.from({ length: item.qty }).map((_, i) => (
              <div key={`${item.id}-${i}`} className="label-item">
                <div className="label-name">{item.name}</div>
                <div className="label-code">
                  <span className="mr-2">[{item.supplierName}]</span>
                  {item.code || ""}
                </div>
                <div className="mt-2 border-t border-black pt-2 font-bold text-lg">Rp ..........</div>
              </div>
            ))
          ))}
        </div>
      </div>
    </>
  );
}
