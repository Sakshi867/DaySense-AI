import React, { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'subtle';
  glow?: boolean;
  className?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'default',
  glow = false,
  className,
  ...props
}) => {
  const variantClasses = {
    default: 'glass-card',
    elevated: 'glass-card shadow-xl',
    subtle: 'backdrop-blur-lg bg-white/30 dark:bg-white/5 rounded-2xl p-6 border border-white/20',
  };
  
  return (
    <motion.div
      className={cn(
        variantClasses[variant],
        glow && 'ring-1 ring-primary/20',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
