'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const Checkbox = React.forwardRef(
  ({ className, checked, onCheckedChange, indeterminate, ...props }, ref) => {
    const [isChecked, setIsChecked] = React.useState(checked || false);
    const checkboxRef = React.useRef(null);

    React.useEffect(() => {
      setIsChecked(checked || false);
    }, [checked]);

    React.useEffect(() => {
      if (checkboxRef.current && indeterminate !== undefined) {
        checkboxRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    const handleChange = (e) => {
      const newChecked = e.target.checked;
      setIsChecked(newChecked);
      if (onCheckedChange) {
        onCheckedChange(newChecked);
      }
    };

    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          ref={(node) => {
            checkboxRef.current = node;
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          checked={isChecked}
          onChange={handleChange}
          className={cn(
            'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer',
            isChecked && 'bg-primary border-primary',
            className
          )}
          {...props}
        />
        {isChecked && (
          <Check className="absolute left-0 top-0 h-4 w-4 text-primary-foreground pointer-events-none flex items-center justify-center" />
        )}
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };

