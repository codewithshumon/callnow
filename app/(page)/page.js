"use client";

import { useState } from "react";
import { 
  Phone, 
  MessageSquare, 
  Users, 
  BarChart3, 
  Shield, 
  Zap, 
  CheckCircle,
  ArrowRight,
  Play,
  Star
} from "lucide-react";
import Link from "next/link";

export default function Page() {
  const [email, setEmail] = useState("");

  const features = [
    {
      icon: Phone,
      title: "Smart Dialer",
      description: "One-click calling with customer context. Integrated dialpad with smart suggestions.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: MessageSquare,
      title: "Unified Messaging",
      description: "SMS & WhatsApp integration in one dashboard. Never miss customer communication.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Users,
      title: "Customer Management",
      description: "Complete customer profiles with call history, notes, and interaction tracking.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Real-time call metrics, performance reports, and team insights.",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: Shield,
      title: "Secure & Compliant",
      description: "Enterprise-grade security with GDPR, HIPAA, and TCPA compliance.",
      color: "from-indigo-500 to-blue-500"
    },
    {
      icon: Zap,
      title: "AI-Powered Insights",
      description: "Call transcription, sentiment analysis, and automated follow-ups.",
      color: "from-yellow-500 to-orange-500"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Sales Manager, TechCorp",
      content: "Increased our team's productivity by 40%. The smart dialer is a game-changer.",
      rating: 5,
      avatar: "SJ"
    },
    {
      name: "Mike Rodriguez",
      role: "Customer Support Lead",
      content: "Best call center software we've used. Integration was seamless.",
      rating: 5,
      avatar: "MR"
    },
    {
      name: "Emily Chen",
      role: "Founder, StartUp Co",
      content: "Scaled from 10 to 100 calls/day effortlessly. Highly recommended.",
      rating: 5,
      avatar: "EC"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Phone className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold">CallHub</span>
          </div>
          <div className="flex items-center space-x-6">
            <a href="#features" className="text-white/70 hover:text-white transition">Features</a>
            <a href="#testimonials" className="text-white/70 hover:text-white transition">Testimonials</a>
            <a href="#pricing" className="text-white/70 hover:text-white transition">Pricing</a>
            <Link 
              href="/dashboard" 
              className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 rounded-full font-medium hover:opacity-90 transition"
            >
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <Zap className="h-4 w-4 text-yellow-400" />
            <span className="text-sm">Now with AI-powered call insights</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
            Modern Calling
            <span className="block">Made Simple</span>
          </h1>
          
          <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto">
            The all-in-one call center platform that boosts productivity, enhances customer experience, 
            and scales with your business.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link 
              href="/dashboard" 
              className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-emerald-500/30 transition-all flex items-center justify-center space-x-2 group"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <button className="bg-white/10 backdrop-blur-sm px-8 py-4 rounded-2xl font-bold text-lg border border-white/20 hover:bg-white/15 transition flex items-center justify-center space-x-2">
              <Play className="h-5 w-5" />
              <span>Watch Demo</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            <div className="text-center p-4 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10">
              <div className="text-3xl font-bold mb-2">99.9%</div>
              <div className="text-white/60">Uptime</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10">
              <div className="text-3xl font-bold mb-2">10K+</div>
              <div className="text-white/60">Active Calls</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10">
              <div className="text-3xl font-bold mb-2">50+</div>
              <div className="text-white/60">Integrations</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10">
              <div className="text-3xl font-bold mb-2">24/7</div>
              <div className="text-white/60">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-white/70">Everything you need to run a modern call center</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all hover:scale-[1.02]"
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-white/60">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="container mx-auto px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Loved by Teams</h2>
            <p className="text-xl text-white/70">Join thousands of satisfied customers</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-white/80 mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center font-bold mr-3">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-bold">{testimonial.name}</div>
                    <div className="text-white/60 text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-white/10">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Calling?</h2>
              <p className="text-xl text-white/70 mb-8">Start your 14-day free trial. No credit card required.</p>
              
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your work email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-6 py-3 bg-white/10 border border-white/20 rounded-full text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <Link 
                  href="/dashboard" 
                  className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-3 rounded-full font-bold hover:shadow-2xl hover:shadow-emerald-500/30 transition-all"
                >
                  Get Started
                </Link>
              </div>
              
              <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-white/60">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                  <span>No setup fees</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                  <span>Cancel anytime</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                  <span>24/7 support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Phone className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold">CallHub</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 text-white/60 text-sm">
              <a href="#" className="hover:text-white transition">Privacy Policy</a>
              <a href="#" className="hover:text-white transition">Terms of Service</a>
              <a href="#" className="hover:text-white transition">Cookie Policy</a>
              <a href="#" className="hover:text-white transition">Contact</a>
              <a href="#" className="hover:text-white transition">Documentation</a>
            </div>
            
            <div className="mt-4 md:mt-0 text-white/40 text-sm">
              © 2024 CallHub. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}