"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What services does DANBAIWA offer?",
    answer:
      "We offer 5 core services: Mobile Data (MTN, Glo, Airtel, 9Mobile), Airtime Top-ups, Electricity Bill Payments (all 11 Nigerian DISCOs), Cable TV Subscriptions (DSTV, GOtv, Startimes), and Exam PINs (WAEC, NECO, NABTEB).",
  },
  {
    question: "How fast is delivery?",
    answer:
      "Most transactions complete within 2-5 seconds. Data is delivered instantly to your line, airtime is credited immediately, and utility payments are processed in real-time.",
  },
  {
    question: "Which networks do you support?",
    answer:
      "We support all major Nigerian networks: MTN, Glo, Airtel, and 9Mobile for data and airtime. For electricity, we cover all 11 DISCOs nationwide.",
  },
  {
    question: "Is my money safe on DANBAIWA?",
    answer:
      "Yes! All payments are processed securely using industry-standard encryption. Your funds are protected with bank-grade security protocols, and your PIN is hashed with bcryptjs.",
  },
  {
    question: "How do I create an account?",
    answer:
      "Creating an account is simple: Enter your phone number, set a 6-digit PIN, and you're done. The entire process takes less than 60 seconds. No documents or emails required.",
  },
  {
    question: "Can I buy without creating an account?",
    answer:
      "Yes! Guest purchases are available for data. Simply enter your phone number and recipient details. However, creating an account gives you access to exclusive rewards and better rates.",
  },
  {
    question: "What if I forget my PIN?",
    answer:
      "You can reset your PIN in the login screen. Follow the verification process with your phone number and you'll be able to set a new 6-digit PIN.",
  },
  {
    question: "How do I check my transaction history?",
    answer:
      "Your complete transaction history is available in the app dashboard. You can view all purchases, deposits, and refunds with timestamps and status updates.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="relative bg-white py-16 sm:py-24 px-6 sm:px-8 lg:px-12">
      <div className="max-w-3xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-black mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600">
            Find answers to common questions about DANBAIWA DATA PLUG.
          </p>
        </div>

        {/* FAQ Accordion */}
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border-b border-gray-200 py-4"
            >
              <AccordionTrigger className="text-left font-semibold text-black hover:text-gray-700 transition-colors text-base">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 text-base pt-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Contact section */}
        <div className="mt-12 text-center pt-12 border-t border-gray-200">
          <p className="text-gray-600 mb-4">
            Can't find what you're looking for?
          </p>
          <a
            href="mailto:support@danbaiwa.com"
            className="inline-block text-black font-semibold hover:text-gray-700 transition-colors"
          >
            Contact our support team
          </a>
        </div>
      </div>
    </section>
  );
}
