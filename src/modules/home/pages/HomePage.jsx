import React from 'react';
import HeroSection from '../components/HeroSection';
import HowItWorks from '../components/HowItWorks';
import Features from '../components/Features';

const HomePage = () => {
    return (
        <div className="home-page-container">
            <HeroSection />
            <HowItWorks />
            <Features />
        </div>
    );
};

export default HomePage;