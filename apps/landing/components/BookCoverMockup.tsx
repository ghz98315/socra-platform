'use client';

type BookCoverMockupProps = {
  className?: string;
  rotateClassName?: string;
  variant?: 'home' | 'detail';
};

const COVER_TAG = '\u5de5\u7a0b\u5e08\u7238\u7238\u4eb2\u6d4b\u7248';
const TITLE_LINE_1_PREFIX = '\u4ece';
const TITLE_LINE_1_HIGHLIGHT = '\u9519\u8bef';
const TITLE_LINE_1_SUFFIX = '\u5f00\u59cb';
const TITLE_LINE_2 = '\u4e00\u5957\u771f\u6b63\u80fd\u95ed\u73af\u7684';
const TITLE_LINE_3 = '\u5b66\u4e60\u7cfb\u7edf';
const SUBTITLE = '\u7528\u5de5\u5382\u7ba1\u7406\u903b\u8f91\u91cd\u5efa\u5b69\u5b50\u7684\u5b66\u4e60\u65b9\u5f0f';
const AUTHOR = '\u5173\u535a \u00b7 \u5de5\u7a0b\u7238';
const AUTHOR_NOTE = '\u516c\u4f17\u53f7\u300c\u5de5\u7a0b\u7238\u7684AI\u8fdb\u5316\u5de5\u5382\u300d';
const FLOW_STEPS = ['P', 'D', 'C', 'A'];

export default function BookCoverMockup({
  className = '',
  rotateClassName = '',
  variant = 'detail',
}: BookCoverMockupProps) {
  const isHome = variant === 'home';

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
    ? 'absolute inset-y-0 left-[7.8%] right-0 overflow-hidden rounded-[0_30px_30px_10px] border border-[#dce2ee]/28 bg-[#1a2744] shadow-[0_24px_56px_rgba(15,23,42,0.3),inset_0_1px_0_rgba(255,255,255,0.08)]'
    : 'absolute inset-y-0 left-[7.1%] right-0 overflow-hidden rounded-[0_28px_28px_10px] border border-[#dce2ee]/24 bg-[#1a2744] shadow-[0_22px_48px_rgba(15,23,42,0.27),inset_0_1px_0_rgba(255,255,255,0.07)]';
  const contentPaddingClass = isHome ? 'px-[11%] py-[10%]' : 'px-[11.5%] py-[10.5%]';
  const titleLine1Class = isHome
    ? 'text-[clamp(1.85rem,4.8vw,2.9rem)] leading-[1.08]'
    : 'text-[clamp(1.72rem,4.2vw,2.55rem)] leading-[1.08]';
  const titleLine2Class = isHome
    ? 'mt-[0.18em] text-[clamp(1.6rem,4.1vw,2.45rem)] leading-[1.12]'
    : 'mt-[0.2em] text-[clamp(1.48rem,3.75vw,2.2rem)] leading-[1.14]';
  const titleLine3Class = isHome
    ? 'mt-[0.14em] text-[clamp(1.78rem,4.55vw,2.7rem)] leading-[1.08]'
    : 'mt-[0.16em] text-[clamp(1.62rem,4vw,2.35rem)] leading-[1.1]';
  const subtitleClass = isHome
    ? 'mt-[8.5%] max-w-[70%] font-sans text-[0.74rem] font-medium leading-[1.82] tracking-[0.02em] text-[#d4daea] sm:text-[0.8rem]'
    : 'mt-[9%] max-w-[72%] font-sans text-[0.68rem] font-medium leading-[1.82] tracking-[0.02em] text-[#d4daea] sm:text-[0.73rem]';
  const authorClass = isHome
    ? 'font-sans text-[0.98rem] font-semibold tracking-[0.03em] text-white'
    : 'font-sans text-[0.92rem] font-semibold tracking-[0.03em] text-white';
  const authorNoteClass = isHome
    ? 'mt-2 font-sans text-[0.68rem] tracking-[0.02em] text-white/48'
    : 'mt-2 font-sans text-[0.64rem] tracking-[0.02em] text-white/48';

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
              opacity: isHome ? 0.055 : 0.045,
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 58px, rgba(255,255,255,0.11) 58px, rgba(255,255,255,0.11) 59px), repeating-linear-gradient(90deg, transparent, transparent 58px, rgba(255,255,255,0.11) 58px, rgba(255,255,255,0.11) 59px)',
            }}
          />
          <div className="absolute inset-x-[4%] inset-y-[3.5%] rounded-[24px] border border-white/6" />
          <div className="absolute left-[7%] top-[4.5%] bottom-[4.5%] w-[1px] bg-black/20" />
          <div className="absolute left-[7.6%] top-[4.5%] bottom-[4.5%] w-[1px] bg-white/5" />
          <div className="absolute inset-y-[3%] right-[2.2%] w-[1.2%] rounded-full bg-gradient-to-l from-white/12 via-white/4 to-transparent" />
          <div className="absolute inset-y-0 right-0 w-[9%] bg-gradient-to-l from-white/6 via-white/2 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-[16%] bg-gradient-to-b from-white/6 to-transparent" />
          <div className="absolute inset-x-[9%] bottom-0 h-[5.5%] bg-gradient-to-t from-black/10 to-transparent" />

          <div className={`relative flex h-full flex-col justify-between text-white ${contentPaddingClass}`}>
            <div className="w-full">
              <div className="mb-[16%] inline-flex rounded-full border border-[#e8600a]/65 bg-[#1a2744]/40 px-4 py-1.5 text-[9px] font-medium tracking-[0.16em] text-[#ffd1b4] backdrop-blur-sm">
                {COVER_TAG}
              </div>

              <div className="max-w-[90%] font-serif font-semibold tracking-[-0.045em] text-white">
                <div className={titleLine1Class}>
                  <span className="inline-block">{TITLE_LINE_1_PREFIX}</span>
                  <span className="inline-block text-[#f28b45]">{TITLE_LINE_1_HIGHLIGHT}</span>
                  <span className="inline-block">{TITLE_LINE_1_SUFFIX}</span>
                  <span className="inline-block align-top text-[0.82em] text-white/82">{'\uFF1A'}</span>
                </div>
                <div className={titleLine2Class}>{TITLE_LINE_2}</div>
                <div className={titleLine3Class}>{TITLE_LINE_3}</div>
              </div>

              <div className="mt-[11%] h-[2px] w-12 bg-[#e8600a]" />

              <p className={subtitleClass}>{SUBTITLE}</p>
            </div>

            <div className="w-full">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div className="h-[2px] w-10 bg-[#e8600a]" />
                <div className="flex items-center gap-2 text-[0.48rem] tracking-[0.32em] text-white/36">
                  {FLOW_STEPS.map((step) => (
                    <span key={step}>{step}</span>
                  ))}
                </div>
              </div>

              <p className={authorClass}>{AUTHOR}</p>
              <p className={authorNoteClass}>{AUTHOR_NOTE}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
