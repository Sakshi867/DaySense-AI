import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEnergy } from '@/contexts/EnergyContext';
import { cn } from '@/lib/utils';

interface MeshBackgroundProps {
  forcedState?: 'recharge' | 'flow' | 'focus';
}

const MeshBackground: React.FC<MeshBackgroundProps> = ({ forcedState }) => {
  const { energyState } = useEnergy();
  const currentState = forcedState || energyState;
  
  const getMeshClass = () => {
    switch (currentState) {
      case 'recharge':
        return 'mesh-recharge';
      case 'flow':
        return 'mesh-flow';
      case 'focus':
        return 'mesh-focus';
    }
  };
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentState}
        className={cn(
          'fixed inset-0 -z-10',
          getMeshClass()
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      >
        {/* Animated gradient orbs */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-30"
          style={{
            background: currentState === 'recharge' 
              ? 'radial-gradient(circle, hsl(38, 92%, 50%), transparent)'
              : currentState === 'flow'
              ? 'radial-gradient(circle, hsl(160, 84%, 39%), transparent)'
              : 'radial-gradient(circle, hsl(258, 90%, 66%), transparent)',
          }}
          animate={{
            x: ['-10%', '10%', '-10%'],
            y: ['-5%', '15%', '-5%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        <motion.div
          className="absolute right-0 bottom-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-20"
          style={{
            background: currentState === 'recharge' 
              ? 'radial-gradient(circle, hsl(24, 95%, 53%), transparent)'
              : currentState === 'flow'
              ? 'radial-gradient(circle, hsl(168, 80%, 43%), transparent)'
              : 'radial-gradient(circle, hsl(280, 70%, 50%), transparent)',
          }}
          animate={{
            x: ['10%', '-10%', '10%'],
            y: ['10%', '-10%', '10%'],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default MeshBackground;
