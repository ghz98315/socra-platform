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

  return (
    <div className={`relative aspect-[2/3] ${className}`}>
      <div className={`absolute inset-0 transition-transform duration-500 ${rotateClassName}`.trim()}>
        <div
          className={isHome
            ? 'absolute inset-x-[10%] bottom-[-1.8%] top-[4.5%] rounded-[44px] bg-[#0d1426]/22 blur-[30px]'
            : 'absolute inset-x-[13%] bottom-[-1.5%] top-[6%] rounded-[40px] bg-[#0d1426]/20 blur-2xl'}
        />

        <div
          className={isHome
            ? 'absolute bottom-[1.4%] left-[2.2%] top-[1.4%] w-[8.4%] rounded-l-[24px] bg-gradient-to-b from-[#72809a] via-[#4d5a75] to-[#313b54] shadow-[inset_-1px_0_0_rgba(255,255,255,0.1),inset_1px_0_0_rgba(17,24,39,0.22)]'
            : 'absolute bottom-[1.4%] left-[2.8%] top-[1.4%] w-[7.4%] rounded-l-[22px] bg-gradient-to-b from-[#6f7d96] via-[#4a5873] to-[#313a53] shadow-[inset_-1px_0_0_rgba(255,255,255,0.1),inset_1px_0_0_rgba(17,24,39,0.22)]'}
        >
          <div
            className={isHome
              ? 'absolute inset-y-[8%] left-[35%] text-[7px] tracking-[0.24em] text-white/24'
              : 'absolute inset-y-[8%] left-[37%] text-[7px] tracking-[0.24em] text-white/24'}
            style={{ writingMode: 'vertical-rl' }}
          >
            SOCRATES PRESS
          </div>
        </div>

        <div
          className={isHome
            ? 'absolute inset-y-0 left-[8.2%] right-0 overflow-hidden rounded-[0_28px_28px_10px] border border-[#d7dce6]/24 bg-[#1a2744] shadow-[0_22px_48px_rgba(17,24,39,0.28),inset_0_1px_0_rgba(255,255,255,0.07)]'
            : 'absolute inset-y-0 left-[7.5%] right-0 overflow-hidden rounded-[0_26px_26px_10px] border border-[#d7dce6]/24 bg-[#1a2744] shadow-[0_22px_48px_rgba(17,24,39,0.26),inset_0_1px_0_rgba(255,255,255,0.07)]'}
        >
          <div
            className="absolute inset-0"
            style={{
              opacity: isHome ? 0.06 : 0.05,
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 56px, rgba(255,255,255,0.12) 56px, rgba(255,255,255,0.12) 57px), repeating-linear-gradient(90deg, transparent, transparent 56px, rgba(255,255,255,0.12) 56px, rgba(255,255,255,0.12) 57px)',
            }}
          />
          <div className="absolute inset-y-0 right-0 w-[10%] bg-gradient-to-l from-white/7 via-white/2 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-[16%] bg-gradient-to-b from-white/5 to-transparent" />

          <div
            className={isHome
              ? 'relative flex h-full flex-col justify-between px-[11.5%] py-[10.5%] text-white'
              : 'relative flex h-full flex-col justify-between px-[12%] py-[10.5%] text-white'}
          >
            <div className="w-full">
              <div
                className={isHome
                  ? 'mb-[16%] inline-flex rounded-full border border-[#e8600a]/65 px-4 py-1.5 text-[9px] font-medium tracking-[0.16em] text-[#ffd1b4]'
                  : 'mb-[18%] inline-flex rounded-full border border-[#e8600a]/65 px-4 py-1.5 text-[9px] font-medium tracking-[0.16em] text-[#ffd1b4]'}
              >
                {COVER_TAG}
              </div>

              <h3
                className={isHome
                  ? 'max-w-[88%] font-serif text-[clamp(1.62rem,4.2vw,2.5rem)] font-semibold leading-[1.2] tracking-[-0.04em] text-white'
                  : 'max-w-[90%] font-serif text-[clamp(1.42rem,3.7vw,2.12rem)] font-semibold leading-[1.24] tracking-[-0.04em] text-white'}
              >
                <span className="inline-block">{TITLE_LINE_1_PREFIX}</span>
                <span className="inline-block text-[#f28b45]">{TITLE_LINE_1_HIGHLIGHT}</span>
                <span className="inline-block">{TITLE_LINE_1_SUFFIX}</span>
                <span className="inline-block align-top text-[0.82em] text-white/82">{':'}</span>
                <br />
                <span>{TITLE_LINE_2}</span>
                <br />
                <span>{TITLE_LINE_3}</span>
              </h3>

              <div className={isHome ? 'mt-[11%] h-[2px] w-14 bg-[#e8600a]' : 'mt-[12%] h-[2px] w-12 bg-[#e8600a]'} />

              <p
                className={isHome
                  ? 'mt-[7.5%] max-w-[72%] font-sans text-[0.7rem] leading-[1.82] text-[#d3dae9] sm:text-[0.74rem]'
                  : 'mt-[8.5%] max-w-[74%] font-sans text-[0.66rem] leading-[1.8] text-[#d3dae9] sm:max-w-[70%] sm:text-[0.7rem]'}
              >
                {SUBTITLE}
              </p>
            </div>

            <div className="w-full">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div className="h-[2px] w-10 bg-[#e8600a]" />
                <div
                  className={isHome
                    ? 'flex items-center gap-2 text-[0.54rem] tracking-[0.32em] text-white/38'
                    : 'flex items-center gap-2 text-[0.5rem] tracking-[0.3em] text-white/38'}
                >
                  {FLOW_STEPS.map((step) => (
                    <span key={step}>{step}</span>
                  ))}
                </div>
              </div>
              <p className={isHome ? 'font-sans text-[0.94rem] font-semibold tracking-[0.03em] text-white' : 'font-sans text-[0.88rem] font-semibold tracking-[0.03em] text-white'}>
                {AUTHOR}
              </p>
              <p className={isHome ? 'mt-2 font-sans text-[0.68rem] tracking-[0.03em] text-white/50' : 'mt-2 font-sans text-[0.64rem] tracking-[0.03em] text-white/50'}>
                {AUTHOR_NOTE}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
