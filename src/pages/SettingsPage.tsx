import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, User, Bell, Palette, Lock, HelpCircle, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/components/layout/DashboardLayout';
import GlassCard from '@/components/GlassCard';
import { useEnergy } from '@/contexts/EnergyContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [dailyCheckins, setDailyCheckins] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [focusSessions, setFocusSessions] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('Default');

  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (user) {
      setUserName(user.full_name || '');
      setEmail(user.email || '');
      setBio(user.bio || '');
      setNotifications(user.notifications_enabled ?? true);
      setDailyCheckins(user.daily_checkins_enabled ?? true);
      setTaskReminders(user.task_reminders_enabled ?? true);
      setFocusSessions(user.focus_sessions_enabled ?? false);
      setDarkMode(user.dark_mode_enabled ?? true);
      setSoundEnabled(user.sound_effects_enabled ?? true);
      setAutoSync(user.auto_sync_theme_enabled ?? true);
      setHighContrast(user.high_contrast_enabled ?? false);
      setLargeText(user.large_text_enabled ?? false);
      setSelectedTheme(user.theme_color ?? 'Default');
    }
  }, [user]);

  const handleSaveChanges = async () => {
    try {
      if (user) {
        const profileData = {
          full_name: userName,
          email: email,
          bio: bio,
          notifications_enabled: notifications,
          daily_checkins_enabled: dailyCheckins,
          task_reminders_enabled: taskReminders,
          focus_sessions_enabled: focusSessions,
          dark_mode_enabled: darkMode,
          sound_effects_enabled: soundEnabled,
          auto_sync_theme_enabled: autoSync,
          high_contrast_enabled: highContrast,
          large_text_enabled: largeText,
          theme_color: selectedTheme
        };

        await updateUser(profileData);
        applyThemeChanges(darkMode, highContrast, largeText, selectedTheme);
        alert('Settings saved successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to save settings.');
    }
  };

  const handleDownloadData = () => {
    if (!user) return;
    const userData = {
      profile: user,
      timestamp: new Date().toISOString(),
      app: 'DaySense AI'
    };
    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DaySense_UserData_${user.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const applyThemeChanges = (dark: boolean, highContrast: boolean, largeText: boolean, theme: string = 'Default') => {
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    if (highContrast) document.documentElement.classList.add('high-contrast');
    else document.documentElement.classList.remove('high-contrast');

    if (largeText) document.documentElement.style.fontSize = '1.125rem';
    else document.documentElement.style.fontSize = '';

    applyThemeColors(theme, dark);
  };

  const applyThemeColors = (theme: string, darkMode: boolean) => {
    const themeColors: Record<string, { primary: string, secondary: string }> = {
      'Default': { primary: '220 20% 15%', secondary: '220 15% 92%' },
      'Blue': { primary: '210 95% 50%', secondary: '210 90% 90%' },
      'Green': { primary: '160 84% 39%', secondary: '160 70% 90%' },
      'Purple': { primary: '258 90% 66%', secondary: '258 80% 90%' },
      'Orange': { primary: '38 92% 50%', secondary: '38 80% 90%' }
    };

    const colors = themeColors[theme] || themeColors['Default'];
    document.documentElement.style.setProperty('--theme-primary', colors.primary);
    document.documentElement.style.setProperty('--theme-primary-foreground', '0 0% 100%');
    document.documentElement.style.setProperty('--theme-secondary', colors.secondary);
    document.documentElement.style.setProperty('--theme-secondary-foreground', darkMode ? '220 10% 90%' : '220 20% 15%');

    if (theme !== 'Default') document.documentElement.classList.add('theme-primary', 'theme-secondary');
    else document.documentElement.classList.remove('theme-primary', 'theme-secondary');
  };

  useEffect(() => {
    applyThemeChanges(darkMode, highContrast, largeText, selectedTheme);
  }, [darkMode, highContrast, largeText, selectedTheme]);

  const navItems = [
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'appearance', icon: Palette, label: 'Appearance' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'accessibility', icon: Volume2, label: 'Accessibility' },
    { id: 'privacy', icon: Lock, label: 'Privacy & Security' },
    { id: 'support', icon: HelpCircle, label: 'Help & Support' }
  ];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <motion.header
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Settings
              </h1>
              <p className="text-muted-foreground text-sm">
                Customize your DaySense experience
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
              <Settings className="w-6 h-6 text-primary" />
            </div>
          </div>
        </motion.header>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Internal Navigation */}
          <motion.div
            className="w-full lg:w-64 shrink-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="p-4 overflow-x-auto lg:overflow-visible sticky lg:top-8 scrollbar-hide">
              <nav className="flex lg:flex-col gap-2 min-w-max lg:min-w-0">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 whitespace-nowrap',
                      'hover:bg-accent/50 group shrink-0',
                      activeTab === item.id ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground'
                    )}
                  >
                    <item.icon className={cn(
                      'w-4 h-4 md:w-5 md:h-5 transition-transform duration-200',
                      activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'
                    )} />
                    <span className="text-xs md:text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>
            </GlassCard>
          </motion.div>

          {/* Main Settings Content */}
          <motion.div
            className="flex-1 min-w-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="space-y-6 min-h-[450px]">
              {/* Profile Settings */}
              {activeTab === 'profile' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <GlassCard className="p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <h2 className="text-xl font-bold">Profile Details</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-semibold">Full Name</Label>
                        <Input
                          id="name"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          className="bg-white/5 border-white/10 rounded-xl h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-white/5 border-white/10 rounded-xl h-12"
                        />
                      </div>
                    </div>

                    <div className="mt-6 space-y-2">
                      <Label htmlFor="bio" className="text-sm font-semibold">Short Bio</Label>
                      <Input
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Optimizing my cognitive load..."
                        className="bg-white/5 border-white/10 rounded-xl h-12"
                      />
                    </div>

                    <div className="mt-10 flex flex-col sm:flex-row justify-end gap-3">
                      <Button onClick={handleSaveChanges} className="h-12 rounded-xl px-8 shadow-lg shadow-primary/20">
                        Update Profile
                      </Button>
                    </div>
                  </GlassCard>
                </motion.div>
              )}

              {/* Notification Settings */}
              {activeTab === 'notifications' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <GlassCard className="p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500">
                        <Bell className="w-5 h-5" />
                      </div>
                      <h2 className="text-xl font-bold">Alert Preferences</h2>
                    </div>

                    <div className="space-y-1">
                      {[
                        { id: 'notif', label: 'Push Notifications', desc: 'Alerts and real-time reminders', state: notifications, setState: setNotifications },
                        { id: 'checkin', label: 'Energy Check-ins', desc: 'Periodic logs of focus levels', state: dailyCheckins, setState: setDailyCheckins },
                        { id: 'task', label: 'Task Reminders', desc: 'Upcoming deadlines or focus cues', state: taskReminders, setState: setTaskReminders },
                        { id: 'focus', label: 'Flow Session Alerts', desc: 'End of focus timer alerts', state: focusSessions, setState: setFocusSessions }
                      ].map((item, idx) => (
                        <div key={item.id} className={cn(
                          "flex items-center justify-between p-4 transition-colors",
                          idx !== 0 && "border-t border-white/5"
                        )}>
                          <div className="pr-4">
                            <Label className="font-semibold text-sm md:text-base">{item.label}</Label>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                          </div>
                          <Switch checked={item.state} onCheckedChange={item.setState} />
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 flex justify-end">
                      <Button onClick={handleSaveChanges} className="h-11 rounded-xl px-6 bg-primary/80 hover:bg-primary">Save Alerts</Button>
                    </div>
                  </GlassCard>
                </motion.div>
              )}

              {/* Appearance Settings */}
              {activeTab === 'appearance' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <GlassCard className="p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <Palette className="w-5 h-5" />
                      </div>
                      <h2 className="text-xl font-bold">Visual Themes</h2>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between px-2">
                        <div>
                          <Label className="font-semibold">Dark Mode</Label>
                          <p className="text-xs text-muted-foreground">High contrast for eye comfort</p>
                        </div>
                        <Switch checked={darkMode} onCheckedChange={(checked) => {
                          setDarkMode(checked);
                          applyThemeChanges(checked, highContrast, largeText, selectedTheme);
                        }} />
                      </div>

                      <div className="px-2">
                        <Label className="font-semibold mb-6 block text-center sm:text-left">Color Palette</Label>

                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-6">
                          {[
                            { name: 'Default', bg: 'bg-primary', border: 'border-primary' },
                            { name: 'Blue', bg: 'bg-blue-500', border: 'border-blue-500' },
                            { name: 'Green', bg: 'bg-green-500', border: 'border-green-500' },
                            { name: 'Purple', bg: 'bg-purple-500', border: 'border-purple-500' },
                            { name: 'Orange', bg: 'bg-orange-500', border: 'border-orange-500' }
                          ].map((theme) => (
                            <button
                              key={theme.name}
                              className="group flex flex-col items-center gap-2 outline-none"
                              onClick={() => {
                                setSelectedTheme(theme.name);
                                applyThemeChanges(darkMode, highContrast, largeText, theme.name);
                              }}
                            >
                              <div className={cn(
                                "w-10 h-10 rounded-full border-2 transition-all duration-300 flex items-center justify-center p-0.5 shadow-sm",
                                theme.border, theme.bg,
                                selectedTheme === theme.name ? "ring-4 ring-primary/20 scale-110" : "opacity-80 group-hover:opacity-100"
                              )}>
                                {selectedTheme === theme.name && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-widest">{theme.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-10 flex justify-end">
                      <Button onClick={handleSaveChanges} className="h-11 rounded-xl px-6 bg-primary/80 hover:bg-primary">Apply Theme</Button>
                    </div>
                  </GlassCard>
                </motion.div>
              )}

              {/* Accessibility Settings */}
              {activeTab === 'accessibility' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <GlassCard className="p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                        <Volume2 className="w-5 h-5" />
                      </div>
                      <h2 className="text-xl font-bold">Inclusive Controls</h2>
                    </div>

                    <div className="space-y-4">
                      {[
                        { label: 'Feedback Sounds', desc: 'Audio cues for task completions', state: soundEnabled, setState: setSoundEnabled },
                        {
                          label: 'High Contrast', desc: 'Bold text and high-visibility inputs', state: highContrast,
                          setState: (val: boolean) => { setHighContrast(val); applyThemeChanges(darkMode, val, largeText, selectedTheme); }
                        },
                        {
                          label: 'Responsive Text', desc: 'Upscale typography for readability', state: largeText,
                          setState: (val: boolean) => { setLargeText(val); applyThemeChanges(darkMode, highContrast, val, selectedTheme); }
                        }
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                          <div className="pr-4">
                            <Label className="font-semibold text-sm md:text-base">{item.label}</Label>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                          </div>
                          <Switch checked={item.state} onCheckedChange={item.setState} />
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 flex justify-end">
                      <Button onClick={handleSaveChanges} className="h-11 rounded-xl px-6 bg-primary/80 hover:bg-primary">Sync Settings</Button>
                    </div>
                  </GlassCard>
                </motion.div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <GlassCard className="p-8 md:p-12 text-center overflow-hidden">
                    <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-6 transform hover:rotate-12 transition-transform duration-500">
                      <Lock className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3">Your Privacy Matters</h2>
                    <p className="text-muted-foreground max-w-sm mx-auto mb-10 text-sm leading-relaxed">
                      Control your DaySense data footprint. Download your records or manage your presence on the platform.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button variant="outline" onClick={handleDownloadData} className="rounded-xl h-12 px-6 border-white/10 hover:bg-white/5">
                        Download JSON Data
                      </Button>
                      <Button variant="destructive" onClick={() => alert('Request sent.')} className="rounded-xl h-12 px-6">
                        Delete Account
                      </Button>
                    </div>
                  </GlassCard>
                </motion.div>
              )}

              {/* Support Tab */}
              {activeTab === 'support' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <GlassCard className="p-8 md:p-12 text-center">
                    <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-6">
                      <HelpCircle className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3">Concierge Support</h2>
                    <p className="text-muted-foreground max-w-sm mx-auto mb-10 text-sm leading-relaxed">
                      Having trouble? Our optimization specialists are available to help you get the most out of your day.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button variant="outline" onClick={() => window.open('mailto:support@daysense.ai')} className="rounded-xl h-12 px-8">
                        Email Specialist
                      </Button>
                      <Button onClick={() => setActiveTab('profile')} className="rounded-xl h-12 px-8 shadow-lg shadow-primary/20">
                        View Documentation
                      </Button>
                    </div>
                  </GlassCard>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;