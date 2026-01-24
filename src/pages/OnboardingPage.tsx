import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Sparkles, Target, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEnergy } from '@/contexts/EnergyContext';
import { useAuth } from '@/contexts/AuthContext';
import EnergySlider from '@/components/EnergySlider';
import BioOrb from '@/components/BioOrb';
import GlassCard from '@/components/GlassCard';
import MeshBackground from '@/components/layout/MeshBackground';
import { cn } from '@/lib/utils';

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { energyLevel, setEnergyLevel, northStar, setNorthStar } = useEnergy();
  const { user, updateUser, isOnboardingCompleted, loading } = useAuth();
  
  const [step, setStep] = useState(1);
  const [localNorthStar, setLocalNorthStar] = useState(northStar || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  
  // Safety Timeout: Prevents the "Blank Screen" if Firebase hangs
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading && !user) setTimedOut(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [loading, user]);

  // Redirect to dashboard if onboarding is already completed
  useEffect(() => {
    if (!loading && isOnboardingCompleted) {
      navigate('/dashboard');
    }
  }, [isOnboardingCompleted, loading, navigate]);
  
  const totalSteps = 3;
  
  const handleNext = () => {
    if (step === 2) {
      setNorthStar(localNorthStar);
    }
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };
  
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await updateUser({
        energy_level: energyLevel,
        north_star: localNorthStar || northStar,
        onboarding_completed: true
      });
      
      // Secondary check: Navigate directly if context update is slow
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      setIsSubmitting(false);
    }
  };
  
  const stepVariants = {
    enter: { opacity: 0, x: 50 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };
  
  // 1. LOADING STATE (With user awareness)
  if (loading && !user && !timedOut) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground animate-pulse font-medium">Calibrating DaySense...</p>
      </div>
    );
  }

  // 2. TIMEOUT STATE (Error recovery)
  if (timedOut && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-4">
        <GlassCard className="max-w-md p-8 text-center border-amber-500/20">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Connection Lagging</h2>
          <p className="text-muted-foreground mb-6">
            We're having trouble reaching the bio-servers. Please check your connection.
          </p>
          <Button onClick={() => window.location.reload()} className="w-full">
            Retry Connection
          </Button>
        </GlassCard>
      </div>
    );
  }

  // 3. ACTUAL UI (Preserving all your original elements)
  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      <MeshBackground />
      
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-lg">
          
          {/* Progress Indicator - Original Design */}
          <div className="flex items-center justify-center gap-2 mb-12">
            {[1, 2, 3].map((s) => (
              <motion.div
                key={s}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  s === step ? 'w-8 bg-primary' : 'w-2',
                  s < step ? 'bg-primary/60' : 'bg-muted'
                )}
                layout
              />
            ))}
          </div>
          
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4 }}
              >
                <GlassCard className="text-center" variant="elevated">
                  <div className="mb-8">
                    <motion.div
                      className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles className="w-8 h-8 text-white" />
                    </motion.div>
                    <h2 className="text-2xl font-bold mb-2">
                      How is your cognitive battery?
                    </h2>
                    <p className="text-muted-foreground">
                      Be honest. There's no wrong answer — just awareness.
                    </p>
                  </div>
                  
                  <EnergySlider value={energyLevel} onChange={setEnergyLevel} />
                  
                  <div className="mt-8 pt-6 border-t border-border/50">
                    <Button 
                      onClick={handleNext} 
                      className="w-full py-6 text-lg rounded-xl haptic"
                    >
                      Continue
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </div>
                </GlassCard>
              </motion.div>
            )}
            
            {step === 2 && (
              <motion.div
                key="step2"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4 }}
              >
                <GlassCard className="text-center" variant="elevated">
                  <div className="mb-8">
                    <motion.div
                      className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center"
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 4, repeat: Infinity }}
                    >
                      <Target className="w-8 h-8 text-white" />
                    </motion.div>
                    <h2 className="text-2xl font-bold mb-2">
                      What is your North Star today?
                    </h2>
                    <p className="text-muted-foreground">
                      One priority. The thing that would make today a win.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <Input
                      type="text"
                      placeholder="e.g., Launch the MVP, Finish the proposal..."
                      value={localNorthStar}
                      onChange={(e) => setLocalNorthStar(e.target.value)}
                      className="text-center text-lg py-6 rounded-xl bg-background/50 border-white/10"
                    />
                    
                    <div className="flex flex-wrap gap-2 justify-center">
                      {['Ship the feature', 'Clear inbox', 'Deep focus work', 'Team alignment'].map((suggestion) => (
                        <motion.button
                          key={suggestion}
                          type="button"
                          className="px-3 py-1.5 text-sm rounded-full bg-muted/50 hover:bg-accent transition-colors"
                          onClick={() => setLocalNorthStar(suggestion)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {suggestion}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-border/50 flex gap-3">
                    <Button 
                      variant="outline"
                      onClick={handleBack} 
                      className="haptic py-6 rounded-xl px-6"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <Button 
                      onClick={handleNext} 
                      className="flex-1 haptic py-6 text-lg rounded-xl"
                      disabled={!localNorthStar.trim()}
                    >
                      Continue
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </div>
                </GlassCard>
              </motion.div>
            )}
            
            {step === 3 && (
              <motion.div
                key="step3"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4 }}
              >
                <GlassCard className="text-center" variant="elevated">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-2">
                      Your Bio-Orb is calibrating...
                    </h2>
                    <p className="text-muted-foreground">
                      Watch as it syncs with your energy state.
                    </p>
                  </div>
                  
                  <div className="py-8">
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
                    >
                      <BioOrb size="xl" showLabel />
                    </motion.div>
                  </div>
                  
                  <motion.div
                    className="space-y-3 text-left"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-white/5">
                      <Check className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Energy Level</p>
                        <p className="font-medium">{energyLevel}/5</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-white/5">
                      <Check className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">North Star</p>
                        <p className="font-medium truncate max-w-[200px]">{localNorthStar || northStar}</p>
                      </div>
                    </div>
                  </motion.div>
                  
                  <div className="mt-8 pt-6 border-t border-border/50 flex gap-3">
                    <Button 
                      variant="outline"
                      onClick={handleBack} 
                      className="haptic py-6 rounded-xl px-6"
                      disabled={isSubmitting}
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <Button 
                      onClick={handleComplete} 
                      className="flex-1 haptic py-6 text-lg rounded-xl bg-primary hover:bg-primary/90"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Finalizing...' : 'Enter Dashboard'}
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;