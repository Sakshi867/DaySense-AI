import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, User, Bell, Palette, Lock, HelpCircle, Moon, Sun, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import MeshBackground from '@/components/layout/MeshBackground';
import GlassCard from '@/components/GlassCard';
import { useEnergy } from '@/contexts/EnergyContext';
import { useAuth } from '@/contexts/AuthContext';
import { profileService } from '@/services/firebaseService';
import { cn } from '@/lib/utils';

const SettingsPage: React.FC = () => {
  const { energyLevel, energyState } = useEnergy();
  const { user, updateUser } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
  
  useEffect(() => {
    if (user) {
      setUserName(user.full_name || '');
      setEmail(user.email || '');
      setBio(user.bio || '');
      // Set initial notification preferences from user profile if stored
      setNotifications(user.notifications_enabled ?? true);
      setDailyCheckins(user.daily_checkins_enabled ?? true);
      setTaskReminders(user.task_reminders_enabled ?? true);
      setFocusSessions(user.focus_sessions_enabled ?? false);
      // Set initial theme preferences from user profile if stored
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
        await profileService.updateProfile(user.id, {
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
        });
        
        // Apply theme changes immediately
        applyThemeChanges(darkMode, highContrast, largeText, selectedTheme);
        
        // Show success notification
        console.log('Profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      // Show error notification
    }
  };
  
  // Apply theme changes to the document
  const applyThemeChanges = (dark: boolean, highContrast: boolean, largeText: boolean, theme: string = 'Default') => {
    // Apply dark/light mode
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Apply high contrast mode
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    
    // Apply large text mode
    if (largeText) {
      document.documentElement.style.fontSize = '1.125rem'; // 18px
    } else {
      document.documentElement.style.fontSize = ''; // Reset to default
    }
    
    // Apply theme colors
    applyThemeColors(theme, dark);
  };
  
  // Apply theme color changes
  const applyThemeColors = (theme: string, darkMode: boolean) => {
    // Define theme color mappings
    const themeColors: Record<string, { primary: string, secondary: string }> = {
      'Default': { primary: '220 20% 15%', secondary: '220 15% 92%' },
      'Blue': { primary: '210 95% 50%', secondary: '210 90% 90%' },
      'Green': { primary: '160 84% 39%', secondary: '160 70% 90%' },
      'Purple': { primary: '258 90% 66%', secondary: '258 80% 90%' },
      'Orange': { primary: '38 92% 50%', secondary: '38 80% 90%' }
    };
    
    const colors = themeColors[theme] || themeColors['Default'];
    
    // Apply theme colors as CSS variables
    document.documentElement.style.setProperty('--theme-primary', colors.primary);
    document.documentElement.style.setProperty('--theme-primary-foreground', '0 0% 100%');
    document.documentElement.style.setProperty('--theme-secondary', colors.secondary);
    document.documentElement.style.setProperty('--theme-secondary-foreground', darkMode ? '220 10% 90%' : '220 20% 15%');
    
    // Add/remove theme-primary class based on theme selection
    if (theme !== 'Default') {
      document.documentElement.classList.add('theme-primary', 'theme-secondary');
    } else {
      document.documentElement.classList.remove('theme-primary', 'theme-secondary');
    }

  };
  
  // Apply initial theme when settings change
  useEffect(() => {
    applyThemeChanges(darkMode, highContrast, largeText, selectedTheme);
  }, [darkMode, highContrast, largeText, selectedTheme]);

  return (
    <div className="min-h-screen relative">
      <MeshBackground />
      
      {/* Sidebar */}
      <DashboardSidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      {/* Main Content */}
      <main className={cn(
        'min-h-screen transition-all duration-300',
        sidebarCollapsed ? 'pl-20' : 'pl-64'
      )}>
        <div className="p-6 lg:p-8 max-w-4xl mx-auto">
          {/* Header */}
          <motion.header
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Settings
                </h1>
                <p className="text-muted-foreground">
                  Customize your DaySense experience
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Settings className="w-5 h-5 text-primary" />
                </div>
              </div>
            </div>
          </motion.header>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Navigation */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <GlassCard className="p-5">
                <nav className="space-y-2">
                  {[
                    { icon: User, label: 'Profile', active: true },
                    { icon: Palette, label: 'Appearance' },
                    { icon: Bell, label: 'Notifications' },
                    { icon: Lock, label: 'Privacy' },
                    { icon: HelpCircle, label: 'Help & Support' }
                  ].map((item, index) => (
                    <button
                      key={item.label}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors',
                        'hover:bg-accent/50',
                        item.active && 'bg-accent text-accent-foreground'
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  ))}
                </nav>
              </GlassCard>
            </motion.div>
            
            {/* Main Settings Content */}
            <motion.div 
              className="lg:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="space-y-6">
                {/* Profile Settings */}
                <GlassCard className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <User className="w-5 h-5 text-foreground" />
                    <h2 className="text-xl font-bold">Profile Settings</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-5">
                    <Label htmlFor="bio">Bio</Label>
                    <Input
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      className="mt-2"
                    />
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <Button onClick={handleSaveChanges}>Save Changes</Button>
                  </div>
                </GlassCard>
                
                {/* Notification Settings */}
                <GlassCard className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Bell className="w-5 h-5 text-foreground" />
                    <h2 className="text-xl font-bold">Notification Settings</h2>
                  </div>
                  
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Enable Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive alerts and reminders</p>
                      </div>
                      <Switch checked={notifications} onCheckedChange={setNotifications} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Daily Check-ins</Label>
                        <p className="text-sm text-muted-foreground">Remind to log energy levels</p>
                      </div>
                      <Switch checked={dailyCheckins} onCheckedChange={setDailyCheckins} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Task Reminders</Label>
                        <p className="text-sm text-muted-foreground">Get notified about upcoming tasks</p>
                      </div>
                      <Switch checked={taskReminders} onCheckedChange={setTaskReminders} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Focus Sessions</Label>
                        <p className="text-sm text-muted-foreground">Alerts when focus sessions end</p>
                      </div>
                      <Switch checked={focusSessions} onCheckedChange={setFocusSessions} />
                    </div>
                  </div>
                </GlassCard>
                
                {/* Appearance Settings */}
                <GlassCard className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Palette className="w-5 h-5 text-foreground" />
                    <h2 className="text-xl font-bold">Appearance Settings</h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Dark Mode</Label>
                        <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
                      </div>
                      <Switch checked={darkMode} onCheckedChange={(checked) => {
                        setDarkMode(checked);
                        applyThemeChanges(checked, highContrast, largeText, selectedTheme);
                      }} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Auto-Sync Theme</Label>
                        <p className="text-sm text-muted-foreground">Match your system preference</p>
                      </div>
                      <Switch checked={autoSync} onCheckedChange={setAutoSync} />
                    </div>
                    
                    <div className="pt-6 mt-4 border-t border-border/50">
                      <Label className="font-medium mb-4 block">Theme Colors</Label>
                      
                      <div className="grid grid-cols-5 gap-4">
                        {[
                          { name: 'Default', bg: 'bg-primary', border: 'border-primary' },
                          { name: 'Blue', bg: 'bg-blue-500', border: 'border-blue-500' },
                          { name: 'Green', bg: 'bg-green-500', border: 'border-green-500' },
                          { name: 'Purple', bg: 'bg-purple-500', border: 'border-purple-500' },
                          { name: 'Orange', bg: 'bg-orange-500', border: 'border-orange-500' }
                        ].map((theme) => (
                          <button
                            key={theme.name}
                            className={`text-center cursor-pointer transition-all ${
                              selectedTheme === theme.name
                                ? 'scale-110 ring-2 ring-primary ring-offset-2'
                                : 'opacity-70 hover:opacity-100'
                            }`}
                            onClick={() => {
                              setSelectedTheme(theme.name);
                              applyThemeChanges(darkMode, highContrast, largeText, theme.name);
                            }}
                          >
                            <div className="flex justify-center mb-1">
                              <div className={`w-8 h-8 rounded-full ${theme.bg} border-2 ${theme.border} flex items-center justify-center`}>
                                {theme.name.charAt(0)}
                              </div>
                            </div>
                            <span className="text-xs">{theme.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </GlassCard>
                
                {/* Accessibility Settings */}
                <GlassCard className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Volume2 className="w-5 h-5 text-foreground" />
                    <h2 className="text-xl font-bold">Accessibility</h2>
                  </div>
                  
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Sound Effects</Label>
                        <p className="text-sm text-muted-foreground">Enable sound notifications</p>
                      </div>
                      <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">High Contrast Mode</Label>
                        <p className="text-sm text-muted-foreground">Increase contrast for better visibility</p>
                      </div>
                      <Switch checked={highContrast} onCheckedChange={(checked) => {
                        setHighContrast(checked);
                        applyThemeChanges(darkMode, checked, largeText, selectedTheme);
                      }} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Large Text Mode</Label>
                        <p className="text-sm text-muted-foreground">Increase text size throughout app</p>
                      </div>
                      <Switch checked={largeText} onCheckedChange={(checked) => {
                        setLargeText(checked);
                        applyThemeChanges(darkMode, highContrast, checked, selectedTheme);
                      }} />
                    </div>
                  </div>
                </GlassCard>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;