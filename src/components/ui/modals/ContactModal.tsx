import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, Copy, Github, GraduationCap, Linkedin, Mail, MapPin, Phone, Send } from 'lucide-react';
import { cvData } from '../../../data/cvData';
import { GameModal } from '../kit/GameModal';
import { tw, UI } from '../kit/theme';
import { Mailbox } from './contact/Mailbox';

// Kit label uses 11px; keep every bit of text at >= 12px here.
const label = tw.label.replace('text-[11px]', 'text-xs');

const prettyUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

const field =
  'w-full rounded-xl border-2 border-[#2b1d16] bg-[#fffaf0] px-3 py-2 text-sm text-[#2b1d16] placeholder:text-[#9a6a43]/70 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#fde68a]';

const LINKS = [
  {
    key: 'email',
    href: `mailto:${cvData.email}`,
    label: 'Email',
    detail: cvData.email,
    icon: <Mail className="w-6 h-6" strokeWidth={2.5} />,
    style: tw.btnPrimary,
    external: false,
  },
  {
    key: 'github',
    href: cvData.github,
    label: 'GitHub',
    detail: prettyUrl(cvData.github),
    icon: <Github className="w-6 h-6" strokeWidth={2.5} />,
    style: 'bg-[#2b1d16] text-[#fffaf0]',
    external: true,
  },
  {
    key: 'linkedin',
    href: cvData.linkedin,
    label: 'LinkedIn',
    detail: prettyUrl(cvData.linkedin),
    icon: <Linkedin className="w-6 h-6" strokeWidth={2.5} />,
    style: tw.btnSky,
    external: true,
  },
];

