"use client";

import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Chioma Adeyemi",
    location: "Lagos, Nigeria",
    quote:
      "I've tried so many data platforms, but SY DATA SUB is on another level. Instant delivery, best prices, and the PIN security is genius. Highly recommended!",
    rating: 5,
  },
  {
    name: "Tunde Okonkwo",
    location: "Abuja, Nigeria",
    quote:
      "The app feels like a native iOS app. Super smooth, super fast. Their customer service is incredible too. Worth every naira.",
    rating: 5,
  },
  {
    name: "Zainab Hassan",
    location: "Kano, Nigeria",
    quote:
      "Finally, a platform that doesn't play games with data pricing. I save money every month using SY DATA SUB. The dedicated account number is a game changer.",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="relative py-20 sm:py-32 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section title */}
        <div
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-4">
            Loved by Nigerians
          </h2>
          <p className="text-xl text-slate-300">
            Join thousands of satisfied customers who've made the switch.
          </p>
        </div>

        {/* Testimonials grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="group"
            >
              <div className="h-full p-8 rounded-2xl border border-slate-700/50 hover:border-teal-500/50 transition-all duration-300 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm hover:shadow-lg hover:shadow-teal-500/10">
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-slate-300 mb-6 leading-relaxed text-sm">
                  "{testimonial.quote}"
                </p>

                {/* Author */}
                <div>
                  <p className="font-semibold text-white">
                    {testimonial.name}
                  </p>
                  <p className="text-slate-400 text-sm">
                    {testimonial.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-teal-400 mb-2">10k+</div>
            <p className="text-slate-400">Happy Customers</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-teal-400 mb-2">4.9★</div>
            <p className="text-slate-400">Average Rating</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-teal-400 mb-2">99.9%</div>
            <p className="text-slate-400">Success Rate</p>
          </div>
        </div>
      </div>
    </section>
  );
}
