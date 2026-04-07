'use client';

type BookCoverMockupProps = {
  className?: string;
  rotateClassName?: string;
  variant?: 'home' | 'detail';
};

function PdcaLoopGlyph({ isHome }: { isHome: boolean }) {
  return (
    <div
      className={
        isHome
          ? 'mb-[6.5%] w-full max-w-[34%] text-white/45'
          : 'mb-[6.5%] w-full max-w-[35%] text-white/45'
      }
      aria-hidden="true"
    >
      <svg viewBox="0 0 160 56" className="h-auto w-full" fill="none">
        <defs>
          <linearGradient id="pdca-loop-stroke" x1="20" y1="10" x2="140" y2="46" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f28b45" stopOpacity="0.92" />
            <stop offset="1" stopColor="#d7dceb" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <path
          d="M36 28c0-8 6-14 14-14h30m44 0h-14c8 0 14 6 14 14m0 0c0 8-6 14-14 14H80m-44 0h14c-8 0-14-6-14-14Z"
          stroke="url(#pdca-loop-stroke)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="m74 10 6 4-6 4" stroke="#f28b45" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m130 24-4 6-4-6" stroke="#f28b45" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m86 46-6-4 6-4" stroke="#f28b45" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m30 32 4-6 4 6" stroke="#f28b45" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="34" cy="28" r="2.6" fill="#d7dceb" fillOpacity="0.38" />
        <circle cx="80" cy="14" r="2.6" fill="#d7dceb" fillOpacity="0.28" />
        <circle cx="126" cy="28" r="2.6" fill="#d7dceb" fillOpacity="0.3" />
        <circle cx="80" cy="42" r="2.6" fill="#d7dceb" fillOpacity="0.24" />
      </svg>
    </div>
  );
}

const COVER_TAG = '\u5de5\u7a0b\u5e08\u7238\u7238\u4eb2\u6d4b\u7248';
const TITLE_LINE_1_PREFIX = '\u4ece';
const TITLE_LINE_1_HIGHLIGHT = '\u9519\u8bef';
const TITLE_LINE_1_SUFFIX = '\u5f00\u59cb';
const TITLE_LINE_2 = '\u4e00\u5957\u771f\u6b63\u80fd\u95ed\u73af\u7684';
const TITLE_LINE_3 = '\u5b66\u4e60\u7cfb\u7edf';
const SUBTITLE_PREFIX = '\u7528\u5de5\u5382\u7ba1\u7406\u903b\u8f91\u91cd\u5efa\u5b69\u5b50\u7684';
const SUBTITLE_SUFFIX = '\u5b66\u4e60\u65b9\u5f0f';
const AUTHOR = '\u5de5\u7a0b\u7238 \u00b7 \u5173\u535a';
const AUTHOR_NOTE = '\u516c\u4f17\u53f7\u300c\u5de5\u7a0b\u7238\u7684AI\u8fdb\u5316\u5de5\u5382\u300d';
const CONCEPTS = '5 Why \u00b7 \u8d39\u66fc\u5b66\u4e60\u6cd5 \u00b7 \u827e\u5bbe\u6d69\u65af\u9057\u5fd8\u66f2\u7ebf \u00b7 PDCA\u95ed\u73af';
const FLOW_STEPS = ['P', 'D', 'C', 'A'];

