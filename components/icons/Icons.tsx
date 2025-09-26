'use client';

import React from 'react';
import { AnimatedIcon } from './AnimatedIcon';

export type IconProps = React.SVGProps<SVGSVGElement> & {
  animated?: boolean;
  variant?: 'hover' | 'pulse' | 'bounce' | 'rotate' | 'scale' | 'float' | 'glow' | 'premium';
};

export const DashboardIcon: React.FC<IconProps> = ({ animated = true, variant = 'premium', ...props }) => {
  const IconSVG = (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <defs>
        <linearGradient id="dashboardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15"/>
          <stop offset="50%" stopColor="currentColor" stopOpacity="0.08"/>
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.03"/>
        </linearGradient>
        <filter id="dashboardGlow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <rect x="3" y="3" width="7" height="7" rx="2.5" fill="url(#dashboardGradient)" stroke="currentColor" strokeWidth={1.5} filter="url(#dashboardGlow)"/>
      <rect x="14" y="3" width="7" height="7" rx="2.5" fill="url(#dashboardGradient)" stroke="currentColor" strokeWidth={1.5} filter="url(#dashboardGlow)"/>
      <rect x="3" y="14" width="7" height="7" rx="2.5" fill="url(#dashboardGradient)" stroke="currentColor" strokeWidth={1.5} filter="url(#dashboardGlow)"/>
      <rect x="14" y="14" width="7" height="7" rx="2.5" fill="url(#dashboardGradient)" stroke="currentColor" strokeWidth={1.5} filter="url(#dashboardGlow)"/>
      <circle cx="6.5" cy="6.5" r="1.2" fill="currentColor" opacity="0.8"/>
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" opacity="0.8"/>
      <circle cx="6.5" cy="17.5" r="1.2" fill="currentColor" opacity="0.8"/>
      <circle cx="17.5" cy="17.5" r="1.2" fill="currentColor" opacity="0.8"/>
      <circle cx="6.5" cy="6.5" r="0.5" fill="currentColor"/>
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
      <circle cx="6.5" cy="17.5" r="0.5" fill="currentColor"/>
      <circle cx="17.5" cy="17.5" r="0.5" fill="currentColor"/>
    </svg>
  );

  return animated ? (
    <AnimatedIcon variant={variant}>
      {IconSVG}
    </AnimatedIcon>
  ) : IconSVG;
};

export const MapIcon: React.FC<IconProps> = ({ animated = true, variant = 'float', ...props }) => {
  const IconSVG = (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <defs>
        <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15"/>
          <stop offset="50%" stopColor="currentColor" stopOpacity="0.08"/>
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.03"/>
        </linearGradient>
        <filter id="mapGlow">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <path strokeLinecap="round" strokeLinejoin="round" fill="url(#mapGradient)" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13v-6m0-6V4a1 1 0 011.447-.894l5.447 2.724A1 1 0 0121 6.618v10.764a1 1 0 01-1.447.894L15 17m-6 3v-6m6-3v6" filter="url(#mapGlow)"/>
      <circle cx="7" cy="9" r="2" fill="currentColor" opacity="0.3"/>
      <circle cx="17" cy="11" r="2" fill="currentColor" opacity="0.3"/>
      <circle cx="7" cy="9" r="1.2" fill="currentColor"/>
      <circle cx="17" cy="11" r="1.2" fill="currentColor"/>
      <circle cx="7" cy="9" r="0.5" fill="white"/>
      <circle cx="17" cy="11" r="0.5" fill="white"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 9l3 2m4 0l3-2" stroke="currentColor" strokeWidth={1} opacity="0.6"/>
    </svg>
  );

  return animated ? (
    <AnimatedIcon variant={variant}>
      {IconSVG}
    </AnimatedIcon>
  ) : IconSVG;
};

export const RouteIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <defs>
      <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.8"/>
        <stop offset="50%" stopColor="currentColor" stopOpacity="0.4"/>
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.8"/>
      </linearGradient>
    </defs>
    <path strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 2" d="M4 12h16" stroke="url(#routeGradient)" strokeWidth={2}/>
    <circle cx="4" cy="12" r="2" fill="currentColor"/>
    <circle cx="20" cy="12" r="2" fill="currentColor"/>
    <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="0.6"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 9l3 3-3 3" stroke="currentColor" strokeWidth={1.5}/>
  </svg>
);

export const AlertIcon: React.FC<IconProps> = ({ animated = true, variant = 'pulse', ...props }) => {
  const IconSVG = (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <defs>
        <linearGradient id="alertGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff6b6b" stopOpacity="0.2"/>
          <stop offset="50%" stopColor="currentColor" stopOpacity="0.1"/>
          <stop offset="100%" stopColor="#ff6b6b" stopOpacity="0.05"/>
        </linearGradient>
        <filter id="alertGlow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <path strokeLinecap="round" strokeLinejoin="round" fill="url(#alertGradient)" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7C18 6.279 15.458 4 12.25 4S6.5 6.279 6.5 9.05v.7a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" filter="url(#alertGlow)"/>
      <circle cx="12" cy="9" r="1.5" fill="#ff6b6b"/>
      <circle cx="12" cy="9" r="0.8" fill="white"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v2" stroke="#ff6b6b" strokeWidth={2.5}/>
      <circle cx="18" cy="6" r="3" fill="#ff6b6b" opacity="0.9" filter="url(#alertGlow)"/>
      <circle cx="18" cy="6" r="1.5" fill="white"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 5v2m0 0h-1m1 0h1" stroke="#ff6b6b" strokeWidth={1.5}/>
    </svg>
  );

  return animated ? (
    <AnimatedIcon variant={variant}>
      {IconSVG}
    </AnimatedIcon>
  ) : IconSVG;
};

export const ReportIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <defs>
      <linearGradient id="reportGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.1"/>
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.05"/>
      </linearGradient>
    </defs>
    <path strokeLinecap="round" strokeLinejoin="round" fill="url(#reportGradient)" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5-3H12M8.25 15H12m-3.75-6.75h3.75m-3.75 3h3.75"/>
    <rect x="6" y="4" width="12" height="16" rx="2" fill="url(#reportGradient)" stroke="currentColor" strokeWidth={1.5}/>
    <rect x="8" y="7" width="3" height="2" rx="0.5" fill="currentColor" opacity="0.6"/>
    <rect x="8" y="10" width="4" height="1" rx="0.5" fill="currentColor" opacity="0.4"/>
    <rect x="8" y="12" width="5" height="1" rx="0.5" fill="currentColor" opacity="0.4"/>
    <rect x="8" y="14" width="3" height="1" rx="0.5" fill="currentColor" opacity="0.4"/>
    <rect x="13" y="10" width="3" height="6" rx="1" fill="currentColor" opacity="0.2"/>
    <rect x="13" y="13" width="3" height="3" rx="1" fill="currentColor" opacity="0.4"/>
  </svg>
);

export const UserGroupIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <defs>
        <linearGradient id="userGroupGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05"/>
        </linearGradient>
      </defs>
      <circle cx="9" cy="7" r="3" fill="url(#userGroupGradient)" stroke="currentColor" strokeWidth={1.5}/>
      <circle cx="15" cy="7" r="2.5" fill="url(#userGroupGradient)" stroke="currentColor" strokeWidth={1.5} opacity="0.8"/>
      <path strokeLinecap="round" strokeLinejoin="round" fill="url(#userGroupGradient)" d="M3 20c0-3.5 2.5-6 6-6s6 2.5 6 6"/>
      <path strokeLinecap="round" strokeLinejoin="round" fill="url(#userGroupGradient)" d="M21 20c0-2.8-2-5-4.5-5-1 0-1.9.3-2.7.8" opacity="0.7"/>
      <circle cx="9" cy="7" r="1" fill="currentColor"/>
      <circle cx="15" cy="7" r="0.8" fill="currentColor" opacity="0.8"/>
    </svg>
);

export const BuildingOfficeIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <defs>
        <linearGradient id="buildingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.1"/>
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05"/>
        </linearGradient>
      </defs>
      <rect x="4" y="3" width="16" height="18" rx="1" fill="url(#buildingGradient)" stroke="currentColor" strokeWidth={1.5}/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5" stroke="currentColor" strokeWidth={2}/>
      <rect x="7" y="6" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.6"/>
      <rect x="11" y="6" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.6"/>
      <rect x="15" y="6" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.6"/>
      <rect x="7" y="10" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.6"/>
      <rect x="11" y="10" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.6"/>
      <rect x="15" y="10" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.6"/>
      <rect x="7" y="14" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.6"/>
      <rect x="11" y="14" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.6"/>
      <rect x="15" y="14" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.6"/>
      <rect x="9" y="17" width="6" height="4" rx="1" fill="currentColor" opacity="0.3"/>
    </svg>
);

