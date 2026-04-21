import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/layout/Hero";
import { ServicesGrid } from "@/components/layout/ServicesGrid";
import { HowItWorks } from "@/components/layout/HowItWorks";
import { DoctorCarousel } from "@/components/layout/DoctorCarousel";
import { Footer } from "@/components/layout/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <ServicesGrid />
      
      {/* Editorial Trust Section */}
      <section className="py-24 overflow-hidden bg-surface">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2 order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                <div className="bg-surface-container-high rounded-2xl p-4 md:p-8 flex flex-col justify-end min-h-[140px] md:min-h-[220px]">
                  <span className="text-2xl md:text-4xl font-extrabold text-primary mb-1 md:mb-2 font-headline tracking-tighter">15k+</span>
                  <span className="text-[10px] md:text-sm font-bold text-on-surface-variant tracking-wider font-headline leading-tight">Patients Served</span>
                </div>
                <div className="bg-primary text-white rounded-2xl p-4 md:p-8 flex flex-col justify-end min-h-[140px] md:min-h-[220px] mt-4 md:mt-8 shadow-lg shadow-primary/20">
                  <span className="text-2xl md:text-4xl font-extrabold mb-1 md:mb-2 font-headline tracking-tighter">99%</span>
                  <span className="text-[10px] md:text-sm font-medium opacity-80 tracking-wider font-headline leading-tight">Doctor Satisfaction</span>
                </div>
                <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-4 md:p-8 flex flex-col justify-end min-h-[140px] md:min-h-[220px] -mt-4 md:-mt-8 shadow-ambient">
                  <span className="material-symbols-outlined text-primary text-2xl md:text-4xl mb-2 md:mb-4 fill-1">verified_user</span>
                  <span className="text-[10px] md:text-sm font-bold text-on-surface tracking-wider font-headline leading-tight">HIPAA Secure</span>
                </div>
                <div className="bg-secondary-container text-on-secondary-container rounded-2xl p-4 md:p-8 flex flex-col justify-end min-h-[140px] md:min-h-[220px]">
                  <span className="text-2xl md:text-4xl font-extrabold mb-1 md:mb-2 font-headline tracking-tighter">500+</span>
                  <span className="text-[10px] md:text-sm font-bold tracking-wider font-headline leading-tight">Verified Doctors</span>
                </div>
              </div>
            </div>
            
            <div className="lg:w-1/2 order-1 lg:order-2 space-y-8">
              <h2 className="text-4xl md:text-6xl font-extrabold leading-tight font-headline tracking-tight">
                Trust Grounded in Innovation.
              </h2>
              <p className="text-lg text-on-surface-variant leading-relaxed font-body">
                HealBook isn't just a scheduling tool—it's a clinical-grade ecosystem. We combine the latest in secure cloud technology with a rigorous verification process for every practitioner.
              </p>
              <ul className="space-y-4">
                {[
                  "Multi-layer encryption for all medical records",
                  "Rigorous background checks for every specialist",
                  "Seamless integration with your existing insurance"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary mt-0.5">check_circle</span>
                    <span className="text-on-surface-variant font-body">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <HowItWorks />
      <DoctorCarousel />

      {/* Testimonials Teaser */}
      <section className="py-24 bg-inverse-surface text-inverse-on-surface">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold mb-4 font-headline tracking-tight">Patient Voices</h2>
              <p className="opacity-60 max-w-md font-body text-lg">Real stories from people who found health and harmony with HealBook.</p>
            </div>
            <div className="flex gap-4">
              <button className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <button className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors">
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                quote: "The symptom checker accurately identified a respiratory issue I'd been ignoring. Truly life-changing.",
                name: "Sarah Jenkins",
                role: "Marketing Executive",
                img: "https://randomuser.me/api/portraits/women/11.jpg"
              },
              {
                quote: "Managing my chronic condition used to be a full-time job. HealBook's Ai Assistant handles my prescriptions and reminders.",
                name: "Michael Rossi",
                role: "Software Architect",
                img: "https://randomuser.me/api/portraits/men/12.jpg"
              }
            ].map((t, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-md p-10 rounded-2xl border border-white/10 hover:border-white/20 transition-all">
                <span className="material-symbols-outlined text-primary-container text-5xl mb-6 opacity-40">format_quote</span>
                <p className="text-xl leading-relaxed italic mb-8 font-body opacity-90">"{t.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden grayscale">
                    <img src={t.img} alt={t.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold font-headline">{t.name}</h4>
                    <p className="text-sm opacity-50 font-body">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
