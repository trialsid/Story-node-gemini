import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { NodeMenuCategory } from '../utils/nodeMenuConfig';

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  categories: NodeMenuCategory[];
  onClose: () => void;
}

const ContextMenuWithSubmenu: React.FC<ContextMenuProps> = ({ isOpen, position, categories, onClose }) => {
  const { styles } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [menuPosition, setMenuPosition] = useState(position);
  const [submenuCategory, setSubmenuCategory] = useState<NodeMenuCategory | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const hoverTimeoutRef = useRef<number | null>(null);

  // Identify basic inputs and the grouped categories
  const basicInputs = categories.find((category) => category.title === 'Basic Inputs');
  const submenuCategories = categories.filter((category) => category.title !== 'Basic Inputs');

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredBasicItems = useMemo(() => {
    if (!basicInputs) return [];
    if (!normalizedQuery) return basicInputs.items;
    return basicInputs.items.filter((item) => item.label.toLowerCase().includes(normalizedQuery));
  }, [basicInputs, normalizedQuery]);

  const filteredSubmenuCategories = useMemo(() => {
    if (!normalizedQuery) return submenuCategories;

    return submenuCategories
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => item.label.toLowerCase().includes(normalizedQuery)),
      }))
      .filter((category) => category.items.length > 0);
  }, [submenuCategories, normalizedQuery]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedMenu = menuRef.current?.contains(target);
      const clickedSubmenu = submenuRef.current?.contains(target);

      if (!clickedMenu && !clickedSubmenu) {
        onClose();
      }
    };

    const timeoutId = window.setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('contextmenu', handleClickOutside);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('contextmenu', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }

      setSubmenuCategory(null);
      setSubmenuPosition({ x: 0, y: 0 });
      setHoveredCategory(null);
      setSearchQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const focusTimeout = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 30);

    return () => window.clearTimeout(focusTimeout);
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen || !menuRef.current) {
      setMenuPosition((prev) => {
        if (prev.x === position.x && prev.y === position.y) {
          return prev;
        }
        return position;
      });
      return;
    }

    const { width, height } = menuRef.current.getBoundingClientRect();
    const padding = 12;
    const maxLeft = Math.max(padding, window.innerWidth - width - padding);
    const maxTop = Math.max(padding, window.innerHeight - height - padding);
    const adjustedX = Math.min(Math.max(padding, position.x), maxLeft);
    const adjustedY = Math.min(Math.max(padding, position.y), maxTop);

    setMenuPosition((prev) => {
      if (prev.x === adjustedX && prev.y === adjustedY) {
        return prev;
      }
      return { x: adjustedX, y: adjustedY };
    });
  }, [isOpen, position]);

  useLayoutEffect(() => {
    if (!submenuCategory || !submenuRef.current) return;

    const { width, height } = submenuRef.current.getBoundingClientRect();
    const padding = 12;
    let nextX = submenuPosition.x;
    let nextY = submenuPosition.y;

    if (nextX + width + padding > window.innerWidth) {
      nextX = Math.max(padding, menuPosition.x - width - 8);
    }

    if (nextY + height + padding > window.innerHeight) {
      nextY = Math.max(padding, window.innerHeight - height - padding);
    }

    if (nextX !== submenuPosition.x || nextY !== submenuPosition.y) {
      setSubmenuPosition({ x: nextX, y: nextY });
    }
  }, [submenuCategory, submenuPosition, menuPosition.x, menuPosition.y]);

  const handleCategoryHover = (category: NodeMenuCategory, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    setSubmenuCategory(category);
    setSubmenuPosition({
      x: rect.right + 8,
      y: rect.top - 4,
    });
    setHoveredCategory(category.title);
  };

  const handleCategoryLeave = () => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = window.setTimeout(() => {
      if (hoveredCategory && !submenuRef.current?.matches(':hover')) {
        setSubmenuCategory(null);
        setSubmenuPosition({ x: 0, y: 0 });
        setHoveredCategory(null);
      }
      hoverTimeoutRef.current = null;
    }, 100);
  };

  const handleSubmenuLeave = () => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    setSubmenuCategory(null);
    setSubmenuPosition({ x: 0, y: 0 });
    setHoveredCategory(null);
  };

  useEffect(() => {
    if (!submenuCategory) return;

    const stillVisible = filteredSubmenuCategories.some((category) => category.title === submenuCategory.title);
    if (!stillVisible) {
      setSubmenuCategory(null);
      setSubmenuPosition({ x: 0, y: 0 });
      setHoveredCategory(null);
    }
  }, [filteredSubmenuCategories, submenuCategory]);

  const executeAction = (action: () => void) => {
    action();
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  const hasAnyResults = (filteredBasicItems.length > 0) || filteredSubmenuCategories.length > 0;

  return (
    <>
      <div
        ref={menuRef}
        className={`absolute z-30 w-56 ${styles.toolbar.bg} backdrop-blur-sm border ${styles.toolbar.border} rounded-lg shadow-lg p-1`}
        style={{
          top: menuPosition.y,
          left: menuPosition.x,
        }}
        role="menu"
        aria-orientation="vertical"
      >
        <div className="px-2 pb-2 pt-1">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Quick search"
            className="w-full rounded-md border border-gray-500/30 bg-black/20 px-2 py-1 text-sm outline-none transition focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            aria-label="Search context menu actions"
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.stopPropagation();
                onClose();
              }
            }}
          />
        </div>

        {basicInputs && (
          <div>
            <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400/80">
              {basicInputs.title}
            </div>
            {filteredBasicItems.map((item) => (
              <button
                key={item.label}
                onClick={() => executeAction(item.action)}
                className={`w-full flex items-center space-x-2 px-3 py-2 ${styles.toolbar.buttonHoverBg} rounded-md transition-colors text-sm font-medium text-left`}
                role="menuitem"
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
            {filteredBasicItems.length === 0 && (
              <div className="px-3 pb-2 text-xs text-gray-400/70">No matching inputs</div>
            )}
            {filteredSubmenuCategories.length > 0 && (
              <div className="h-px bg-gray-500/20 my-1" aria-hidden="true" />
            )}
          </div>
        )}

        {filteredSubmenuCategories.map((category) => (
          <button
            key={category.title}
            onMouseEnter={(event) => handleCategoryHover(category, event)}
            onMouseLeave={handleCategoryLeave}
            className={`w-full flex items-center justify-between px-3 py-2 ${styles.toolbar.buttonHoverBg} rounded-md transition-colors text-sm font-medium text-left ${
              hoveredCategory === category.title ? 'bg-white/10' : ''
            }`}
            role="menuitem"
            aria-haspopup="true"
            aria-expanded={hoveredCategory === category.title}
          >
            <span>{category.title}</span>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>
        ))}

        {!hasAnyResults && (
          <div className="px-3 py-2 text-xs text-gray-400/70">No actions found</div>
        )}
      </div>

      {submenuCategory && (
        <div
          ref={submenuRef}
          className={`absolute z-40 w-56 ${styles.toolbar.bg} backdrop-blur-sm border ${styles.toolbar.border} rounded-lg shadow-lg p-1`}
          style={{
            top: submenuPosition.y,
            left: submenuPosition.x,
          }}
          onMouseLeave={handleSubmenuLeave}
          role="menu"
          aria-orientation="vertical"
        >
          {submenuCategory.items.map((item) => (
            <button
              key={item.label}
              onClick={() => executeAction(item.action)}
              className={`w-full flex items-center space-x-2 px-3 py-2 ${styles.toolbar.buttonHoverBg} rounded-md transition-colors text-sm font-medium text-left`}
              role="menuitem"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          {submenuCategory.items.length === 0 && (
            <div className="px-3 py-2 text-xs text-gray-400/70">No matching actions</div>
          )}
        </div>
      )}
    </>
  );
};

export default ContextMenuWithSubmenu;