export const TruckIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <defs>
        <linearGradient id="truckGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.1"/>
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05"/>
        </linearGradient>
      </defs>
      <rect x="2" y="8" width="12" height="8" rx="1" fill="url(#truckGradient)" stroke="currentColor" strokeWidth={1.5}/>
      <path strokeLinecap="round" strokeLinejoin="round" fill="url(#truckGradient)" d="M14 8h4l2 3v5h-2"/>
      <circle cx="7" cy="18" r="2" fill="url(#truckGradient)" stroke="currentColor" strokeWidth={1.5}/>
      <circle cx="17" cy="18" r="2" fill="url(#truckGradient)" stroke="currentColor" strokeWidth={1.5}/>
      <circle cx="7" cy="18" r="0.8" fill="currentColor"/>
      <circle cx="17" cy="18" r="0.8" fill="currentColor"/>
      <rect x="4" y="10" width="2" height="1" rx="0.5" fill="currentColor" opacity="0.6"/>
      <rect x="4" y="12" width="3" height="1" rx="0.5" fill="currentColor" opacity="0.6"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11h2" stroke="currentColor" strokeWidth={1.5} opacity="0.6"/>
    </svg>
);
  
export const ChartBarIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <defs>
        <linearGradient id="chartGradient1" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.8"/>
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.3"/>
        </linearGradient>
        <linearGradient id="chartGradient2" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.4"/>
        </linearGradient>
        <linearGradient id="chartGradient3" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="1"/>
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.5"/>
        </linearGradient>
      </defs>
      <rect x="3" y="13" width="4" height="7" rx="1" fill="url(#chartGradient1)" stroke="currentColor" strokeWidth={1}/>
      <rect x="10" y="9" width="4" height="11" rx="1" fill="url(#chartGradient2)" stroke="currentColor" strokeWidth={1}/>
      <rect x="17" y="4" width="4" height="16" rx="1" fill="url(#chartGradient3)" stroke="currentColor" strokeWidth={1}/>
      <circle cx="5" cy="11" r="1" fill="currentColor"/>
      <circle cx="12" cy="7" r="1" fill="currentColor"/>
      <circle cx="19" cy="2" r="1" fill="currentColor"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 11l7-4 7-5" stroke="currentColor" strokeWidth={1} opacity="0.4" strokeDasharray="2 2"/>
    </svg>
);

