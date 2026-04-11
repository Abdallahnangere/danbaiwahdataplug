"use client";

import Link from "next/link";
import { Check } from "lucide-react";

const services = [
  {
    category: "Mobile Data",
    icon: "📱",
    plans: [
      { size: "500MB", validity: "Weekly", price: 300, network: "MTN" },
      { size: "1GB", validity: "Weekly", price: 450, network: "All Networks", featured: true },
      { size: "5GB", validity: "Monthly", price: 1500, network: "All Networks" },
      { size: "20GB", validity: "Monthly", price: 7500, network: "All Networks" },
    ]
  },
  {
    category: "Airtime Top-up",
    icon: "📞",
    plans: [
      { amount: "₦500", networks: "All Networks", price: 500 },
      { amount: "₦1,000", networks: "All Networks", price: 1000, featured: true },
      { amount: "₦5,000", networks: "All Networks", price: 5000 },
      { amount: "₦10,000", networks: "All Networks", price: 10000 },
    ]
  },
  {
    category: "Electricity & Bills",
    icon: "⚡",
    plans: [
      { disco: "AEDC, IKEDC, EKEDC", min: "Minimum ₦1,000", price: "Variable" },
      { disco: "PHCN, KEDCO, EKED", min: "Prepaid & Postpaid", price: "Variable", featured: true },
      { disco: "All 11 Nigerian DISCOs", min: "24/7 Payment", price: "Variable" },
    ]
  },
  {
    category: "Cable TV Subscription",
    icon: "📺",
    plans: [
      { provider: "DSTV", plan: "Starter Pack", price: 2500 },
      { provider: "GOtv", plan: "Max Plan", price: 4500, featured: true },
      { provider: "Startimes", plan: "Premium Plan", price: 3500 },
    ]
  },
  {
    category: "Exam PINs",
    icon: "📚",
    plans: [
      { exam: "WAEC", quantity: "1-5 PINs", price: 5500 },
      { exam: "NECO", quantity: "1-5 PINs", price: 4500, featured: true },
      { exam: "NABTEB", quantity: "1-5 PINs", price: 6500 },
    ]
  },
];

export function PlansSection() {
  return (
    <section id="pricing" className="relative bg-white py-16 sm:py-24 px-6 sm:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-black mb-4">
            Everything You Need, All in One App
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Buy data, pay bills, subscribe to cable, get airtime, and grab exam PINs. No hidden fees. Transparent pricing.
          </p>
        </div>

        {/* Service tabs - grid layout */}
        <div className="space-y-12">
          {services.map((service, idx) => (
            <div key={idx} className="mb-12">
              {/* Service header */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">{service.icon}</span>
                <h3 className="text-2xl font-bold text-black">{service.category}</h3>
              </div>

              {/* Plans grid for this service */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {service.plans.map((plan, pidx) => (
                  <div
                    key={pidx}
                    className={`relative rounded-lg border transition-all p-5 ${
                      plan.featured
                        ? "border-black bg-black text-white shadow-lg ring-2 ring-orange-500"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    {plan.featured && (
                      <div className="absolute -top-3 left-4 px-3 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full">
                        Popular
                      </div>
                    )}

                    <div className="space-y-3">
                      {/* Service-specific display */}
                      {service.category === "Mobile Data" && (
                        <>
                          <h4 className={`text-2xl font-bold ${plan.featured ? 'text-white' : 'text-black'}`}>
                            {(plan as any).size}
                          </h4>
                          <p className={`text-xs ${plan.featured ? 'text-gray-300' : 'text-gray-600'}`}>
                            {(plan as any).validity}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded-full inline-block ${
                            plan.featured ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {(plan as any).network}
                          </span>
                          <div className={`text-3xl font-bold ${plan.featured ? 'text-white' : 'text-black'}`}>
                            ₦{(plan as any).price.toLocaleString()}
                          </div>
                        </>
                      )}

                      {service.category === "Airtime Top-up" && (
                        <>
                          <h4 className={`text-2xl font-bold ${plan.featured ? 'text-white' : 'text-black'}`}>
                            {(plan as any).amount}
                          </h4>
                          <p className={`text-sm ${plan.featured ? 'text-gray-300' : 'text-gray-600'}`}>
                            {(plan as any).networks}
                          </p>
                          <div className={`text-3xl font-bold ${plan.featured ? 'text-white' : 'text-black'}`}>
                            ₦{(plan as any).price?.toLocaleString()}
                          </div>
                        </>
                      )}

                      {service.category === "Electricity & Bills" && (
                        <>
                          <h4 className={`text-lg font-bold ${plan.featured ? 'text-white' : 'text-black'}`}>
                            {(plan as any).disco}
                          </h4>
                          <p className={`text-sm ${plan.featured ? 'text-gray-300' : 'text-gray-600'}`}>
                            {(plan as any).min}
                          </p>
                        </>
                      )}

                      {service.category === "Cable TV Subscription" && (
                        <>
                          <h4 className={`text-lg font-bold ${plan.featured ? 'text-white' : 'text-black'}`}>
                            {(plan as any).provider}
                          </h4>
                          <p className={`text-sm ${plan.featured ? 'text-gray-300' : 'text-gray-600'}`}>
                            {(plan as any).plan}
                          </p>
                          <div className={`text-2xl font-bold ${plan.featured ? 'text-white' : 'text-black'}`}>
                            ₦{(plan as any).price?.toLocaleString()}
                          </div>
                        </>
                      )}

                      {service.category === "Exam PINs" && (
                        <>
                          <h4 className={`text-lg font-bold ${plan.featured ? 'text-white' : 'text-black'}`}>
                            {(plan as any).exam}
                          </h4>
                          <p className={`text-sm ${plan.featured ? 'text-gray-300' : 'text-gray-600'}`}>
                            {(plan as any).quantity}
                          </p>
                          <div className={`text-2xl font-bold ${plan.featured ? 'text-white' : 'text-black'}`}>
                            ₦{(plan as any).price?.toLocaleString()}
                          </div>
                        </>
                      )}

                      {/* CTA Button */}
                      <button
                        className={`w-full py-2 rounded-lg font-semibold transition-colors text-sm mt-4 ${
                          plan.featured
                            ? 'bg-white text-black hover:bg-gray-100'
                            : 'border border-gray-300 text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 pt-12 border-t border-gray-200">
          <p className="text-gray-600 mb-6">Competitive rates across all services. No hidden charges.</p>
          <Link
            href="/app"
            className="inline-block px-8 py-3 bg-gradient-to-r from-cyan-400 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Start Shopping Now
          </Link>
        </div>
      </div>
    </section>
  );
}
