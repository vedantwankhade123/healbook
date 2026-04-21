import React from "react";

const steps = [
  {
    number: "01",
    title: "Ask AI",
    description: "Use our intelligent AI tool to quickly describe what you're feeling and get instant, clinical-grade guidance.",
    active: false,
  },
  {
    number: "02",
    title: "Choose Doctor",
    description: "Browse curated specialists, check their profiles, and pick the right one for your needs.",
    active: true,
  },
  {
    number: "03",
    title: "Start Consultation",
    description: "Get professional care via secure video call or book an in-person clinic visit.",
    active: false,
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 font-headline tracking-tight">
            Your Path to Wellness
          </h2>
          <p className="text-on-surface-variant text-lg font-body">
            Three simple steps to better health.
          </p>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Connector Line (Desktop) */}
          <div className="absolute top-1/2 left-0 w-full h-px bg-outline-variant/20 -translate-y-1/2 hidden md:block" />
          
          {steps.map((step, index) => (
            <div key={index} className="relative z-10 text-center group">
              <div className={`
                w-20 h-20 rounded-full shadow-lg flex items-center justify-center mx-auto mb-8 
                transition-all duration-300 border-4 border-surface
                ${step.active 
                  ? "bg-primary text-white scale-110 ring-8 ring-primary/10" 
                  : "bg-surface-container-lowest text-primary border-outline-variant/10 group-hover:scale-105"
                }
              `}>
                <span className="text-2xl font-black font-headline tracking-tighter">{step.number}</span>
              </div>
              <h3 className="text-xl font-bold mb-3 font-headline tracking-tight">{step.title}</h3>
              <p className="text-on-surface-variant px-4 font-body leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
