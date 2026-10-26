import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Shield, HelpCircle, FileText, HeartHandshake } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20 text-sm text-slate-600">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Platform & Purpose */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <div className="w-8 h-8 rounded-xl bg-civic-600 text-white flex items-center justify-center shadow-xs">
                <Building2 className="w-4 h-4" />
              </div>
              <span>Getitresolved</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-md">
              A transparent municipal complaint management system designed to connect neighborhood residents directly with responsible maintenance departments, ensuring accountable, prioritized issue resolution.
            </p>
            <div className="text-xs text-slate-400 font-medium">
              Open Demonstration &amp; Civic Reference Platform
            </div>
          </div>

          {/* Col 2: Citizen Actions */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-900">Citizen Services</div>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link to="/submit" className="hover:text-civic-700 hover:underline transition-colors">
                  Report a Local Issue
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-civic-700 hover:underline transition-colors">
                  Track Your Complaints
                </Link>
              </li>
              <li>
                <Link to="/scoring-guide" className="hover:text-civic-700 hover:underline transition-colors flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-civic-600" />
                  <span>How Scoring Works</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Policy & Support */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-900">Governance & Help</div>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link to="/privacy" className="hover:text-civic-700 hover:underline transition-colors flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-civic-600" />
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link to="/support" className="hover:text-civic-700 hover:underline transition-colors flex items-center gap-1">
                  <HeartHandshake className="w-3.5 h-3.5 text-civic-600" />
                  <span>Help &amp; Account Support</span>
                </Link>
              </li>
              <li>
                <span className="text-xs text-slate-400 block pt-1">
                  Contact: <span className="font-mono text-slate-600">admin@civicresolve.gov</span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} Getitresolved &bull; Municipal Issue Management Service
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <Link to="/privacy" className="hover:text-civic-700 hover:underline">
              Privacy
            </Link>
            <span>&bull;</span>
            <Link to="/support" className="hover:text-civic-700 hover:underline">
              Support
            </Link>
            <span>&bull;</span>
            <Link to="/scoring-guide" className="hover:text-civic-700 hover:underline">
              Prioritization
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