export const ExclamationTriangleIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
);

export const PaperAirplaneIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
);

export const MapPinIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 005.16-4.252C19.043 15.98 20 13.566 20 11c0-4.418-3.582-8-8-8S4 6.582 4 11c0 2.566.957 4.98 2.808 7.099a16.975 16.975 0 005.159 4.252zM12 13.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" clipRule="evenodd" />
    </svg>
);

export const BellIcon: React.FC<IconProps> = ({ animated = true, variant = 'bounce', ...props }) => {
  const IconSVG = (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <defs>
        <linearGradient id="bellGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15"/>
          <stop offset="50%" stopColor="currentColor" stopOpacity="0.08"/>
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.03"/>
        </linearGradient>
        <filter id="bellGlow">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="notificationGlow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <path strokeLinecap="round" strokeLinejoin="round" fill="url(#bellGradient)" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7C18 6.279 15.458 4 12.25 4S6.5 6.279 6.5 9.05v.7a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" filter="url(#bellGlow)"/>
      <circle cx="18" cy="6" r="4" fill="#ff4757" opacity="0.3" filter="url(#notificationGlow)"/>
      <circle cx="18" cy="6" r="3" fill="#ff4757" opacity="0.9"/>
      <circle cx="18" cy="6" r="1.5" fill="white"/>
      <text x="18" y="7.5" textAnchor="middle" fontSize="10" fill="#ff4757" fontWeight="bold">!</text>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19a2 2 0 004 0" stroke="currentColor" strokeWidth={1.5}/>
    </svg>
  );

  return animated ? (
    <AnimatedIcon variant={variant}>
      {IconSVG}
    </AnimatedIcon>
  ) : IconSVG;
};
  
export const ExclamationCircleIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
    </svg>
);

