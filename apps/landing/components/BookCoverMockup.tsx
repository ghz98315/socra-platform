'use client';

type BookCoverMockupProps = {
  className?: string;
  rotateClassName?: string;
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
}: BookCoverMockupProps) {
  return (
    <div className={`relative aspect-[2/3] ${className}`}>
      <div className={`absolute inset-0 transition-transform duration-500 ${rotateClassName}`.trim()}>
        <div className="absolute inset-x-[10%] bottom-[-2%] top-[5%] rounded-[40px] bg-[#0d1426]/22 blur-2xl" />

        <div className="absolute bottom-[1.4%] left-[1.5%] top-[1.4%] w-[10%] rounded-l-[26px] bg-gradient-to-b from-[#6f7d96] via-[#495671] to-[#2f3850] shadow-[inset_-2px_0_0_rgba(255,255,255,0.15),inset_1px_0_0_rgba(17,24,39,0.35)]">
          <div
            className="absolute inset-y-[8%] left-[28%] text-[9px] tracking-[0.3em] text-white/35"
            style={{ writingMode: 'vertical-rl' }}
          >
            SOCRATES PRESS
          </div>
        </div>

        <div className="absolute inset-y-0 left-[9%] right-0 overflow-hidden rounded-[0_30px_30px_10px] border border-[#d7dce6]/35 bg-[#1a2744] shadow-[0_22px_48px_rgba(17,24,39,0.28),inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div
            className="absolute inset-0 opacity-[0.14]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 42px, rgba(255,255,255,0.18) 42px, rgba(255,255,255,0.18) 43px), repeating-linear-gradient(90deg, transparent, transparent 42px, rgba(255,255,255,0.18) 42px, rgba(255,255,255,0.18) 43px)',
            }}
          />
          <div className="absolute inset-y-0 right-0 w-[14%] bg-gradient-to-l from-white/10 via-white/3 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-[18%] bg-gradient-to-b from-white/7 to-transparent" />

          <div className="relative flex h-full flex-col items-center justify-between px-[10%] py-[9%] text-center text-white">
            <div className="w-full">
              <div className="mx-auto mb-[10%] inline-flex rounded-full border border-[#e8600a]/70 px-4 py-1.5 text-[10px] font-medium tracking-[0.22em] text-[#ffd1b4]">
                {COVER_TAG}
              </div>

              <h3 className="font-serif text-[clamp(1.7rem,5vw,3rem)] font-semibold leading-[1.16] tracking-[-0.03em] text-white">
                <span>{TITLE_LINE_1_PREFIX}</span>
                <span className="text-[#f28b45]">{TITLE_LINE_1_HIGHLIGHT}</span>
                <span>{TITLE_LINE_1_SUFFIX}</span>
                <br />
                <span>{TITLE_LINE_2}</span>
                <br />
                <span>{TITLE_LINE_3}</span>
              </h3>

              <div className="mx-auto mt-[9%] h-[2px] w-12 bg-[#e8600a]" />

              <p className="mx-auto mt-[7%] max-w-[82%] text-[0.78rem] leading-[1.7] text-[#d3dae9]">
                {SUBTITLE}
              </p>

              <div className="mt-[9%] flex items-center justify-center gap-2">
                {FLOW_STEPS.map((step) => (
                  <span
                    key={step}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/18 bg-white/6 text-[0.72rem] font-semibold tracking-[0.04em] text-white/88"
                  >
                    {step}
                  </span>
                ))}
              </div>
            </div>

            <div className="w-full">
              <div className="mx-auto mb-5 h-[2px] w-10 bg-[#e8600a]" />
              <p className="font-sans text-[0.95rem] font-semibold tracking-[0.08em] text-white">{AUTHOR}</p>
              <p className="mt-2 font-sans text-[0.72rem] tracking-[0.08em] text-white/52">{AUTHOR_NOTE}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