export const ContactModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const copyTimer = useRef<number | undefined>(undefined);

  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [sentCount, setSentCount] = useState(0);
  const nameId = useId();
  const msgId = useId();

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  const copyEmail = async () => {
    window.clearTimeout(copyTimer.current);
    try {
      await navigator.clipboard.writeText(cvData.email);
      setCopyFailed(false);
      setCopied(true);
    } catch {
      setCopied(false);
      setCopyFailed(true);
    }
    copyTimer.current = window.setTimeout(() => {
      setCopied(false);
      setCopyFailed(false);
    }, 2000);
  };

  const sendPostcard = (e: React.FormEvent) => {
    e.preventDefault();
    const body = message.trim();
    if (!body) return;
    const from = name.trim();
    const subject = `Postcard from ${from || 'a visitor'} (via your 3D CV)`;
    const text = `${body}\n\n${from ? `— ${from}` : ''}`.trim();
    setSentCount((n) => n + 1);
    // Opened synchronously inside the click so pop-up / handler rules allow it.
    window.location.href = `mailto:${cvData.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  };

  return (
    <GameModal
      onClose={onClose}
      icon="📮"
      kicker="The yard mailbox"
      title="Send me a postcard"
      subtitle="Email, socials, or scribble a quick note"
      accent="#2f9e9a"
      width="max-w-4xl"
    >
      <div className="space-y-6">
        {/* ---------- Postcard ---------- */}
        <article
          aria-label="Postcard with contact details"
          className={`${tw.card} relative overflow-hidden grid md:grid-cols-2`}
          style={{ backgroundImage: `repeating-linear-gradient(135deg, ${UI.berry} 0 10px, ${UI.paper} 10px 20px, ${UI.sky} 20px 30px, ${UI.paper} 30px 40px)`, padding: 8 }}
        >
            {/* Left half: greeting + mailbox */}
            <div className="bg-[#fffaf0] rounded-t-[14px] md:rounded-l-[14px] md:rounded-tr-none p-4 sm:p-5 flex flex-col gap-3">
              <p className={`${tw.heading} text-2xl leading-tight`}>Greetings from the cottage! 👋</p>
              <p className={tw.body}>
                Thanks for wandering by. I'm <strong className="text-[#2b1d16]">{cvData.name}</strong> — I build
                high-performance systems (Rust &amp; WebAssembly), machine-learning pipelines and playful 3D things like this
                yard. Hiring, collaborating, or just want to chat about game physics or deep learning? My mailbox is always open.
              </p>
              <Mailbox sentCount={sentCount} className="w-full max-w-[240px] mx-auto mt-auto" />
            </div>

            {/* Right half: stamp + address lines */}
            <div className="bg-[#fffaf0] rounded-b-[14px] md:rounded-r-[14px] md:rounded-bl-none p-4 sm:p-5 border-t-2 md:border-t-0 md:border-l-2 border-dashed border-[#2b1d16]/40 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={label}>To</p>
                  <p className={`${tw.heading} text-xl`}>{cvData.name}</p>
                </div>
                {/* stamp */}
                <div
                  aria-hidden
                  className="shrink-0 w-16 h-20 rotate-3 bg-[#fffaf0] border-2 border-dashed border-[#2b1d16] p-1 shadow-[0_2px_0_0_#2b1d16]"
                >
                  <div className="w-full h-full rounded-sm flex flex-col items-center justify-center text-2xl" style={{ background: `linear-gradient(180deg, ${UI.sky} 55%, ${UI.meadow} 55%)` }}>
                    🏡
                    <span className="text-xs font-black text-white leading-none mt-0.5">₹5</span>
                  </div>
                </div>
              </div>

              <dl className="space-y-2.5">
                <div className="border-b-2 border-[#2b1d16]/15 pb-2">
                  <dt className={label}>Email</dt>
                  <dd className="flex flex-wrap items-center gap-2">
                    <a href={`mailto:${cvData.email}`} className="font-bold text-sm text-[#2b1d16] break-all underline decoration-[#d97706] decoration-2 underline-offset-2 rounded focus:outline-none focus-visible:ring-4 focus-visible:ring-[#fde68a]">
                      {cvData.email}
                    </a>
                    <button
                      type="button"
                      onClick={copyEmail}
                      aria-label={copied ? 'Email copied' : 'Copy email address'}
                      className={`${tw.btn} ${copied ? tw.btnGreen : tw.btnPaper} !px-2 !py-1 !text-xs !shadow-[0_2px_0_0_#2b1d16]`}
                    >
                      {copied ? <Check className="w-4 h-4" strokeWidth={3} /> : <Copy className="w-4 h-4" strokeWidth={2.5} />}
                      <span>{copied ? 'Copied!' : copyFailed ? 'Copy failed' : 'Copy'}</span>
                    </button>
                    <span className="sr-only" aria-live="polite">
                      {copied ? 'Email address copied to clipboard' : copyFailed ? 'Could not copy, please select the address manually' : ''}
                    </span>
                  </dd>
                </div>
                <div className="border-b-2 border-[#2b1d16]/15 pb-2">
                  <dt className={`${label} flex items-center gap-1`}>
                    <GraduationCap className="w-4 h-4" aria-hidden /> Academic mail
                  </dt>
                  <dd>
                    <a href={`mailto:${cvData.iitEmail}`} className="font-bold text-sm text-[#2b1d16] break-all hover:underline rounded focus:outline-none focus-visible:ring-4 focus-visible:ring-[#fde68a]">
                      {cvData.iitEmail}
                    </a>
                  </dd>
                </div>
                <div className="border-b-2 border-[#2b1d16]/15 pb-2">
                  <dt className={`${label} flex items-center gap-1`}>
                    <Phone className="w-4 h-4" aria-hidden /> Phone
                  </dt>
                  <dd>
                    <a href={`tel:${cvData.phone.replace(/[^\d+]/g, '')}`} className="font-bold text-sm text-[#2b1d16] hover:underline rounded focus:outline-none focus-visible:ring-4 focus-visible:ring-[#fde68a]">
                      {cvData.phone}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className={`${label} flex items-center gap-1`}>
                    <MapPin className="w-4 h-4" aria-hidden /> Address
                  </dt>
                  <dd className="font-bold text-sm text-[#2b1d16]">{cvData.location}</dd>
                </div>
              </dl>
            </div>
        </article>

        {/* ---------- Big buttons ---------- */}
        <section aria-label="Contact links">
          <ul className="grid gap-3 sm:grid-cols-3">
            {LINKS.map((l) => (
              <li key={l.key}>
                <a
                  href={l.href}
                  {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className={`${tw.btn} ${l.style} w-full !justify-start !gap-3 !p-3 !rounded-2xl text-left`}
                >
                  <span aria-hidden className="shrink-0 w-11 h-11 rounded-xl bg-white/20 border-2 border-[#2b1d16]/40 flex items-center justify-center">
                    {l.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-base leading-tight">
                      {l.label}
                      {l.external && <span className="sr-only"> (opens in a new tab)</span>}
                    </span>
                    <span className="block text-xs font-semibold opacity-90 break-all">{l.detail}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- Write a postcard ---------- */}
        <section aria-labelledby="contact-write" className={`${tw.inset} p-4 sm:p-5`}>
          <h3 id="contact-write" className={`${tw.heading} text-lg flex items-center gap-2`}>
            <span aria-hidden>✍️</span> Write a postcard
          </h3>
          <p className="text-[13px] text-[#6b4730] mb-3">
            Pops the note into the mailbox and opens your email app with it pre-filled — nothing is stored or sent from this page.
          </p>
          <form onSubmit={sendPostcard} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <div>
              <label htmlFor={nameId} className={label}>
                Your name
              </label>
              <input
                id={nameId}
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ada"
                className={field}
              />
            </div>
            <div>
              <label htmlFor={msgId} className={label}>
                Message
              </label>
              <textarea
                id={msgId}
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hi Hemant! Loved the cottage…"
                className={`${field} resize-y min-h-[84px]`}
              />
            </div>
            <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
              <button type="submit" disabled={!message.trim()} className={`${tw.btn} ${tw.btnGreen} disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0`}>
                <Send className="w-4 h-4" strokeWidth={2.5} aria-hidden />
                Pop it in the mailbox
              </button>
              <p className="text-[13px] font-bold text-[#355f25] min-h-[1.25rem]" aria-live="polite">
                {sentCount > 0 ? '🚩 Flag is up — your postcard is in the mailbox! Finish sending it in your email app.' : ''}
              </p>
            </div>
          </form>
        </section>
      </div>
    </GameModal>
  );
};

export default ContactModal;
