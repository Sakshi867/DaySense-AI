import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useEnergy } from '@/contexts/EnergyContext';
import { useBioOrbInsights } from '@/hooks/useBioOrbInsights';
import BioOrbTooltip from '@/components/BioOrbTooltip';

interface BioOrbProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  showLabel?: boolean;
  showTooltip?: boolean;
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-40 h-40',
  xl: 'w-56 h-56',
};

const BioOrb: React.FC<BioOrbProps> = ({ 
  size = 'lg', 
  interactive = false,
  showLabel = false,
  showTooltip = true
}) => {
  const { energyLevel, energyState } = useEnergy();
  const { insight, loading, regenerate } = useBioOrbInsights();
  const [showInsightModal, setShowInsightModal] = useState(false);
  
  // Handle click interaction
  const handleClick = () => {
    if (interactive && insight) {
      setShowInsightModal(true);
    }
  };
  
  // Handle next task suggestion
  const handleNextTask = () => {
    console.log('Suggesting next task based on current state');
    // This would integrate with task recommendation system
    setShowInsightModal(false);
  };
  
  // Handle quick task creation
  const handleQuickTask = () => {
    console.log('Opening quick task creation modal');
    // This would open a task creation modal
    setShowInsightModal(false);
  };
  
  // Dynamic pulse configuration based on AI insight
  const getPulseConfig = () => {
    if (!insight) {
      // Fallback to energy state based pulsing
      switch (energyState) {
        case 'recharge':
          return { duration: 4, scale: [1, 1.03, 1], opacity: [0.7, 0.85, 0.7] };
        case 'flow':
          return { duration: 2.5, scale: [1, 1.05, 1], opacity: [0.8, 0.95, 0.8] };
        case 'focus':
          return { duration: 1.5, scale: [1, 1.08, 1], opacity: [0.9, 1, 0.9] };
      }
    }
    
    // Use AI-driven pulse configuration
    switch (insight.pulseSpeed) {
      case 'slow':
        return { duration: 4, scale: [1, 1.02, 1], opacity: [0.6, 0.75, 0.6] };
      case 'medium':
        return { duration: 2.5, scale: [1, 1.04, 1], opacity: [0.7, 0.85, 0.7] };
      case 'fast':
        return { duration: 1.2, scale: [1, 1.08, 1], opacity: [0.8, 0.95, 0.8] };
    }
  };
  
  const pulseConfig = getPulseConfig();
  
  // Gradient colors based on AI insight or fallback to energy state
  const getGradient = () => {
    if (insight) {
      switch (insight.visualCue) {
        case 'green':
          return 'from-emerald-400 via-teal-500 to-green-600';
        case 'yellow':
          return 'from-yellow-400 via-amber-500 to-orange-600';
        case 'red':
          return 'from-red-400 via-pink-500 to-rose-600';
      }
    }
    
    // Fallback to energy state
    switch (energyState) {
      case 'recharge':
        return 'from-amber-400 via-orange-500 to-amber-600';
      case 'flow':
        return 'from-teal-400 via-emerald-500 to-teal-600';
      case 'focus':
        return 'from-violet-500 via-purple-600 to-violet-700';
    }
  };
  
  const getGlowClass = () => {
    if (insight) {
      switch (insight.visualCue) {
        case 'green':
          return 'orb-glow-green';
        case 'yellow':
          return 'orb-glow-yellow';
        case 'red':
          return 'orb-glow-red';
      }
    }
    
    // Fallback to energy state
    switch (energyState) {
      case 'recharge':
        return 'orb-glow-recharge';
      case 'flow':
        return 'orb-glow-flow';
      case 'focus':
        return 'orb-glow-focus';
    }
  };
  
  const getStateLabel = () => {
    if (insight) {
      switch (insight.visualCue) {
        case 'green':
          return 'In Flow';
        case 'yellow':
          return 'Adjusting';
        case 'red':
          return 'Overloaded';
      }
    }
    
    // Fallback to energy state
    switch (energyState) {
      case 'recharge':
        return 'Recharging';
      case 'flow':
        return 'In Flow';
      case 'focus':
        return 'Deep Focus';
    }
  };
  
  // Dynamic glow intensity based on AI insight
  const getGlowIntensity = () => {
    if (!insight) return 0.4;
    
    switch (insight.glowIntensity) {
      case 'low':
        return 0.2;
      case 'medium':
        return 0.4;
      case 'high':
        return 0.7;
    }
  };
  
  const glowIntensity = getGlowIntensity();
  
  return (
    <div className="relative flex flex-col items-center">
      {/* Outer glow layer with dynamic intensity */}
      <motion.div
        className={`absolute ${sizeClasses[size]} rounded-full blur-2xl`}
        style={{
          background: `radial-gradient(circle, ${
            insight?.visualCue === 'green' 
              ? `rgba(16, 185, 129, ${glowIntensity})`
              : insight?.visualCue === 'yellow'
              ? `rgba(234, 179, 8, ${glowIntensity})`
              : insight?.visualCue === 'red'
              ? `rgba(239, 68, 68, ${glowIntensity})`
              : energyState === 'recharge' 
              ? `rgba(251, 146, 60, ${glowIntensity})`
              : energyState === 'flow'
              ? `rgba(45, 212, 191, ${glowIntensity})`
              : `rgba(139, 92, 246, ${glowIntensity})`
          } 0%, transparent 70%)`,
        }}
        animate={{
          scale: pulseConfig.scale,
          opacity: pulseConfig.opacity.map(o => o * glowIntensity * 1.5),
        }}
        transition={{
          duration: pulseConfig.duration,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Main orb with interactive enhancements */}
      <motion.div
        className={`
          relative ${sizeClasses[size]} rounded-full 
          bg-gradient-to-br ${getGradient()}
          ${getGlowClass()}
          ${interactive ? 'cursor-pointer' : ''}
          shadow-lg
        `}
        animate={{
          scale: pulseConfig.scale,
        }}
        transition={{
          duration: pulseConfig.duration,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        whileHover={interactive ? { scale: 1.1 } : undefined}
        whileTap={interactive ? { scale: 0.95 } : undefined}
        onClick={handleClick}
      >
        {/* Inner highlight */}
        <div 
          className="absolute inset-2 rounded-full opacity-50"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 60%)',
          }}
        />
        
        {/* Core glow */}
        <motion.div
          className="absolute inset-4 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: pulseConfig.duration * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        {/* Energy level indicator with loading state */}
        <div className="absolute inset-0 flex items-center justify-center">
          {loading ? (
            <div className="w-6 h-6 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <span className="text-white font-bold text-lg drop-shadow-lg">
              {energyLevel}
            </span>
          )}
        </div>
      </motion.div>
      
      {/* Label with dynamic state */}
      {showLabel && (
        <motion.p
          className="mt-4 text-sm font-medium text-muted-foreground flex items-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {getStateLabel()}
          {loading && (
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          )}
        </motion.p>
      )}
      
      {/* Interactive Tooltip Modal */}
      {showTooltip && insight && (
        <BioOrbTooltip
          insight={insight}
          isOpen={showInsightModal}
          onClose={() => setShowInsightModal(false)}
          onNextTask={handleNextTask}
          onQuickTask={handleQuickTask}
        />
      )}
    </div>
  );
};

export default BioOrb;
