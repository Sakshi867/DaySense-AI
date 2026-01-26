import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Sparkles, Target, Check, AlertCircle, Sun, Moon, Zap, Clock, LogOut } from 'lucide-react';
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
  const { user, updateUser, isOnboardingCompleted, loading, signOut } = useAuth();

  const [step, setStep] = useState(1);
  const [localNorthStar, setLocalNorthStar] = useState(northStar || '');
  const [chronotype, setChronotype] = useState<'morning' | 'afternoon' | 'evening' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Safety Timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading && !user) setTimedOut(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [loading, user]);

  // Redirect if already completed
  useEffect(() => {
    if (!loading && isOnboardingCompleted) {
      navigate('/dashboard');
    }
  }, [isOnboardingCompleted, loading, navigate]);

  const totalSteps = 4;

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
        chronotype: chronotype || 'morning', // Default fallback
        onboarding_completed: true
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      setIsSubmitting(false);
    }
  };

  const stepVariants = {
    enter: { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  const chronotypes = [
    {
      id: 'morning',
      label: 'Early Bird',
      description: 'You feel most energetic and focused in the morning.',
      icon: Sun,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10 border-amber-400/20'
    },
    {
      id: 'afternoon',
      label: 'Power Player',
      description: 'Your peak performance hits in the afternoon.',
      icon: Zap,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10 border-orange-500/20'
    },
    {
      id: 'evening',
      label: 'Night Owl',
      description: 'You come alive when the sun goes down.',
      icon: Moon,
      color: 'text-indigo-400',
      bg: 'bg-indigo-400/10 border-indigo-400/20'
    }
  ];

  // 1. FAST LOADING STATE
  if (loading && !user && !timedOut) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground animate-pulse text-sm font-medium">Synchronizing Profile...</p>
      </div>
    );
  }

  // 2. TIMEOUT STATE
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

  // 3. ACTUAL UI
  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      <MeshBackground />

      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative z-10">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>

        <div className="w-full max-w-lg">

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 mb-12">
            {[1, 2, 3, 4].map((s) => (
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
                transition={{ duration: 0.3 }}
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
                transition={{ duration: 0.3 }}
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
                      autoFocus
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
                transition={{ duration: 0.3 }}
              >
                <GlassCard className="text-center" variant="elevated">
                  <div className="mb-6">
                    <motion.div
                      className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Clock className="w-8 h-8 text-white animate-[spin_3s_linear_infinite]" style={{ animationDuration: '10s' }} />
                    </motion.div>
                    <h2 className="text-2xl font-bold mb-2">
                      When is your peak energy?
                    </h2>
                    <p className="text-muted-foreground">
                      This helps us schedule your optimal tasks.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {chronotypes.map((type) => (
                      <motion.button
                        key={type.id}
                        className={cn(
                          "w-full p-4 rounded-xl flex items-center gap-4 text-left border transition-all relative overflow-hidden",
                          chronotype === type.id
                            ? `${type.bg} ring-2 ring-primary border-primary`
                            : "bg-muted/30 border-white/5 hover:bg-muted/50"
                        )}
                        onClick={() => setChronotype(type.id as any)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className={cn("p-2 rounded-full bg-white/10", type.color)}>
                          <type.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{type.label}</h3>
                          <p className="text-xs text-muted-foreground">{type.description}</p>
                        </div>
                        {chronotype === type.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                          >
                            <Check className="w-3.5 h-3.5 text-white" />
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
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
                      disabled={!chronotype}
                    >
                      Continue
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <GlassCard className="text-center" variant="elevated">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-2">
                      Your Bio-Orb is calibrating...
                    </h2>
                    <p className="text-muted-foreground">
                      Syncing with your energy state and chronotype.
                    </p>
                  </div>

                  <div className="py-8 relative">
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
                    >
                      <BioOrb size="xl" showLabel />
                    </motion.div>

                    {/* Confetti effect placeholder */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      {/* This could be a canvas or just css particles later */}
                    </div>
                  </div>

                  <motion.div
                    className="space-y-3 text-left"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-white/5">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Energy Level</p>
                        <p className="font-medium">{energyLevel}/5</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-white/5">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Target className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">North Star</p>
                        <p className="font-medium truncate max-w-[200px]">{localNorthStar || northStar}</p>
                      </div>
                    </div>
                    {chronotype && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-white/5">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Peak Energy</p>
                          <p className="font-medium capitalize">{chronotype === 'morning' ? 'Early Bird' : chronotype === 'afternoon' ? 'Power Player' : 'Night Owl'}</p>
                        </div>
                      </div>
                    )}
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
                      className="flex-1 haptic py-6 text-lg rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
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