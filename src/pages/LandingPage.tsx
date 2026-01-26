import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Brain,
  Battery,
  Target,
  ArrowRight,
  Zap,
  Clock,
  BarChart3,
  User,
  Mail,
  Lock,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";
import BioOrb from '@/components/BioOrb';
import GlassCard from '@/components/GlassCard';
import { EnergyProvider, useEnergy } from '@/contexts/EnergyContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: Brain,
    title: 'Cognitive Awareness',
    description: 'Track your mental energy in real-time and align tasks with your natural rhythms.',
  },
  {
    icon: Battery,
    title: 'Smart Task Matching',
    description: 'AI-powered suggestions that match task difficulty to your current energy state.',
  },
  {
    icon: Target,
    title: 'North Star Focus',
    description: 'Set your daily priority and let the system guide you toward what matters most.',
  },
  {
    icon: BarChart3,
    title: 'Flow Analytics',
    description: 'Understand your productivity patterns and optimize your schedule over time.',
  },
];

const LandingPageContent: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const { setEnergyLevel, energyState } = useEnergy();

  // Destructure the fixed context values
  const { isAuthenticated, user, loading, isOnboardingCompleted, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const backgroundOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.5]);

  const [currentDemoState, setCurrentDemoState] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // FIXED REDIRECT LOGIC
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (isOnboardingCompleted) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    }
  }, [isAuthenticated, user, loading, isOnboardingCompleted, navigate]);

  // Scroll-triggered energy state changes for demo
  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (v) => {
      if (v < 0.3) {
        setEnergyLevel(2);
        setCurrentDemoState(0);
      } else if (v < 0.6) {
        setEnergyLevel(3);
        setCurrentDemoState(1);
      } else {
        setEnergyLevel(5);
        setCurrentDemoState(2);
      }
    });
    return () => unsubscribe();
  }, [scrollYProgress, setEnergyLevel]);

  // Show loading spinner while AuthContext is initializing
  // This prevents the "Flash of Unauthenticated Content"
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <motion.div
          className="w-12 h-12 rounded-full border-t-2 border-primary"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="mt-4 text-muted-foreground animate-pulse font-medium">Initializing DaySense...</p>
      </div>
    );
  }


  const getMeshClass = () => {
    switch (energyState) {
      case 'recharge': return 'mesh-recharge';
      case 'flow': return 'mesh-flow';
      case 'focus': return 'mesh-focus';
      default: return 'mesh-flow';
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Strict Client-Side Validation
    if (!email.trim() || !password.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (authMode === 'signup' && !fullName.trim()) {
      toast.error("Please enter your full name.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setAuthLoading(true);

    try {
      if (authMode === 'signup') {
        await signUp(email, password, fullName);
        toast.success("Account created! Redirecting...");
      } else {
        await signIn(email, password);
        toast.success("Welcome back!");
      }

      // Close modal - navigation happens via useEffect
      setShowAuthModal(false);
    } catch (error: any) {
      console.error(`Error ${authMode === 'signup' ? 'signing up' : 'signing in'}:`, error);

      let errorMessage = "An error occurred. Please try again.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "Invalid email or password.";
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Email is already registered.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed attempts. Try again later.";
      }

      toast.error(errorMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="relative min-h-[300vh]">
      {/* Animated Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={energyState}
          className={cn('fixed inset-0 -z-10', getMeshClass())}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        />
      </AnimatePresence>

      {/* Hero Section */}
      <motion.section
        className="min-h-screen flex flex-col items-center justify-center px-4 pt-20"
        style={{ opacity: backgroundOpacity }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              AI-Powered Productivity
            </span>
          </motion.div>

          {/* Main Heading */}
          <h1 className="heading-display mb-6">
            <span className="text-foreground">Your energy is </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={energyState}
                className={cn(
                  energyState === 'recharge' && 'text-gradient-recharge',
                  energyState === 'flow' && 'text-gradient-flow',
                  energyState === 'focus' && 'text-gradient-focus'
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                {energyState === 'recharge' && 'precious'}
                {energyState === 'flow' && 'balanced'}
                {energyState === 'focus' && 'powerful'}
              </motion.span>
            </AnimatePresence>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12">
            DaySense adapts to your cognitive rhythms. Work smarter, not harder,
            by matching tasks to your natural energy flow.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="haptic text-lg px-8 py-6 rounded-2xl"
              onClick={() => {
                setAuthMode('signup');
                setShowAuthModal(true);
              }}
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="haptic text-lg px-8 py-6 rounded-2xl glass"
              onClick={() => {
                setAuthMode('login');
                setShowAuthModal(true);
              }}
            >
              Sign In
            </Button>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2">
            <motion.div
              className="w-1.5 h-3 bg-muted-foreground/50 rounded-full"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Scroll to explore
          </p>
        </motion.div>
      </motion.section>

      {/* Theme Demo Section */}
      <section className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="heading-hero mb-4">
              Three states. One purpose.
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Watch the interface transform as you scroll. DaySense adapts its entire
              aesthetic to match your energy state.
            </p>
          </motion.div>

          {/* Bio Orb Demo */}
          <div className="flex justify-center mb-16">
            <BioOrb size="xl" showLabel />
          </div>

          {/* State Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {['recharge', 'flow', 'focus'].map((state, index) => (
              <motion.div
                key={state}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <GlassCard
                  className={cn(
                    'text-center transition-all duration-300',
                    currentDemoState === index && 'ring-2 ring-primary scale-105'
                  )}
                >
                  <div className={cn(
                    'w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center',
                    state === 'recharge' && 'bg-gradient-to-br from-amber-400 to-orange-500',
                    state === 'flow' && 'bg-gradient-to-br from-teal-400 to-emerald-500',
                    state === 'focus' && 'bg-gradient-to-br from-violet-500 to-purple-600'
                  )}>
                    {state === 'recharge' && <Battery className="w-8 h-8 text-white" />}
                    {state === 'flow' && <Clock className="w-8 h-8 text-white" />}
                    {state === 'focus' && <Zap className="w-8 h-8 text-white" />}
                  </div>
                  <h3 className="text-xl font-bold capitalize mb-2">{state}</h3>
                  <p className="text-sm text-muted-foreground">
                    {state === 'recharge' && 'Warm tones. Rest & recover.'}
                    {state === 'flow' && 'Cool balance. Steady progress.'}
                    {state === 'focus' && 'Deep tones. Peak performance.'}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="min-h-screen flex items-center px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="heading-hero mb-4">
              Designed for humans, not machines
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Every feature is built around understanding and optimizing your
              natural cognitive patterns.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                <GlassCard className="h-full">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-2xl bg-primary/10">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* Final CTA */}
          <motion.div
            className="text-center mt-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Button
              size="lg"
              className="haptic text-lg px-12 py-6 rounded-2xl"
              onClick={() => {
                setAuthMode('signup');
                setShowAuthModal(true);
              }}
            >
              Begin Your Journey
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              className="glass-card w-full max-w-md p-6 rounded-2xl bg-background/80"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {authMode === 'login' ? 'Sign In' : 'Sign Up'}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAuthModal(false)}
                >
                  ✕
                </Button>
              </div>

              <form onSubmit={handleAuthSubmit}>
                {authMode === 'signup' && (
                  <div className="mb-4">
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        placeholder="John Doe"
                        className="pl-10"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required={authMode === 'signup'}
                      />
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={authLoading}
                  >
                    {authLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </div>
                    ) : (authMode === 'login' ? 'Sign In' : 'Sign Up')}
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm"
                    onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  >
                    {authMode === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LandingPage: React.FC = () => {
  return (
    <EnergyProvider>
      <LandingPageContent />
    </EnergyProvider>
  );
};

export default LandingPage;