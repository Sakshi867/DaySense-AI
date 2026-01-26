import React from 'react';
import { motion } from 'framer-motion';
import { Battery, BatteryLow, BatteryMedium, BatteryFull, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnergySliderProps {
  value: number;
  onChange: (value: number) => void;
}

const energyLabels = [
  { level: 1, label: 'Depleted', icon: BatteryLow, color: 'text-amber-500' },
  { level: 2, label: 'Low', icon: BatteryLow, color: 'text-amber-500' },
  { level: 3, label: 'Balanced', icon: BatteryMedium, color: 'text-teal-500' },
  { level: 4, label: 'Charged', icon: BatteryFull, color: 'text-violet-500' },
  { level: 5, label: 'Peak', icon: Zap, color: 'text-violet-600' },
];

const EnergySlider: React.FC<EnergySliderProps> = ({ value, onChange }) => {
  const currentEnergy = energyLabels.find(e => e.level === value) || energyLabels[2];
  const Icon = currentEnergy.icon;

  return (
    <div className="w-full space-y-6">
      {/* Current Level Display */}
      <motion.div
        className="flex flex-col items-center gap-2"
        key={value}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <Icon className={cn('w-12 h-12', currentEnergy.color)} strokeWidth={1.5} />
        <span className={cn('text-2xl font-bold', currentEnergy.color)}>
          {currentEnergy.label}
        </span>
      </motion.div>

      {/* Slider Track */}
      <div className="relative">
        <div className="flex justify-between items-center gap-2 px-2">
          {energyLabels.map(({ level, color }) => (
            <motion.button
              key={level}
              onClick={() => onChange(level)}
              className={cn(
                'relative z-10 w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center',
                'transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
                level === value
                  ? 'bg-gradient-to-br scale-110 shadow-lg ' +
                  (level <= 2 ? 'from-amber-400 to-orange-500' :
                    level === 3 ? 'from-teal-400 to-emerald-500' :
                      'from-violet-500 to-purple-600')
                  : 'bg-muted hover:bg-muted/80'
              )}
              whileHover={{ scale: level === value ? 1.1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className={cn(
                'font-bold text-base sm:text-lg',
                level === value ? 'text-white' : 'text-muted-foreground'
              )}>
                {level}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="absolute top-1/2 left-6 right-6 h-1 -translate-y-1/2 bg-muted rounded-full -z-0">
          <motion.div
            className={cn(
              'h-full rounded-full',
              value <= 2 ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                value === 3 ? 'bg-gradient-to-r from-teal-400 to-emerald-500' :
                  'bg-gradient-to-r from-violet-500 to-purple-600'
            )}
            initial={{ width: 0 }}
            animate={{ width: `${((value - 1) / 4) * 100}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs text-muted-foreground px-2">
        <span>Need Rest</span>
        <span>Peak Energy</span>
      </div>
    </div>
  );
};

export default EnergySlider;
