import React, { useState } from 'react';
import {
  QrCode,
  X,
  ExternalLink,
  Copy,
  Check,
  Download,
  Smartphone,
  ShieldCheck,
  Globe,
  Sparkles,
  CloudLightning
} from 'lucide-react';

interface PermanentQrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PermanentQrModal: React.FC<PermanentQrModalProps> = ({ isOpen, onClose }) => {
  const [selectedCloud, setSelectedCloud] = useState<'vercel' | 'github'>('vercel');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const vercelUrl = 'https://quantum-classical-disease-risk.vercel.app/';
  const githubUrl = 'https://ishitjainnimsuniversity-ai.github.io/blazefinix/';

  const activeUrl = selectedCloud === 'vercel' ? vercelUrl : githubUrl;
  const activeQrPng = selectedCloud === 'vercel' ? './app_qr_code_vercel.png' : './app_qr_code_github.png';
  const activeQrSvg = selectedCloud === 'vercel' ? './app_qr_code_vercel.svg' : './app_qr_code_github.svg';

  const handleCopy = () => {
    navigator.clipboard.writeText(activeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl shadow-indigo-500/10 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header gradient banner */}
        <div className="p-5 bg-gradient-to-r from-indigo-950 via-slate-900 to-emerald-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Permanent Mobile QR Access</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                  24/7 ONLINE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Independent Cloud Deployment • Zero Local System Dependency
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Permanent Guarantee Card */}
          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-200 flex items-start gap-2.5">
            <CloudLightning className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-white text-xs">Permanent Global Cloud Uptime Guarantee</div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                This QR code links directly to the permanent worldwide cloud deployment. It operates continuously <b>24 hours a day, 365 days a year</b> even if your local computer is completely shut down, logged out, or disconnected.
              </p>
            </div>
          </div>

          {/* Cloud Provider Tabs */}
          <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800">
            <button
              onClick={() => setSelectedCloud('vercel')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                selectedCloud === 'vercel'
                  ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Vercel Edge (Primary Cloud)
            </button>
            <button
              onClick={() => setSelectedCloud('github')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                selectedCloud === 'github'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              GitHub Pages (CDN Mirror)
            </button>
          </div>

          {/* QR Code Center Viewport */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
            <div className="p-3.5 rounded-2xl bg-white shadow-xl shadow-black/60 transition-transform hover:scale-105 duration-200">
              <img
                src={activeQrPng}
                alt="Permanent Scannable App QR Code"
                className="w-52 h-52 object-contain rounded-lg"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
              <Smartphone className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Scan with iPhone Camera or Android Google Lens</span>
            </div>

            {/* URL Display with Copy */}
            <div className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
              <span className="text-sky-300 truncate max-w-[300px] select-all">{activeUrl}</span>
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 transition-colors shrink-0"
                title="Copy link to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-400" /> Copy Link
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Download & Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-semibold">
            <a
              href={activeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center justify-center gap-1.5 transition-colors text-center"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open App
            </a>

            <a
              href={activeQrPng}
              download={`blazefinix_qr_${selectedCloud}.png`}
              className="p-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-1.5 transition-colors text-center"
            >
              <Download className="w-3.5 h-3.5" /> PNG (Image)
            </a>

            <a
              href={activeQrSvg}
              download={`blazefinix_qr_${selectedCloud}.svg`}
              className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 flex items-center justify-center gap-1.5 transition-colors text-center"
            >
              <Download className="w-3.5 h-3.5" /> SVG (Vector)
            </a>
          </div>

          {/* Presentation Card Download Link */}
          <a
            href="./app_qr_presentation_badge.png"
            download="blazefinix_clinical_presentation_qr_badge.png"
            className="w-full py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Download Full Presentation Badge Card (Poster/Print)
          </a>
        </div>

        {/* Footer info pill */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
          <span>SSL/TLS Encrypted • 99.99% Global SLA</span>
          <span className="font-mono text-emerald-400 font-semibold">Permanent Access Active</span>
        </div>
      </div>
    </div>
  );
};