export const InformationCircleIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
    </svg>
);

export const CheckCircleIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
    </svg>
);

export const WrenchScrewdriverIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <defs>
        <linearGradient id="toolGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05"/>
        </linearGradient>
      </defs>
      <rect x="3" y="14" width="10" height="3" rx="1.5" fill="url(#toolGradient)" stroke="currentColor" strokeWidth={1.5} transform="rotate(-45 8 15.5)"/>
      <rect x="15" y="3" width="3" height="10" rx="1.5" fill="url(#toolGradient)" stroke="currentColor" strokeWidth={1.5} transform="rotate(45 16.5 8)"/>
      <circle cx="6" cy="18" r="1.5" fill="currentColor" opacity="0.8"/>
      <circle cx="18" cy="6" r="1.5" fill="currentColor" opacity="0.8"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15l6-6" stroke="currentColor" strokeWidth={1} opacity="0.4" strokeDasharray="1 1"/>
      <rect x="4" y="15" width="1" height="1" rx="0.5" fill="currentColor" opacity="0.6" transform="rotate(-45 4.5 15.5)"/>
      <rect x="19" y="4" width="1" height="1" rx="0.5" fill="currentColor" opacity="0.6" transform="rotate(45 19.5 4.5)"/>
    </svg>
);

export const ShieldCheckIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <defs>
        <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05"/>
        </linearGradient>
      </defs>
      <path fill="url(#shieldGradient)" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M12 2.5c3.5 1 7 2.5 7 6v4c0 5-7 9-7 9s-7-4-7-9v-4c0-3.5 3.5-5 7-6z"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth={2}/>
      <circle cx="12" cy="3.5" r="1" fill="currentColor" opacity="0.6"/>
      <circle cx="8" cy="4.5" r="0.5" fill="currentColor" opacity="0.4"/>
      <circle cx="16" cy="4.5" r="0.5" fill="currentColor" opacity="0.4"/>
    </svg>
);

export const UserIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <defs>
        <linearGradient id="userGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05"/>
        </linearGradient>
      </defs>
      <circle cx="12" cy="8" r="4" fill="url(#userGradient)" stroke="currentColor" strokeWidth={1.5}/>
      <path strokeLinecap="round" strokeLinejoin="round" fill="url(#userGradient)" d="M4 20c0-4 3.5-7 8-7s8 3 8 7"/>
      <circle cx="12" cy="8" r="1.5" fill="currentColor"/>
      <circle cx="10" cy="7" r="0.5" fill="currentColor" opacity="0.6"/>
      <circle cx="14" cy="7" r="0.5" fill="currentColor" opacity="0.6"/>
    </svg>
);

export const DocumentTextIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <defs>
        <linearGradient id="docGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.1"/>
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05"/>
        </linearGradient>
      </defs>
      <rect x="5" y="3" width="14" height="18" rx="2" fill="url(#docGradient)" stroke="currentColor" strokeWidth={1.5}/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v4h4" stroke="currentColor" strokeWidth={1.5}/>
      <rect x="8" y="10" width="8" height="1" rx="0.5" fill="currentColor" opacity="0.6"/>
      <rect x="8" y="12" width="6" height="1" rx="0.5" fill="currentColor" opacity="0.6"/>
      <rect x="8" y="14" width="8" height="1" rx="0.5" fill="currentColor" opacity="0.6"/>
      <rect x="8" y="16" width="5" height="1" rx="0.5" fill="currentColor" opacity="0.6"/>
      <circle cx="7" cy="6" r="0.5" fill="currentColor" opacity="0.4"/>
    </svg>
);

