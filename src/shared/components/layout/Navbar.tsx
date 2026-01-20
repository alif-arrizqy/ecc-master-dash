import { NavLink } from '@/components/NavLink';
import { LayoutDashboard, Menu, X, ChevronDown, BarChart3, Wrench, Activity, Database, MapPin } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { useLocation } from 'react-router-dom';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  const navItems = [
    { 
      to: '/', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      hasChildren: false
    },
    {
      label: 'Monitoring',
      icon: Activity,
      hasChildren: false,
      to: '/monitoring'
    },
    {
      label: 'Sites',
      icon: MapPin,
      hasChildren: false,
      to: '/sites'
    },
    {
      label: 'SLA',
      icon: BarChart3,
      hasChildren: true,
      children: [
        { 
          label: 'SLA Bakti', 
          hasChildren: true,
          children: [
            { to: '/sla-bakti/upload', label: 'Upload File Excel' },
            { to: '/sla-bakti/master', label: 'SLA Master Data' },
            { to: '/sla-bakti/problem', label: 'SLA Problem' },
            { to: '/sla-bakti/reason', label: 'SLA Reason' },
            { to: '/sla-bakti/history-gamas', label: 'History GAMAS' },
            { to: '/sla-bakti/raw', label: 'Raw SLA' },
          ]
        },
        { 
          label: 'SLA Internal', 
          hasChildren: true,
          children: [
            { to: '/sla-internal/1', label: 'SLA 1' },
            { to: '/sla-internal/2', label: 'SLA 2' },
            { to: '/sla-internal/3', label: 'SLA 3' },
          ]
        },
      ]
    },
    {
      label: 'Tools',
      icon: Wrench,
      hasChildren: true,
      children: [
        { to: '/tools/tickets', label: 'Tickets' },
        { to: '/tools/tracking', label: 'Tracking' },
        { to: '/tools/x', label: 'Menu X' },
      ]
    },
  ];

  const isActiveParent = (item: typeof navItems[0]) => {
    if (!item.hasChildren) return false;
    return item.children?.some(child => {
      if (child.hasChildren && child.children) {
        return child.children.some(subChild => 
          location.pathname === subChild.to || location.pathname.startsWith(subChild.to + '/')
        );
      }
      return location.pathname === child.to || location.pathname.startsWith(child.to + '/');
    });
  };
  
  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-primary/10 via-card/95 to-primary/10 backdrop-blur-md border-b border-border/50 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img 
              src="/sundaya-nav.png" 
              alt="Sundaya Logo" 
              className="h-10 w-auto object-contain"
            />
            <div>
              <h1 className="font-bold text-foreground text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                ECC Master Dashboard
              </h1>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              if (item.hasChildren && item.children) {
                const isActive = isActiveParent(item);
                return (
                  <DropdownMenu key={item.label}>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      {item.children.map((child) => {
                        if (child.hasChildren && child.children) {
                          return (
                            <DropdownMenuSub key={child.label}>
                              <DropdownMenuSubTrigger>
                                {child.label}
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {child.children.map((subChild) => (
                                  <DropdownMenuItem key={subChild.to} asChild>
                                    <NavLink
                                      to={subChild.to}
                                      className={cn(
                                        "flex items-center gap-2 cursor-pointer",
                                        location.pathname === subChild.to && "bg-primary/10 text-primary"
                                      )}
                                    >
                                      {subChild.label}
                                    </NavLink>
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                          );
                        }
                        return (
                          <DropdownMenuItem key={child.to} asChild>
                            <NavLink
                              to={child.to}
                              className={cn(
                                "flex items-center gap-2 cursor-pointer",
                                location.pathname === child.to && "bg-primary/10 text-primary"
                              )}
                            >
                              {child.label}
                            </NavLink>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }
              
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  activeClassName="bg-primary/10 text-primary"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
          
          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-foreground" />
            ) : (
              <Menu className="h-5 w-5 text-foreground" />
            )}
          </button>
        </div>
        
        {/* Mobile Navigation */}
        <div className={cn(
          "md:hidden overflow-hidden transition-all duration-300",
          mobileMenuOpen ? "max-h-[600px] pb-4" : "max-h-0"
        )}>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              if (item.hasChildren && item.children) {
                return (
                  <div key={item.label} className="flex flex-col">
                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </div>
                    <div className="ml-6 flex flex-col gap-1">
                      {item.children.map((child) => {
                        if (child.hasChildren && child.children) {
                          return (
                            <div key={child.label} className="flex flex-col">
                              <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground">
                                {child.label}
                              </div>
                              <div className="ml-6 flex flex-col gap-1">
                                {child.children.map((subChild) => (
                                  <NavLink
                                    key={subChild.to}
                                    to={subChild.to}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                    activeClassName="bg-primary/10 text-primary"
                                    onClick={() => setMobileMenuOpen(false)}
                                  >
                                    {subChild.label}
                                  </NavLink>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return (
                          <NavLink
                            key={child.to}
                            to={child.to}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            activeClassName="bg-primary/10 text-primary"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {child.label}
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  activeClassName="bg-primary/10 text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
