import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  BarChart3, 
  Settings, 
  User,
  Sparkles,
  LogOut,
  ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEnergy } from '@/contexts/EnergyContext';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/firebaseService';
import EnergyGauge from '@/components/EnergyGauge';
import BioOrb from '@/components/BioOrb';

interface DashboardSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: CheckSquare, label: 'Tasks', path: '/dashboard/tasks' },
  { icon: BarChart3, label: 'Analytics', path: '/dashboard/analytics' },
  { icon: Sparkles, label: 'AI Coach', path: '/dashboard/coach' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
];

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ 
  collapsed = false,
  onToggle 
}) => {
  const location = useLocation();
  const { energyState } = useEnergy();
  const { signOut } = useAuth();
  
  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  return (
    <motion.aside
      className={cn(
        'fixed left-0 top-0 h-screen glass border-r border-border/50 z-40',
        'flex flex-col',
        collapsed ? 'w-20' : 'w-64'
      )}
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className={cn(
        'p-4 border-b border-border/50',
        collapsed ? 'flex justify-center' : ''
      )}>
        {collapsed ? (
          <BioOrb size="sm" />
        ) : (
          <div className="flex items-center gap-3">
            <BioOrb size="sm" />
            <div>
              <h1 className="font-bold text-lg text-foreground">DaySense</h1>
              <p className="text-xs text-muted-foreground capitalize">{energyState} Mode</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Live Energy Gauge */}
      <div className={cn(
        'p-4 border-b border-border/50',
        collapsed ? 'flex justify-center' : ''
      )}>
        {collapsed ? (
          <EnergyGauge size="sm" showLabel={false} vertical />
        ) : (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              Live Energy
            </p>
            <EnergyGauge size="md" />
          </div>
        )}
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}>
              <motion.div
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors',
                  'hover:bg-accent/50',
                  isActive && 'bg-accent text-accent-foreground',
                  collapsed && 'justify-center'
                )}
                whileHover={{ x: collapsed ? 0 : 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <item.icon className={cn(
                  'w-5 h-5',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )} />
                {!collapsed && (
                  <span className={cn(
                    'text-sm font-medium',
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {item.label}
                  </span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>
      
      {/* Footer */}
      <div className="p-3 border-t border-border/50 space-y-1">
        <button
          onClick={onToggle}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl',
            'hover:bg-accent/50 transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <ChevronLeft className={cn(
            'w-5 h-5 text-muted-foreground transition-transform',
            collapsed && 'rotate-180'
          )} />
          {!collapsed && (
            <span className="text-sm font-medium text-muted-foreground">
              Collapse
            </span>
          )}
        </button>
        
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl',
            'hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && (
            <span className="text-sm font-medium">Sign Out</span>
          )}
        </button>
      </div>
    </motion.aside>
  );
};

export default DashboardSidebar;