export const UsersIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <defs>
        <linearGradient id="usersGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05"/>
        </linearGradient>
      </defs>
      <circle cx="8" cy="7" r="3" fill="url(#usersGradient)" stroke="currentColor" strokeWidth={1.5}/>
      <circle cx="16" cy="7" r="2.5" fill="url(#usersGradient)" stroke="currentColor" strokeWidth={1.5} opacity="0.8"/>
      <circle cx="12" cy="9" r="2" fill="url(#usersGradient)" stroke="currentColor" strokeWidth={1.5} opacity="0.6"/>
      <path strokeLinecap="round" strokeLinejoin="round" fill="url(#usersGradient)" d="M2 20c0-3.5 2.5-6 6-6s6 2.5 6 6"/>
      <path strokeLinecap="round" strokeLinejoin="round" fill="url(#usersGradient)" d="M22 20c0-2.8-2-5-4.5-5-1 0-1.9.3-2.7.8" opacity="0.7"/>
      <path strokeLinecap="round" strokeLinejoin="round" fill="url(#usersGradient)" d="M16 20c0-2.2-1.5-4-3.5-4-.8 0-1.5.2-2.1.6" opacity="0.5"/>
      <circle cx="8" cy="7" r="1" fill="currentColor"/>
      <circle cx="16" cy="7" r="0.8" fill="currentColor" opacity="0.8"/>
      <circle cx="12" cy="9" r="0.6" fill="currentColor" opacity="0.6"/>
    </svg>
);



export const PhoneIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <defs>
        <linearGradient id="phoneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05"/>
        </linearGradient>
      </defs>
      <rect x="6" y="2" width="12" height="20" rx="3" fill="url(#phoneGradient)" stroke="currentColor" strokeWidth={1.5}/>
      <rect x="8" y="5" width="8" height="12" rx="1" fill="url(#phoneGradient)" stroke="currentColor" strokeWidth={1} opacity="0.8"/>
      <circle cx="12" cy="19" r="1" fill="currentColor"/>
      <rect x="10" y="3" width="4" height="1" rx="0.5" fill="currentColor" opacity="0.6"/>
      <circle cx="9" cy="19" r="0.3" fill="currentColor" opacity="0.4"/>
      <circle cx="15" cy="19" r="0.3" fill="currentColor" opacity="0.4"/>
    </svg>
);

export const UserCircleIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <defs>
        <linearGradient id="userCircleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.1"/>
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05"/>
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#userCircleGradient)" stroke="currentColor" strokeWidth={1.5}/>
      <circle cx="12" cy="9" r="3" fill="url(#userCircleGradient)" stroke="currentColor" strokeWidth={1.5}/>
      <path strokeLinecap="round" strokeLinejoin="round" fill="url(#userCircleGradient)" d="M6 19c0-3.5 2.5-6 6-6s6 2.5 6 6"/>
      <circle cx="12" cy="9" r="1" fill="currentColor"/>
      <circle cx="10.5" cy="8.5" r="0.3" fill="currentColor" opacity="0.6"/>
      <circle cx="13.5" cy="8.5" r="0.3" fill="currentColor" opacity="0.6"/>
    </svg>
);

export const LifebuoyIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <defs>
      <linearGradient id="lifebuoyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.15"/>
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.05"/>
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="9" fill="url(#lifebuoyGradient)" stroke="currentColor" strokeWidth={2}/>
    <circle cx="12" cy="12" r="4" fill="url(#lifebuoyGradient)" stroke="currentColor" strokeWidth={2}/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 8.5l-2-2M15.5 8.5l2-2M8.5 15.5l-2 2M15.5 15.5l2 2" stroke="currentColor" strokeWidth={2}/>
    <circle cx="12" cy="12" r="1" fill="currentColor"/>
    <circle cx="12" cy="4" r="0.5" fill="currentColor" opacity="0.6"/>
    <circle cx="20" cy="12" r="0.5" fill="currentColor" opacity="0.6"/>
    <circle cx="12" cy="20" r="0.5" fill="currentColor" opacity="0.6"/>
    <circle cx="4" cy="12" r="0.5" fill="currentColor" opacity="0.6"/>
  </svg>
);

export const AdjustmentsHorizontalIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <defs>
      <linearGradient id="adjustmentsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.15"/>
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.05"/>
      </linearGradient>
    </defs>
    <rect x="2" y="5" width="20" height="2" rx="1" fill="url(#adjustmentsGradient)" stroke="currentColor" strokeWidth={1}/>
    <rect x="2" y="11" width="20" height="2" rx="1" fill="url(#adjustmentsGradient)" stroke="currentColor" strokeWidth={1}/>
    <rect x="2" y="17" width="20" height="2" rx="1" fill="url(#adjustmentsGradient)" stroke="currentColor" strokeWidth={1}/>
    <circle cx="8" cy="6" r="2" fill="url(#adjustmentsGradient)" stroke="currentColor" strokeWidth={1.5}/>
    <circle cx="16" cy="12" r="2" fill="url(#adjustmentsGradient)" stroke="currentColor" strokeWidth={1.5}/>
    <circle cx="10" cy="18" r="2" fill="url(#adjustmentsGradient)" stroke="currentColor" strokeWidth={1.5}/>
    <circle cx="8" cy="6" r="0.8" fill="currentColor"/>
    <circle cx="16" cy="12" r="0.8" fill="currentColor"/>
    <circle cx="10" cy="18" r="0.8" fill="currentColor"/>
  </svg>
);

export const KeyIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <defs>
        <linearGradient id="keyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05"/>
        </linearGradient>
      </defs>
      <circle cx="18" cy="6" r="4" fill="url(#keyGradient)" stroke="currentColor" strokeWidth={1.5}/>
      <path fill="url(#keyGradient)" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M14 10L3 21h3v-3h3v-3h3l2-2"/>
      <circle cx="18" cy="6" r="1.5" fill="currentColor"/>
      <rect x="6" y="18" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.6"/>
      <rect x="9" y="15" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.6"/>
      <rect x="12" y="12" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.6"/>
    </svg>
);

export const PencilIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <defs>
      <linearGradient id="pencilGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.15"/>
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.05"/>
      </linearGradient>
    </defs>
    <path fill="url(#pencilGradient)" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/>
    <path fill="url(#pencilGradient)" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M14.06 6.19l3.75 3.75L20.5 7.25a1.5 1.5 0 000-2.12l-1.63-1.63a1.5 1.5 0 00-2.12 0l-2.69 2.69z"/>
    <circle cx="18" cy="6" r="1" fill="currentColor" opacity="0.6"/>
    <rect x="4" y="18" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.4"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 6l4 4" stroke="currentColor" strokeWidth={1} opacity="0.3" strokeDasharray="1 1"/>
  </svg>
);

export const TrashIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <defs>
      <linearGradient id="trashGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.15"/>
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.05"/>
      </linearGradient>
    </defs>
    <rect x="5" y="8" width="14" height="13" rx="2" fill="url(#trashGradient)" stroke="currentColor" strokeWidth={1.5}/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h18" stroke="currentColor" strokeWidth={2}/>
    <rect x="8" y="4" width="8" height="4" rx="1" fill="url(#trashGradient)" stroke="currentColor" strokeWidth={1.5}/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 12v6M14 12v6" stroke="currentColor" strokeWidth={1.5} opacity="0.6"/>
    <circle cx="7" cy="8" r="0.5" fill="currentColor" opacity="0.4"/>
    <circle cx="17" cy="8" r="0.5" fill="currentColor" opacity="0.4"/>
  </svg>
);

export const PlusCircleIcon: React.FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <defs>
      <linearGradient id="plusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.15"/>
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.05"/>
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="9" fill="url(#plusGradient)" stroke="currentColor" strokeWidth={1.5}/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth={2}/>
    <circle cx="12" cy="12" r="1" fill="currentColor" opacity="0.6"/>
    <circle cx="12" cy="4" r="0.5" fill="currentColor" opacity="0.3"/>
    <circle cx="20" cy="12" r="0.5" fill="currentColor" opacity="0.3"/>
    <circle cx="12" cy="20" r="0.5" fill="currentColor" opacity="0.3"/>
    <circle cx="4" cy="12" r="0.5" fill="currentColor" opacity="0.3"/>
  </svg>
);

