import React from 'react';
import * as d3 from 'd3';
import { ArrowRightIcon, ChartBarIcon, CubeTransparentIcon, SparklesIcon } from '@heroicons/react/24/outline';
import AnimatedBackground from './AnimatedBackground';
import Logo from './Logo';

const LandingPage = ({ onStarted }) => {
  // eslint-disable-next-line no-unused-vars
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD'];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <AnimatedBackground />
      
      {/* Navigation */}
      <nav className="relative z-20 px-4 sm:px-6 lg:px-8 py-4 bg-white/70 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Logo className="h-10 w-10 transform hover:rotate-180 transition-transform duration-500 logo" />
            <span className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              MappingMaker
            </span>
          </div>
          <button
            onClick={onStarted}
            className="px-4 py-2 bg-gradient-to-r from-green-400 to-yellow-400 text-white font-semibold rounded-lg shadow-md hover:from-green-500 hover:to-yellow-500 transform hover:scale-105 transition-all duration-200"
          >
            Connexion
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Visualisez votre</span>{' '}
                  <span className="block text-green-500 xl:inline">écosystème d'affaires</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Cartographiez, analysez et optimisez vos relations d'affaires en un clin d'œil.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <button
                      onClick={onStarted}
                      className="px-6 py-4 bg-gradient-to-r from-green-400 to-yellow-400 text-white font-bold rounded-lg shadow-md hover:from-green-500 hover:to-yellow-500 transform hover:scale-105 transition-all duration-200 flex items-center"
                    >
                      Explorer mon écosystème
                      <ArrowRightIcon className="ml-2 h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 to-yellow-400 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
              <div className="relative p-6 bg-white rounded-lg">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-400 to-yellow-400 flex items-center justify-center">
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Visualisation intuitive</h3>
                <p className="mt-2 text-base text-gray-500">
                  Créez des cartographies claires et interactives de votre écosystème d'affaires.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 to-yellow-400 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
              <div className="relative p-6 bg-white rounded-lg">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-400 to-yellow-400 flex items-center justify-center">
                  <CubeTransparentIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Analyse approfondie</h3>
                <p className="mt-2 text-base text-gray-500">
                  Identifiez les opportunités et optimisez vos relations d'affaires.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 to-yellow-400 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
              <div className="relative p-6 bg-white rounded-lg">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-400 to-yellow-400 flex items-center justify-center">
                  <SparklesIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Collaboration en temps réel</h3>
                <p className="mt-2 text-base text-gray-500">
                  Partagez et collaborez sur vos cartographies avec votre équipe.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            <span className="block">Prêt à commencer ?</span>
            <span className="block text-green-500">Créez votre première cartographie aujourd'hui.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <button
                onClick={onStarted}
                className="px-6 py-4 bg-gradient-to-r from-green-400 to-yellow-400 text-white font-bold rounded-lg shadow-md hover:from-green-500 hover:to-yellow-500 transform hover:scale-105 transition-all duration-200 flex items-center"
              >
                Commencer maintenant
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex items-center justify-center space-x-3 md:order-2">
            <Logo className="h-6 w-6 logo" />
            <span className="font-semibold text-gray-900">MappingMaker</span>
          </div>
          <div className="flex justify-center space-x-6 md:order-2">
            {[
              { name: 'À propos', href: '#' },
              { name: 'Contact', href: '#' },
              { name: 'Confidentialité', href: '#' }
            ].map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                {item.name}
              </a>
            ))}
          </div>
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-base text-gray-600">
              &copy; 2024 Mapping Maker. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
