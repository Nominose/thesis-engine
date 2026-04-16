import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { HK_STOCKS, type HKStock } from '../data/hk-stocks';
import { useLang } from '../i18n/LanguageContext';

// 防抖 Hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

interface StockCodeSearchProps {
  onSelect: (stock: HKStock) => void;
  selected?: HKStock | null;
  placeholder?: string;
}

const filterStocks = (term: string): HKStock[] => {
  const q = term.trim().toLowerCase();
  if (!q) return HK_STOCKS;
  return HK_STOCKS.filter(
    (s) =>
      s.code.includes(q) ||
      s.symbol.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.nameEn.toLowerCase().includes(q),
  );
};

const StockCodeSearch = React.forwardRef<HTMLInputElement, StockCodeSearchProps>(
  ({ onSelect, selected, placeholder }, ref) => {
    const { t, lang } = useLang();
    const [query, setQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debouncedQuery = useDebounce(query, 200);

    const options = useMemo(() => filterStocks(debouncedQuery), [debouncedQuery]);

    // 点击外部关闭
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
          setShowDropdown(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = useCallback(
      (item: HKStock) => {
        const displayName = lang === 'en' ? item.nameEn : item.name;
        setQuery(`${item.code} · ${displayName}`);
        setShowDropdown(false);
        setFocusedIndex(-1);
        onSelect(item);
      },
      [onSelect, lang],
    );

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showDropdown || options.length === 0) return;
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % options.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + options.length) % options.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedIndex >= 0) handleSelect(options[focusedIndex]);
          break;
        case 'Escape':
          setShowDropdown(false);
          setFocusedIndex(-1);
          break;
      }
    };

    return (
      <div className="w-full relative" ref={dropdownRef}>
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-[#484f58] text-sm" />
          <input
            ref={ref}
            type="text"
            placeholder={placeholder ?? t('search.placeholder')}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            aria-autocomplete="list"
            aria-expanded={showDropdown}
            className="w-full pl-11 pr-4 py-3.5 bg-[#0d1117] border border-[#30363d] rounded-xl
                       text-[#e6edf3] placeholder-[#484f58] text-sm font-mono
                       focus:outline-none focus:border-[#3fb950] transition-colors"
          />
          {selected && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md
                             text-xs font-mono font-semibold
                             bg-[#3fb950]/10 text-[#3fb950] border border-[#3fb950]/30">
              {selected.symbol}
            </span>
          )}
        </div>

        {showDropdown && (
          <ul
            role="listbox"
            aria-label={t('search.placeholder')}
            className="absolute top-full left-0 right-0 mt-2 z-50
                       bg-[#161b27] border border-[#30363d] rounded-xl shadow-lg
                       max-h-[380px] overflow-y-auto backdrop-blur-md"
          >
            {options.length === 0 ? (
              <li className="p-4 text-sm text-[#8b949e] text-center">
                {t('search.empty')}
              </li>
            ) : (
              options.map((option, index) => {
                const isSelected = index === focusedIndex;
                const primary = lang === 'en' ? option.nameEn : option.name;
                const secondary = lang === 'en' ? option.name : option.nameEn;
                return (
                  <li
                    key={option.symbol}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setFocusedIndex(index)}
                    className={`px-4 py-3 cursor-pointer border-b border-[#21262d] last:border-b-0 transition-colors
                                ${isSelected ? 'bg-[#1e2736]' : 'hover:bg-[#1e2736]'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono font-semibold text-[#3fb950] text-sm whitespace-nowrap">
                          {option.symbol}
                        </span>
                        <span className="text-[#e6edf3] text-sm truncate">{primary}</span>
                        <span className="text-[#8b949e] text-xs truncate">{secondary}</span>
                      </div>
                      <span className="text-[#8b949e] text-xs whitespace-nowrap">
                        {option.sector}
                      </span>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>
    );
  },
);

StockCodeSearch.displayName = 'StockCodeSearch';

export default StockCodeSearch;