export const XMarkIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <defs>
        <linearGradient id="xGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.8"/>
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.4"/>
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#xGradient)" stroke="currentColor" strokeWidth={1} opacity="0.1"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth={2.5}/>
      <circle cx="12" cy="12" r="1" fill="currentColor" opacity="0.6"/>
    </svg>
);

export const ArrowUpIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <defs>
        <linearGradient id="arrowUpGradient" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.8"/>
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#arrowUpGradient)" stroke="currentColor" strokeWidth={1} opacity="0.1"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6l-6 6h4v6h4v-6h4l-6-6z" fill="currentColor" stroke="currentColor" strokeWidth={1.5}/>
      <circle cx="12" cy="8" r="1" fill="currentColor" opacity="0.6"/>
    </svg>
);

export const ArrowRightIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <defs>
        <linearGradient id="arrowRightGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.8"/>
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#arrowRightGradient)" stroke="currentColor" strokeWidth={1} opacity="0.1"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 12l-6-6v4H6v4h6v4l6-6z" fill="currentColor" stroke="currentColor" strokeWidth={1.5}/>
      <circle cx="16" cy="12" r="1" fill="currentColor" opacity="0.6"/>
    </svg>
);

export const ArrowUturnLeftIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <defs>
        <linearGradient id="uturnGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05"/>
        </linearGradient>
      </defs>
      <path fill="url(#uturnGradient)" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M3 9l6-6v4h6a6 6 0 016 6v6h-2v-6a4 4 0 00-4-4H9v4l-6-6z"/>
      <circle cx="6" cy="9" r="1" fill="currentColor" opacity="0.6"/>
      <circle cx="15" cy="15" r="0.5" fill="currentColor" opacity="0.4"/>
    </svg>
);

export const FlagCheckeredIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <defs>
        <linearGradient id="flagGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05"/>
        </linearGradient>
      </defs>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 3v18" stroke="currentColor" strokeWidth={2}/>
      <path fill="url(#flagGradient)" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M4 3h12l-2 4 2 4H4V3z"/>
      <rect x="6" y="5" width="2" height="2" fill="currentColor" opacity="0.6"/>
      <rect x="10" y="5" width="2" height="2" fill="currentColor" opacity="0.3"/>
      <rect x="8" y="7" width="2" height="2" fill="currentColor" opacity="0.6"/>
      <rect x="12" y="7" width="2" height="2" fill="currentColor" opacity="0.3"/>
      <rect x="6" y="9" width="2" height="2" fill="currentColor" opacity="0.3"/>
      <rect x="10" y="9" width="2" height="2" fill="currentColor" opacity="0.6"/>
      <circle cx="4" cy="21" r="1" fill="currentColor" opacity="0.4"/>
    </svg>
);

export const ClockIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <defs>
        <linearGradient id="clockGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05"/>
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="9" fill="url(#clockGradient)" stroke="currentColor" strokeWidth={1.5}/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" stroke="currentColor" strokeWidth={2}/>
      <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
      <circle cx="12" cy="4" r="0.5" fill="currentColor" opacity="0.4"/>
      <circle cx="20" cy="12" r="0.5" fill="currentColor" opacity="0.4"/>
      <circle cx="12" cy="20" r="0.5" fill="currentColor" opacity="0.4"/>
      <circle cx="4" cy="12" r="0.5" fill="currentColor" opacity="0.4"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l2 2" stroke="currentColor" strokeWidth={1} opacity="0.3"/>
    </svg>
);

export const CurrencyDollarIcon: React.FC<IconProps> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <defs>
        <linearGradient id="dollarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05"/>
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="9" fill="url(#dollarGradient)" stroke="currentColor" strokeWidth={1.5}/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12M9 9a3 3 0 016 0v1a3 3 0 01-6 0M9 15a3 3 0 006 0v-1a3 3 0 00-6 0" stroke="currentColor" strokeWidth={1.5}/>
      <circle cx="12" cy="12" r="1" fill="currentColor" opacity="0.6"/>
      <rect x="8" y="8" width="8" height="2" rx="1" fill="currentColor" opacity="0.2"/>
      <rect x="8" y="14" width="8" height="2" rx="1" fill="currentColor" opacity="0.2"/>
    </svg>
);