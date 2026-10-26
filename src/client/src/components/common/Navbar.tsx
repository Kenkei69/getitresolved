import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldAlert,
  Building2,
  FileText,
  HelpCircle,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  PlusCircle,
  KeyRound,
  Users,
  ClipboardList,
} from 'lucide-react';
import { DemoCredentialsModal } from './DemoCredentialsModal';

export const Navbar: React.FC = () => {
  const { user, logout, enableDemoAccounts } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Civic Branding */}
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2.5 group focus:outline-none">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-civic-600 to-civic-800 flex items-center justify-center text-white shadow-sm shadow-civic-200 group-hover:from-civic-700 group-hover:to-civic-900 transition-all">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-base leading-tight tracking-tight flex items-center gap-1.5">
                    Getitresolved
                    <span className="text-[10px] font-semibold bg-civic-100 text-civic-800 px-1.5 py-0.2 rounded border border-civic-200">
                      AI Triage
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">Citizen Complaint System</div>
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
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          isActive('/dashboard') ? 'bg-civic-50 text-civic-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        My Complaints
                      </Link>
                      <Link
                        to="/submit"
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          isActive('/submit') ? 'bg-civic-600 text-white shadow-sm' : 'text-civic-700 bg-civic-50 hover:bg-civic-100 font-semibold'
                        }`}
                      >
                        <PlusCircle className="w-4 h-4" />
                        Report an Issue
                      </Link>
                    </>
                  )}

                  {/* Staff Nav */}
                  {user.role === 'STAFF' && (
                    <>
                      <Link
                        to="/staff/queue"
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          isActive('/staff/queue') ? 'bg-civic-50 text-civic-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        Department Queue
                      </Link>
                    </>
                  )}

                  {/* Admin Nav */}
                  {user.role === 'ADMIN' && (
                    <>
                      <Link
                        to="/admin/dashboard"
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          isActive('/admin/dashboard') ? 'bg-civic-50 text-civic-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        Overview
                      </Link>
                      <Link
                        to="/admin/complaints"
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          isActive('/admin/complaints') ? 'bg-civic-50 text-civic-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        All Complaints
                      </Link>
                      <Link
                        to="/admin/manual-review"
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          isActive('/admin/manual-review')
                            ? 'bg-purple-100 text-purple-900 font-semibold'
                            : 'text-purple-700 hover:bg-purple-50'
                        }`}
                      >
                        <ShieldAlert className="w-4 h-4" />
                        Manual Review
                      </Link>
                      <Link
                        to="/admin/staff"
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          isActive('/admin/staff') ? 'bg-civic-50 text-civic-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        Staff & Departments
                      </Link>
                      <Link
                        to="/admin/audit-logs"
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          isActive('/admin/audit-logs') ? 'bg-civic-50 text-civic-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        Audit Logs
                      </Link>
                    </>
                  )}

                  {/* Scoring guide link for all roles */}
                  <Link
                    to="/scoring-guide"
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isActive('/scoring-guide') ? 'bg-civic-50 text-civic-700 font-semibold' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    How Scoring Works
                  </Link>
                </nav>
              )}
            </div>

            {/* Right side controls: Role Badge, Demo Accounts Button, User Menu */}
            <div className="flex items-center gap-3">
              {/* Quick Demo Credentials Switcher Button (hidden in production when demo accounts disabled) */}
              {enableDemoAccounts && (
                <button
                  onClick={() => setDemoModalOpen(true)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors focus:ring-2 focus:ring-amber-500"
                  title="View and 1-click test seeded demo accounts (Citizen, Staff, Admin)"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Demo Logins
                </button>
              )}

              {user ? (
                <div className="flex items-center gap-3">
                  {/* Role indicator pill */}
                  <div className="hidden lg:flex flex-col text-right">
                    <span className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</span>
                    <span className="text-[11px] text-slate-500">
                      {user.role === 'ADMIN'
                        ? 'Administrator'
                        : user.role === 'STAFF'
                        ? `Staff: ${user.department?.name || 'Assigned'}`
                        : 'Citizen'}
                    </span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors border border-slate-200"
                    title="Sign out of current account"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 rounded-lg transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-civic-600 hover:bg-civic-700 rounded-lg transition-colors shadow-sm"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Mobile menu trigger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-civic-500"
                aria-label="Toggle mobile navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-4 space-y-1">
            {enableDemoAccounts && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setDemoModalOpen(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold bg-amber-50 text-amber-900 border border-amber-200 mb-2"
              >
                <KeyRound className="w-4 h-4" />
                Demo Accounts Quick-Fill
              </button>
            )}

            {user ? (
              <>
                <div className="px-3 py-2 bg-slate-50 rounded-lg mb-2">
                  <div className="text-xs font-semibold text-slate-900">{user.name}</div>
                  <div className="text-[11px] text-slate-500">{user.email} &bull; {user.role}</div>
                </div>

                {user.role === 'CITIZEN' && (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      My Complaints
                    </Link>
                    <Link
                      to="/submit"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-md text-sm font-semibold text-civic-700 bg-civic-50"
                    >
                      + Report an Issue
                    </Link>
                  </>
                )}

                {user.role === 'STAFF' && (
                  <Link
                    to="/staff/queue"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Department Queue
                  </Link>
                )}

                {user.role === 'ADMIN' && (
                  <>
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Overview
                    </Link>
                    <Link
                      to="/admin/complaints"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      All Complaints
                    </Link>
                    <Link
                      to="/admin/manual-review"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-md text-sm font-semibold text-purple-800 bg-purple-50"
                    >
                      Manual Review Queue
                    </Link>
                    <Link
                      to="/admin/staff"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Staff & Departments
                    </Link>
                    <Link
                      to="/admin/audit-logs"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Audit Logs
                    </Link>
                  </>
                )}

                <Link
                  to="/scoring-guide"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  How Scoring Works
                </Link>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-sm font-semibold text-civic-700 bg-civic-50"
                >
                  Register Account
                </Link>
                <Link
                  to="/scoring-guide"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  How Scoring Works
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
