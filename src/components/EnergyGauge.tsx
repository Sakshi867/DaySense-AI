import React from 'react';
import { motion } from 'framer-motion';
import { useEnergy } from '@/contexts/EnergyContext';
import { cn } from '@/lib/utils';

interface EnergyGaugeProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  vertical?: boolean;
}

const EnergyGauge: React.FC<EnergyGaugeProps> = ({ 
  size = 'md', 
  showLabel = true,
  vertical = false 
}) => {
  const { energyLevel, energyState } = useEnergy();
  
  const sizeConfig = {
    sm: { height: 'h-20', width: 'w-2', gap: 'gap-0.5' },
    md: { height: 'h-32', width: 'w-3', gap: 'gap-1' },
    lg: { height: 'h-48', width: 'w-4', gap: 'gap-1.5' },
  };
  
  const getBarColor = (index: number) => {
    const level = 5 - index; // Reverse for visual stacking
    if (level > energyLevel) return 'bg-muted';
    
    switch (energyState) {
      case 'recharge':
        return 'bg-gradient-to-t from-amber-500 to-orange-400';
      case 'flow':
        return 'bg-gradient-to-t from-teal-500 to-emerald-400';
      case 'focus':
        return 'bg-gradient-to-t from-violet-600 to-purple-500';
    }
  };
  
  const getGlowColor = () => {
    switch (energyState) {
      case 'recharge':
        return 'shadow-amber-500/30';
      case 'flow':
        return 'shadow-teal-500/30';
      case 'focus':
        return 'shadow-violet-500/30';
    }
  };
  
  if (vertical) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className={cn('flex flex-col-reverse', sizeConfig[size].gap)}>
          {[0, 1, 2, 3, 4].map((index) => (
            <motion.div
              key={index}
              className={cn(
                sizeConfig[size].width,
                'h-3 rounded-full',
                getBarColor(index),
                5 - index <= energyLevel && `shadow-lg ${getGlowColor()}`
              )}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            />
          ))}
        </div>
        {showLabel && (
          <span className="text-xs font-medium text-muted-foreground">
            {energyLevel}/5
          </span>
        )}
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2">
      <div className={cn('flex', sizeConfig[size].gap)}>
        {[1, 2, 3, 4, 5].map((level) => (
          <motion.div
            key={level}
            className={cn(
              sizeConfig[size].width,
              'h-8 rounded-full',
              level <= energyLevel 
                ? getBarColor(5 - level)
                : 'bg-muted',
              level <= energyLevel && `shadow-lg ${getGlowColor()}`
            )}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: level * 0.1, duration: 0.3 }}
          />
        ))}
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-muted-foreground ml-2">
          {energyLevel}/5
        </span>
      )}
    </div>
  );
};

export default EnergyGauge;
