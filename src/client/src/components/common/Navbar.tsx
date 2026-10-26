import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldAlert,
  Building2,
  HelpCircle,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  PlusCircle,
  KeyRound,
  Users,
  ClipboardList,
  Activity,
} from 'lucide-react';
import { DemoCredentialsModal } from './DemoCredentialsModal';

export const Navbar: React.FC = () => {
  const { user, logout, enableDemoAccounts } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle Escape key for mobile menu
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') return true;
    if (path === '/admin/dashboard' && location.pathname === '/admin/dashboard') return true;
    if (path === '/admin/complaints' && location.pathname === '/admin/complaints') return true;
    if (path === '/staff/queue' && location.pathname === '/staff/queue') return true;
    return location.pathname === path;
  };

  const linkClass = (path: string) =>
    `inline-flex items-center px-3.5 py-2 rounded-xl text-sm font-medium transition-colors min-h-[40px] ${
      isActive(path)
        ? 'bg-civic-50 text-civic-800 font-semibold shadow-xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  const mobileLinkClass = (path: string) =>
    `flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-base font-medium transition-colors min-h-[44px] ${
      isActive(path)
        ? 'bg-civic-50 text-civic-800 font-semibold'
        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <div className="flex items-center gap-6">
              <Link
                to="/"
                className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-civic-500 rounded-xl p-1"
                aria-label="Getitresolved Home"
              >
                <div className="w-10 h-10 rounded-xl bg-civic-700 text-white flex items-center justify-center shadow-xs group-hover:bg-civic-800 transition-colors">
                  <Building2 className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 text-base sm:text-lg leading-tight tracking-tight flex items-center gap-1.5">
                    Getitresolved
                    <span className="hidden sm:inline text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                      Civic Portal
                    </span>
                  </div>
                  <div className="hidden sm:block text-xs text-slate-500 font-medium">Citizen Complaint System</div>
                </div>
              </Link>

              {/* Desktop Nav Links */}
              {user && (
                <nav className="hidden md:flex items-center gap-1 ml-4" aria-label="Main Navigation">
                  {/* Citizen Nav */}
                  {user.role === 'CITIZEN' && (
                    <>
                      <Link
                        to="/dashboard"
                        className={linkClass('/dashboard')}
                        aria-current={isActive('/dashboard') ? 'page' : undefined}
                      >
                        My Complaints
                      </Link>
                      <Link
                        to="/submit"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-white bg-civic-600 hover:bg-civic-700 shadow-xs transition-colors min-h-[40px]"
                        aria-current={isActive('/submit') ? 'page' : undefined}
                      >
                        <PlusCircle className="w-4 h-4" aria-hidden="true" />
                        Report an Issue
                      </Link>
                    </>
                  )}

                  {/* Staff Nav */}
                  {user.role === 'STAFF' && (
                    <Link
                      to="/staff/queue"
                      className={linkClass('/staff/queue')}
                      aria-current={isActive('/staff/queue') ? 'page' : undefined}
                    >
                      Department Queue
                    </Link>
                  )}

                  {/* Admin Nav */}
                  {user.role === 'ADMIN' && (
                    <>
                      <Link
                        to="/admin/dashboard"
                        className={linkClass('/admin/dashboard')}
                        aria-current={isActive('/admin/dashboard') ? 'page' : undefined}
                      >
                        Overview
                      </Link>
                      <Link
                        to="/admin/complaints"
                        className={linkClass('/admin/complaints')}
                        aria-current={isActive('/admin/complaints') ? 'page' : undefined}
                      >
                        All Complaints
                      </Link>
                      <Link
                        to="/admin/manual-review"
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors min-h-[40px] ${
                          isActive('/admin/manual-review')
                            ? 'bg-purple-50 text-purple-900 font-semibold shadow-xs'
                            : 'text-purple-700 hover:bg-purple-50'
                        }`}
                        aria-current={isActive('/admin/manual-review') ? 'page' : undefined}
                      >
                        <ShieldAlert className="w-4 h-4" aria-hidden="true" />
                        Manual Review
                      </Link>
                      <Link
                        to="/admin/staff"
                        className={linkClass('/admin/staff')}
                        aria-current={isActive('/admin/staff') ? 'page' : undefined}
                      >
                        Staff & Departments
                      </Link>
                      <Link
                        to="/admin/audit-logs"
                        className={linkClass('/admin/audit-logs')}
                        aria-current={isActive('/admin/audit-logs') ? 'page' : undefined}
                      >
                        Audit Logs
                      </Link>
                    </>
                  )}

                  {/* Scoring Guide for all authenticated roles */}
                  <Link
                    to="/scoring-guide"
                    className={linkClass('/scoring-guide')}
                    aria-current={isActive('/scoring-guide') ? 'page' : undefined}
                  >
                    <HelpCircle className="w-4 h-4 mr-1 text-slate-400" aria-hidden="true" />
                    How Scoring Works
                  </Link>
                </nav>
              )}

              {/* Public Desktop Nav Links */}
              {!user && (
                <nav className="hidden md:flex items-center gap-1 ml-4" aria-label="Public Navigation">
                  <Link
                    to="/submit"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-white bg-civic-600 hover:bg-civic-700 shadow-xs transition-colors min-h-[38px]"
                  >
                    <PlusCircle className="w-4 h-4" aria-hidden="true" />
                    <span>Report Issue</span>
                  </Link>
                  <Link to="/scoring-guide" className={linkClass('/scoring-guide')}>
                    How Scoring Works
                  </Link>
                  <Link to="/system-status" className={linkClass('/system-status')}>
                    Status
                  </Link>
                  <Link to="/support" className={linkClass('/support')}>
                    Support
                  </Link>
                </nav>
              )}
            </div>

            {/* Right Side: Demo Logins, Account Info, Auth Buttons */}
            <div className="flex items-center gap-3">
              {/* Demo Logins button (guarded by enableDemoAccounts and only shown when logged out) */}
              {enableDemoAccounts && !user && (
                <button
                  type="button"
                  onClick={() => setDemoModalOpen(true)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 min-h-[38px]"
                  title="View and test demo accounts"
                >
                  <KeyRound className="w-4 h-4 text-amber-700" aria-hidden="true" />
                  <span>Demo Logins</span>
                </button>
              )}

              {user ? (
                <div className="flex items-center gap-3">
                  <div className="hidden lg:flex flex-col text-right">
                    <span className="text-sm font-bold text-slate-900 leading-tight">{user.name}</span>
                    <span className="text-xs text-slate-500 font-medium">
                      {user.role === 'ADMIN'
                        ? 'Administrator'
                        : user.role === 'STAFF'
                        ? `Staff • ${user.department?.name || 'Department'}`
                        : 'Citizen'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors border border-slate-200 min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    title="Sign out of current account"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/scoring-guide"
                    className="hidden md:inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-slate-400" aria-hidden="true" />
                    Scoring Guide
                  </Link>
                  <Link
                    to="/login"
                    className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors min-h-[38px] sm:min-h-[40px] inline-flex items-center"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-civic-600 hover:bg-civic-700 rounded-xl transition-colors shadow-xs min-h-[38px] sm:min-h-[40px] inline-flex items-center"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Mobile Menu Trigger */}
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-civic-500 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg"
          >
            {enableDemoAccounts && !user && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setDemoModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-amber-50 text-amber-900 border border-amber-200 mb-2 min-h-[44px]"
              >
                <KeyRound className="w-4 h-4 text-amber-700" />
                Demo Accounts Quick-Fill
              </button>
            )}

            {user ? (
              <>
                <div className="px-4 py-3 bg-slate-50 rounded-xl mb-3 border border-slate-100">
                  <div className="text-sm font-bold text-slate-900">{user.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {user.email} &bull; {user.role}
                  </div>
                </div>

                {user.role === 'CITIZEN' && (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className={mobileLinkClass('/dashboard')}
                    >
                      My Complaints
                    </Link>
                    <Link
                      to="/submit"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl text-base font-semibold text-white bg-civic-600 hover:bg-civic-700 min-h-[44px]"
                    >
                      <PlusCircle className="w-5 h-5" />
                      Report an Issue
                    </Link>
                  </>
                )}

                {user.role === 'STAFF' && (
                  <Link
                    to="/staff/queue"
                    onClick={() => setMobileMenuOpen(false)}
                    className={mobileLinkClass('/staff/queue')}
                  >
                    Department Queue
                  </Link>
                )}

                {user.role === 'ADMIN' && (
                  <>
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className={mobileLinkClass('/admin/dashboard')}
                    >
                      Overview
                    </Link>
                    <Link
                      to="/admin/complaints"
                      onClick={() => setMobileMenuOpen(false)}
                      className={mobileLinkClass('/admin/complaints')}
                    >
                      All Complaints
                    </Link>
                    <Link
                      to="/admin/manual-review"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl text-base font-semibold text-purple-900 bg-purple-50 min-h-[44px]"
                    >
                      <ShieldAlert className="w-5 h-5" />
                      Manual Review Queue
                    </Link>
                    <Link
                      to="/admin/staff"
                      onClick={() => setMobileMenuOpen(false)}
                      className={mobileLinkClass('/admin/staff')}
                    >
                      Staff & Departments
                    </Link>
                    <Link
                      to="/admin/audit-logs"
                      onClick={() => setMobileMenuOpen(false)}
                      className={mobileLinkClass('/admin/audit-logs')}
                    >
                      Audit Logs
                    </Link>
                  </>
                )}

                <Link
                  to="/scoring-guide"
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileLinkClass('/scoring-guide')}
                >
                  <HelpCircle className="w-5 h-5 text-slate-400" />
                  How Scoring Works
                </Link>

                <div className="pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-3 rounded-xl text-base font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 min-h-[44px]"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/submit"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-base font-semibold text-white bg-civic-600 hover:bg-civic-700 min-h-[44px]"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Report an Issue</span>
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileLinkClass('/login')}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center px-4 py-3 rounded-xl text-base font-semibold text-civic-700 bg-civic-50 hover:bg-civic-100 border border-civic-200 min-h-[44px]"
                >
                  Register Account
                </Link>
                <Link
                  to="/scoring-guide"
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileLinkClass('/scoring-guide')}
                >
                  <HelpCircle className="w-5 h-5 text-slate-400" />
                  How Scoring Works
                </Link>
                <Link
                  to="/system-status"
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileLinkClass('/system-status')}
                >
                  <Activity className="w-5 h-5 text-slate-400" />
                  System Status
                </Link>
                <Link
                  to="/support"
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileLinkClass('/support')}
                >
                  Help &amp; Support
                </Link>
                <Link
                  to="/privacy"
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileLinkClass('/privacy')}
                >
                  Privacy Policy
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      {/* Demo Credentials Modal */}
      <DemoCredentialsModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
    </>
  );
};
