import React from "react";
import { Card } from "../ui/Card";

const services = [
  {
    title: "Smart AI Triage",
    description: "Advanced AI algorithms examine your heartbeat, symptoms, and medical queries to identify potential concerns with clinical accuracy.",
    icon: "psychology",
    color: "primary",
  },
  {
    title: "Instant Appointments",
    description: "Book video consultations or in-person visits in seconds. No more long wait times or complex scheduling protocols.",
    icon: "event_available",
    color: "secondary",
  },
  {
    title: "AI Health Assistant",
    description: "Receive 24/7 personalized guidance, medication reminders, and wellness tips tailored specifically to your history.",
    icon: "support_agent",
    color: "tertiary",
  },
];

export const ServicesGrid = () => {
  return (
    <section className="py-24 bg-surface-container-low">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-on-surface mb-4 font-headline tracking-tight">
            Precision Care at Your Fingertips
          </h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto font-body text-lg">
            Our intelligence-driven platform bridges the gap between you and world-class medical expertise.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card 
              key={index} 
              className="group relative overflow-hidden p-8 border-none hover:translate-y-[-4px] transition-all duration-300"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-container opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className={`mb-6 w-14 h-14 rounded-xl flex items-center justify-center 
                ${service.color === "primary" ? "bg-primary-fixed text-on-primary-fixed" : 
                  service.color === "secondary" ? "bg-secondary-fixed text-on-secondary-fixed" : 
                  "bg-tertiary-fixed text-on-tertiary-fixed"}`}
              >
                <span className="material-symbols-outlined text-3xl">{service.icon}</span>
              </div>
              
              <h3 className="text-xl font-bold text-on-surface mb-3 font-headline tracking-tight">
                {service.title}
              </h3>
              <p className="text-on-surface-variant leading-relaxed font-body">
                {service.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
