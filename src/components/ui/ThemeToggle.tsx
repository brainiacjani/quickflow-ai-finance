import React from 'react';
import useTheme from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { theme, toggle } = useTheme();
  return (
    <div className={className ?? ''}>
      <Button size="sm" variant="ghost" onClick={toggle} aria-label="Toggle theme">
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </Button>
    </div>
  );
};

export default ThemeToggle;
