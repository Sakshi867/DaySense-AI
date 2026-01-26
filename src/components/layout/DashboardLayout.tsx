import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardSidebar from './DashboardSidebar';
import MeshBackground from './MeshBackground';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const location = useLocation();

    // Handle window resize for mobile detection
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    return (
        <div className="min-h-screen relative overflow-x-hidden">
            <MeshBackground />

            {/* Mobile Header */}
            <header className="fixed top-0 left-0 right-0 h-16 glass border-b border-border/50 z-40 flex items-center justify-between px-4 lg:hidden">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary font-bold text-xs">DS</span>
                    </div>
                    <span className="font-bold text-lg">DaySense</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileMenuOpen(true)}
                >
                    <Menu className="w-6 h-6" />
                </Button>
            </header>

            {/* Sidebar - Desktop and Mobile version */}
            <DashboardSidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                isMobile={isMobile}
                isOpen={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
            />

            {/* Main Content */}
            <main className={cn(
                'min-h-screen transition-all duration-300 ease-in-out',
                'pt-16 lg:pt-0', // Top padding for mobile header
                isMobile ? 'pl-0' : (sidebarCollapsed ? 'pl-20' : 'pl-64')
            )}>
                <div className="w-full">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