export default function BookCoverMockup({
  className = '',
  rotateClassName = '',
  variant = 'detail',
}: BookCoverMockupProps) {
  const isHome = variant === 'home';
  const frameClass = isHome
    ? 'absolute inset-x-[8.5%] inset-y-[4.8%] rounded-[22px] border border-white/[0.07]'
    : 'absolute inset-x-[8.8%] inset-y-[5.1%] rounded-[22px] border border-white/[0.07]';

  const shadowClass = isHome
    ? 'absolute inset-x-[9%] bottom-[-2%] top-[4%] rounded-[48px] bg-[#0d1426]/24 blur-[34px]'
    : 'absolute inset-x-[12%] bottom-[-1.6%] top-[5.5%] rounded-[42px] bg-[#0d1426]/20 blur-[28px]';
  const spineClass = isHome
    ? 'absolute bottom-[1.2%] left-[2%] top-[1.2%] w-[8.8%] rounded-l-[24px] bg-gradient-to-b from-[#7a88a4] via-[#55627f] to-[#37415b] shadow-[inset_-1px_0_0_rgba(255,255,255,0.16),inset_1px_0_0_rgba(15,23,42,0.28)]'
    : 'absolute bottom-[1.35%] left-[2.5%] top-[1.35%] w-[7.9%] rounded-l-[22px] bg-gradient-to-b from-[#75839d] via-[#505d79] to-[#343e57] shadow-[inset_-1px_0_0_rgba(255,255,255,0.14),inset_1px_0_0_rgba(15,23,42,0.24)]';
  const spineTextClass = isHome
    ? 'absolute inset-y-[8%] left-[35%] text-[7px] tracking-[0.24em] text-white/22'
    : 'absolute inset-y-[8%] left-[37%] text-[6px] tracking-[0.22em] text-white/20';
  const coverShellClass = isHome
    ? 'absolute inset-y-0 left-[7.8%] right-0 overflow-hidden rounded-[0_26px_26px_8px] border border-[#dce2ee]/24 bg-[#1a2744] shadow-[0_24px_56px_rgba(15,23,42,0.3),inset_0_1px_0_rgba(255,255,255,0.08)]'
    : 'absolute inset-y-0 left-[7.1%] right-0 overflow-hidden rounded-[0_24px_24px_8px] border border-[#dce2ee]/22 bg-[#1a2744] shadow-[0_22px_48px_rgba(15,23,42,0.27),inset_0_1px_0_rgba(255,255,255,0.07)]';
  const contentPaddingClass = isHome ? 'px-[10.5%] py-[9%]' : 'px-[10.8%] py-[9.2%]';
  const titleLine1Class = isHome
    ? 'whitespace-nowrap text-[clamp(2rem,5vw,3rem)] leading-[0.96] tracking-[0.03em]'
    : 'whitespace-nowrap text-[clamp(2rem,4.9vw,3.12rem)] leading-[0.96] tracking-[0.035em]';
  const titleLine2Class = isHome
    ? 'mt-[1.2em] text-[clamp(0.94rem,2.25vw,1.3rem)] leading-[1.38] tracking-[0.13em] text-white/94'
    : 'mt-[1.24em] text-[clamp(0.9rem,2.08vw,1.18rem)] leading-[1.38] tracking-[0.12em] text-white/94';
  const titleLine3Class = isHome
    ? 'mt-[0.22em] text-[clamp(0.94rem,2.25vw,1.3rem)] leading-[1.38] tracking-[0.13em] text-[#d5dbeb]'
    : 'mt-[0.24em] text-[clamp(0.9rem,2.08vw,1.18rem)] leading-[1.38] tracking-[0.12em] text-[#d5dbeb]';
  const subtitleClass = isHome
    ? 'mt-[7.2%] max-w-[88%] font-sans text-[0.64rem] font-medium leading-[1.78] tracking-[0.03em] text-[#d4daea] sm:text-[0.72rem]'
    : 'mt-[7.2%] max-w-[88%] font-sans text-[0.6rem] font-medium leading-[1.78] tracking-[0.03em] text-[#d4daea] sm:text-[0.68rem]';
  const conceptsBlockClass = isHome
    ? 'w-full max-w-[72%]'
    : 'w-full max-w-[74%]';
  const pdcaWrapClass = isHome
    ? 'mb-[7.5%] flex w-full overflow-hidden rounded-[4px] border border-white/6 bg-black/10 shadow-[0_8px_18px_rgba(0,0,0,0.18)]'
    : 'mb-[7.5%] flex w-full overflow-hidden rounded-[4px] border border-white/6 bg-black/10 shadow-[0_8px_18px_rgba(0,0,0,0.18)]';
  const pdcaCellClass = isHome
    ? 'flex-1 py-[4.2%] text-center text-[0.78rem] font-bold tracking-[0.08em] text-white'
    : 'flex-1 py-[4%] text-center text-[0.74rem] font-bold tracking-[0.08em] text-white';
  const conceptsClass = isHome
    ? 'mb-[8.5%] w-full font-sans text-[0.56rem] font-light leading-[1.7] tracking-[0.04em] text-white/46 sm:text-[0.62rem]'
    : 'mb-[8.5%] w-full font-sans text-[0.54rem] font-light leading-[1.7] tracking-[0.04em] text-white/46 sm:text-[0.6rem]';
  const authorClass = isHome
    ? 'font-sans text-[0.9rem] font-medium tracking-[0.1em] text-white/92'
    : 'font-sans text-[0.84rem] font-medium tracking-[0.09em] text-white/92';
  const authorNoteClass = isHome
    ? 'mt-2 font-sans text-[0.62rem] tracking-[0.12em] text-white/40'
    : 'mt-2 font-sans text-[0.58rem] tracking-[0.1em] text-white/40';

  return (
    <div className={`relative aspect-[2/3] ${className}`}>
      <div className={`absolute inset-0 transition-transform duration-500 ${rotateClassName}`.trim()}>
        <div className={shadowClass} />

        <div className={spineClass}>
          <div
            className={spineTextClass}
            style={{ writingMode: 'vertical-rl' }}
          >
            SOCRATES PRESS
          </div>
        </div>

        <div className={coverShellClass}>
          <div
            className="absolute inset-0"
            style={{
              opacity: isHome ? 0.042 : 0.04,
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 58px, rgba(255,255,255,0.11) 58px, rgba(255,255,255,0.11) 59px), repeating-linear-gradient(90deg, transparent, transparent 58px, rgba(255,255,255,0.11) 58px, rgba(255,255,255,0.11) 59px)',
            }}
          />
          <div className={frameClass} />
          <div className="absolute left-[7%] top-[4.5%] bottom-[4.5%] w-[1px] bg-black/20" />
          <div className="absolute left-[7.6%] top-[4.5%] bottom-[4.5%] w-[1px] bg-white/5" />
          <div className="absolute inset-y-[3%] right-[2.2%] w-[1.2%] rounded-full bg-gradient-to-l from-white/12 via-white/4 to-transparent" />
          <div className="absolute inset-y-0 right-0 w-[9%] bg-gradient-to-l from-white/6 via-white/2 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-[16%] bg-gradient-to-b from-white/6 to-transparent" />
          <div className="absolute inset-x-[9%] bottom-0 h-[5.5%] bg-gradient-to-t from-black/10 to-transparent" />

          <div className={`relative flex h-full flex-col items-center justify-between text-center text-white ${contentPaddingClass}`}>
            <div className="w-full flex flex-col items-center">
              <div className="mb-[15%] inline-flex rounded-md border border-[#e8600a]/65 bg-[#1a2744]/28 px-4 py-1.5 text-[9px] font-medium tracking-[0.1em] text-[#ffd1b4] backdrop-blur-sm">
                {COVER_TAG}
              </div>

              <div className="max-w-[98%] font-serif font-medium text-white">
                <div className={titleLine1Class}>
                  <span className="inline-block">{TITLE_LINE_1_PREFIX}</span>
                  <span className="inline-block text-[#f28b45]">{TITLE_LINE_1_HIGHLIGHT}</span>
                  <span className="inline-block">{TITLE_LINE_1_SUFFIX}</span>
                </div>
                <div className="mx-auto mt-[8%] h-px w-[10%] bg-[#e8600a]/65" />
                <div className={titleLine2Class}>{TITLE_LINE_2}</div>
                <div className={titleLine3Class}>{TITLE_LINE_3}</div>
              </div>

              <p className={subtitleClass}>
                <span>{SUBTITLE_PREFIX}</span>
                <span className="whitespace-nowrap">{SUBTITLE_SUFFIX}</span>
              </p>
            </div>

            <div className="w-full flex flex-col items-center">
              <PdcaLoopGlyph isHome={isHome} />
              <div className={conceptsBlockClass}>
                <div className={pdcaWrapClass}>
                  {FLOW_STEPS.map((step, index) => (
                    <div
                      key={step}
                      className={`${pdcaCellClass} ${
                        [
                          'bg-[#d06b16]',
                          'bg-[#945122]',
                          'bg-[#664233]',
                          'bg-[#4f3d40]',
                        ][index]
                      } ${index > 0 ? 'border-l border-white/10' : ''}`}
                    >
                      {step}
                    </div>
                  ))}
                </div>
                <p className={conceptsClass}>
                  {CONCEPTS}
                </p>
              </div>
              <div className="mb-[7%] h-px w-[12%] bg-white/18" />

              <p className={authorClass}>{AUTHOR}</p>
              <p className={authorNoteClass}>{AUTHOR_NOTE}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
