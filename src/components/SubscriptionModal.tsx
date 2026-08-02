import React, { useState } from 'react';
import { X, Check, Sparkles, Shield, Cpu, Zap, CreditCard, Gift, RefreshCw, Layers, FileText, Globe, Flame } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: 'free' | 'pro' | 'max';
  onUpgradePlan?: (plan: 'free' | 'pro' | 'max') => void;
}

export default function SubscriptionModal({
  isOpen,
  onClose,
  currentPlan = 'free',
  onUpgradePlan
}: SubscriptionModalProps) {
  const [activeTab, setActiveTab] = useState<'personal' | 'education' | 'business'>('personal');
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');
  const [selectedPlanToCheckout, setSelectedPlanToCheckout] = useState<'pro' | 'max' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleContinueFree = () => {
    if (onUpgradePlan) {
      onUpgradePlan('free');
    }
    onClose();
  };

  const handleCheckout = (plan: 'pro' | 'max') => {
    setSelectedPlanToCheckout(plan);
    setIsProcessing(true);
    
    setTimeout(() => {
      setIsProcessing(false);
      setCheckoutSuccess(plan);
      if (onUpgradePlan) {
        onUpgradePlan(plan);
      }
      setTimeout(() => {
        setCheckoutSuccess(null);
        setSelectedPlanToCheckout(null);
        onClose();
      }, 1800);
    }, 1200);
  };

  const proPrice = billingCycle === 'annual' ? 'US$17' : 'US$20';
  const maxPrice = billingCycle === 'annual' ? 'US$167' : 'US$199';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl rounded-2xl bg-[#121315] border border-zinc-800 shadow-2xl overflow-hidden my-auto text-zinc-100 p-6 md:p-10 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Prominent High-Contrast Close Button */}
        <button
          onClick={onClose}
          className="sticky top-0 right-0 float-right z-50 p-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-600 shadow-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 group -mt-2 -mr-2 mb-2"
          title="Close Modal (Esc)"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-zinc-200 group-hover:text-white transition-colors" />
          <span className="text-xs font-semibold pr-1 hidden sm:inline">Close</span>
        </button>

        {/* Success Banner */}
        {checkoutSuccess ? (
          <div className="py-16 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Check className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-bold text-white">Welcome to Vibranium {checkoutSuccess === 'pro' ? 'Pro' : 'Max'}!</h3>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              Your account has been upgraded successfully. You now have full unlocked access to top AI reasoning models and enhanced capabilities.
            </p>
          </div>
        ) : (
          <>
            {/* Header section */}
            <div className="text-center space-y-3 mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>Next-Generation Intelligence Plans</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Supercharge your workflow with Vibranium AI
              </h2>
              <p className="text-sm text-zinc-400 max-w-xl mx-auto">
                Select a tier to unlock advanced AI reasoning models, real-time web citations, and deep research tools.
              </p>

              {/* Personal / Education / Business Tabs & Annual Toggle */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="inline-flex items-center rounded-full bg-zinc-900/90 border border-zinc-800 p-1 text-xs font-semibold">
                  <button
                    onClick={() => setActiveTab('personal')}
                    className={`px-4 py-1.5 rounded-full transition-all ${
                      activeTab === 'personal'
                        ? 'bg-zinc-800 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Personal
                  </button>
                  <button
                    onClick={() => setActiveTab('education')}
                    className={`px-4 py-1.5 rounded-full transition-all ${
                      activeTab === 'education'
                        ? 'bg-zinc-800 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Education
                  </button>
                  <button
                    onClick={() => setActiveTab('business')}
                    className={`px-4 py-1.5 rounded-full transition-all ${
                      activeTab === 'business'
                        ? 'bg-zinc-800 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Business
                  </button>
                </div>

                {/* Billing Cycle Toggle */}
                <div className="inline-flex items-center rounded-full bg-zinc-900 border border-zinc-800 p-1 text-xs font-semibold">
                  <button
                    onClick={() => setBillingCycle('annual')}
                    className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                      billingCycle === 'annual'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span>Annual</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-full font-bold">Save 15%</span>
                  </button>
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-3 py-1 rounded-full transition-all ${
                      billingCycle === 'monthly'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              </div>
            </div>

            {/* Billing Cards Grid */}
            <div className="grid md:grid-cols-2 gap-6 items-stretch">
              {/* Card 1: Vibranium Pro */}
              <div className="relative rounded-2xl bg-[#18191c] border border-zinc-800 p-6 flex flex-col justify-between hover:border-indigo-500/50 transition-all">
                <div>
                  {/* Badges */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[11px] font-bold text-indigo-400 bg-indigo-950/60 border border-indigo-800/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Zap className="h-3 w-3 text-indigo-400" />
                      Enhanced Intelligence
                    </span>
                    <span className="text-[10px] font-semibold text-zinc-400 border border-zinc-700/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Popular
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xl font-extrabold text-white tracking-tight lowercase">
                      vibranium <span className="text-indigo-400 font-bold capitalize">pro</span>
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-400 mb-6">
                    Ideal for developers, analysts, and everyday power users needing top AI model access.
                  </p>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-white">{proPrice}</span>
                      <span className="text-xs text-zinc-400">/month {billingCycle === 'annual' ? '(billed annually)' : '(billed monthly)'}</span>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-3 pt-2 text-xs text-zinc-300 border-t border-zinc-800/80">
                    <div className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>Access to Pro AI models: <strong>Gemini 3.1 Pro, Sonar 2, GPT-5.6 Terra, Claude Sonnet 5, GLM 5.2, Kimi K3, Grok 4.5</strong></span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>500 High-Speed Reasoning requests daily</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>Real-time Live Web Search & Citation grounding</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>Document & Image Parsing (PDFs, code, sheets up to 50MB)</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>Real-Time Voice Dictation & Multilingual Translator</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>Priority response processing speed</span>
                    </div>
                  </div>
                </div>

                {/* Button */}
                <div className="pt-8">
                  <button
                    id="subscription-get-pro-btn"
                    onClick={() => handleCheckout('pro')}
                    disabled={isProcessing || currentPlan === 'pro'}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-white hover:bg-zinc-200 text-black transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessing && selectedPlanToCheckout === 'pro' ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-black" />
                    ) : currentPlan === 'pro' ? (
                      'Current Plan'
                    ) : (
                      'Get Pro'
                    )}
                  </button>
                </div>
              </div>

              {/* Card 2: Vibranium Max */}
              <div className="relative rounded-2xl bg-gradient-to-b from-[#1e1b2e] to-[#18191c] border-2 border-purple-500/70 p-6 flex flex-col justify-between hover:border-purple-400 transition-all shadow-xl shadow-purple-950/30">
                <div>
                  {/* Badges */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[11px] font-bold text-purple-300 bg-purple-950/80 border border-purple-700/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Flame className="h-3 w-3 text-purple-400" />
                      Unrestricted Tier
                    </span>
                    <span className="text-[10px] font-semibold text-purple-300 border border-purple-700/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Ultimate
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xl font-extrabold text-white tracking-tight lowercase">
                      vibranium <span className="text-purple-400 font-bold capitalize">max</span>
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-400 mb-6">
                    Built for research labs, senior engineers, and power users demanding total performance.
                  </p>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-white">{maxPrice}</span>
                      <span className="text-xs text-zinc-400">/month {billingCycle === 'annual' ? '(billed annually)' : '(billed monthly)'}</span>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-3 pt-2 text-xs text-zinc-300 border-t border-purple-900/40">
                    <div className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                      <span className="font-semibold text-white">Everything in Pro, plus:</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                      <span>Access to flagship reasoning models: <strong>Claude Opus 5, GPT-5.6 Sol & Nemotron 3 Ultra</strong></span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                      <span>Unlimited reasoning & search queries with zero daily throttling</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                      <span>Autonomous Deep Research Agent (multi-source synthesis & report builder)</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                      <span>Extended 1,000,000 Token Context Window for large codebases & papers</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                      <span>Multi-model side-by-side response comparison engine</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                      <span>Priority VIP access to upcoming experimental AI tools</span>
                    </div>
                  </div>
                </div>

                {/* Button */}
                <div className="pt-8">
                  <button
                    id="subscription-get-max-btn"
                    onClick={() => handleCheckout('max')}
                    disabled={isProcessing || currentPlan === 'max'}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40"
                  >
                    {isProcessing && selectedPlanToCheckout === 'max' ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    ) : currentPlan === 'max' ? (
                      'Current Plan'
                    ) : (
                      'Get Max'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer & Dismiss Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-8 pt-4 border-t border-zinc-800/80">
              <p className="text-[11px] text-zinc-500 text-center sm:text-left">
                Cancel or change your subscription anytime. Terms & conditions apply.
              </p>
              <button
                type="button"
                onClick={handleContinueFree}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/80 transition-colors cursor-pointer"
              >
                Continue with Free Plan
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

