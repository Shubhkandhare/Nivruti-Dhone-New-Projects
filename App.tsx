
import React, { useState, useEffect } from 'react';
import { useSiteData } from './context/SiteContext';
import PublicSite from './pages/PublicSite';
import AdminDashboard from './pages/AdminDashboard';
import { SettingsIcon } from './components/Icons';
import { PageState } from './types';

const App: React.FC = () => {
  const { siteData, isDataLoaded } = useSiteData();
  const [isAdminView, setIsAdminView] = useState(true);
  const [currentPage, setCurrentPage] = useState<PageState>({ name: 'home' });

  // Apply theme styles dynamically
  useEffect(() => {
    const { colors, typography } = siteData.theme;
    const styleElement = document.getElementById('theme-style');
    if (styleElement) {
      styleElement.innerHTML = `
        :root {
          --color-primary: ${colors.primary};
          --color-secondary: ${colors.secondary};
          --color-accent: ${colors.accent};
          --color-background: ${colors.background};
          --color-text: ${colors.text};
          --font-heading: "${typography.headingFont}", serif;
          --font-body: "${typography.bodyFont}", sans-serif;
        }
        @keyframes shimmer {
            0% {
                background-position: -1000px 0;
            }
            100% {
                background-position: 1000px 0;
            }
        }
        .animate-shimmer {
            animation: shimmer 2.5s infinite linear;
            background: linear-gradient(to right, #e2e8f0 4%, #f1f5f9 25%, #e2e8f0 36%);
            background-size: 2000px 100%;
        }
      `;
    }
  }, [siteData.theme]);
  
  // Apply Tailwind config dynamically
  useEffect(() => {
     const script = document.createElement('script');
     script.innerHTML = `
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              primary: 'var(--color-primary)',
              secondary: 'var(--color-secondary)',
              accent: 'var(--color-accent)',
              'text-base': 'var(--color-text)',
              'bg-base': 'var(--color-background)',
            },
            fontFamily: {
              heading: ['var(--font-heading)', 'serif'],
              body: ['var(--font-body)', 'sans-serif'],
            },
          },
        },
      }
    `;
    document.head.appendChild(script);
  }, []);

  const navigate = (page: PageState) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  if (!isDataLoaded) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 text-green-800 flex-col gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-green-800"></div>
              <div className="font-bold text-lg animate-pulse">Loading Store Data...</div>
          </div>
      );
  }

  return (
    <div className="font-body text-text-base bg-bg-base min-h-screen">
      <div className={isAdminView ? 'hidden' : 'block'}>
        <PublicSite currentPage={currentPage} navigate={navigate} />
      </div>
      <div className={isAdminView ? 'block' : 'hidden'}>
        <AdminDashboard />
      </div>

      {/* Floating button to toggle admin view */}
      <button
        onClick={() => setIsAdminView(!isAdminView)}
        className="fixed bottom-4 right-4 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-opacity-90 transition-transform transform hover:scale-105 z-50"
        aria-label="Toggle Admin Panel"
      >
        <SettingsIcon className="w-6 h-6" />
      </button>
    </div>
  );
};

export default App;
