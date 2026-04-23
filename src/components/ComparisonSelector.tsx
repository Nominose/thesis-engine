import { useState } from 'react';
import StockCodeSearch from './StockCodeSearch';
import ComparisonTable from './ComparisonTable';
import type { HKStock } from '../data/hk-stocks';

interface ComparisonSelectorProps {
  stocks: HKStock[];
}

export default function ComparisonSelector({ stocks }: ComparisonSelectorProps) {
  const [leftStock, setLeftStock] = useState<HKStock | null>(null);
  const [rightStock, setRightStock] = useState<HKStock | null>(null);

  return (
    <div className="space-y-4">
      {/* Comparison Table */}
      <ComparisonTable leftStock={leftStock} rightStock={rightStock} />
      
      {/* Search Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-[#8b949e] text-xs uppercase tracking-widest mb-2">
            选择左侧股票
          </div>
          <div className="relative">
            <StockCodeSearch
              onSelect={setLeftStock}
              selected={leftStock}
              placeholder="搜索港股代码/名称"
              excludeStock={rightStock}
            />
            {leftStock && (
              <button
                onClick={() => setLeftStock(null)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#8b949e] hover:text-[#e6edf3]"
              >
                <i className="fa-solid fa-times" />
              </button>
            )}
          </div>
        </div>
        
        <div>
          <div className="text-[#8b949e] text-xs uppercase tracking-widest mb-2">
            选择右侧股票
          </div>
          <div className="relative">
            <StockCodeSearch
              onSelect={setRightStock}
              selected={rightStock}
              placeholder="搜索港股代码/名称"
              excludeStock={leftStock}
            />
            {rightStock && (
              <button
                onClick={() => setRightStock(null)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#8b949e] hover:text-[#e6edf3]"
              >
                <i className="fa-solid fa-times" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}