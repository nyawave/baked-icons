'use client';

import { Icon } from '@nyawave/baked-icons';
import { Fragment, useEffect, useRef, useState } from 'react';

const PAINT = 130;
const HTML_END = 120;
const JS_END = 340;
const MOUNT = 400;
const API_END = 820;
const END = 1000;

const ICONIFY_STEPS = [
  { at: 0, text: 'The browser asks for the page. Nothing to show yet.' },
  { at: PAINT, text: 'HTML is painted. <Icon> has no icon data on the server, so the spots where icons go are empty.' },
  { at: JS_END, text: 'JavaScript loads and the component mounts. Only now does it know which icons it needs.' },
  { at: MOUNT, text: 'It requests the icon data from api.iconify.design and waits for the response.' },
  { at: API_END, text: 'Icons finally show up, and every label shifts to the right to make room.' },
];
const BAKED_STEPS = [
  { at: 0, text: 'The browser asks for the page. Nothing to show yet.' },
  { at: PAINT, text: 'HTML is painted with the icons already inside it. The SVG was written in at build time.' },
  { at: JS_END, text: 'JavaScript loads. The icon data is part of the bundle, so there is nothing else to fetch.' },
];

const NAV = [
  { label: 'Home', icon: <Icon icon="mdi:home" width={20} /> },
  { label: 'Search', icon: <Icon icon="lucide:search" width={20} /> },
  { label: 'Alerts', icon: <Icon icon="lucide:bell" width={20} /> },
  { label: 'Saved', icon: <Icon icon="lucide:heart" width={20} /> },
];

interface Side {
  name: string;
  badge: string;
  badgeTone: '' | 'good' | 'bad';
  showIcons: boolean;
  pop: boolean;
  bars: { label: string; from: number; to: number; bad?: boolean; none?: boolean }[];
  steps: { at: number; text: string }[];
  warn: boolean;
}

export function LoadTimeline() {
  const [t, setT] = useState(500);
  const [playing, setPlaying] = useState(false);
  const tick = useRef<ReturnType<typeof setInterval>>(undefined);

  const stop = () => {
    clearInterval(tick.current);
    tick.current = undefined;
  };
  useEffect(() => stop, []);
  useEffect(() => {
    if (playing && t >= END) {
      stop();
      setPlaying(false);
    }
  }, [playing, t]);

  const togglePlay = () => {
    if (playing) {
      stop();
      setPlaying(false);
      return;
    }
    if (t >= END) setT(0);
    setPlaying(true);
    stop();
    tick.current = setInterval(() => setT((prev) => Math.min(END, prev + 10)), 30);
  };

  const painted = t >= PAINT;
  const sides: Side[] = [
    {
      name: '@iconify/react',
      badge: !painted ? 'Loading' : t < API_END ? 'Icons missing' : 'Layout shifted',
      badgeTone: painted && t < API_END ? 'bad' : '',
      showIcons: t >= API_END,
      pop: true,
      bars: [
        { label: 'page.html', from: 0, to: HTML_END },
        { label: 'app.js', from: HTML_END, to: JS_END },
        { label: 'api.iconify.design', from: MOUNT, to: API_END, bad: true },
      ],
      steps: ICONIFY_STEPS,
      warn: painted && t < API_END,
    },
    {
      name: '@nyawave/baked-icons',
      badge: painted ? 'Icons in first paint' : 'Loading',
      badgeTone: painted ? 'good' : '',
      showIcons: painted,
      pop: false,
      bars: [
        { label: 'page.html', from: 0, to: HTML_END },
        { label: 'app.js', from: HTML_END, to: JS_END },
        { label: 'no icon request', from: 0, to: 0, none: true },
      ],
      steps: BAKED_STEPS,
      warn: false,
    },
  ];

  return (
    <>
      <div className="card tl-controls">
        <button type="button" className="hit btn btn-fg tl-play" onClick={togglePlay}>
          {playing ? <Icon icon="mdi:pause" width={18} /> : <Icon icon="mdi:play" width={18} />}
          {playing ? 'Pause' : t >= END ? 'Replay' : 'Play'}
        </button>
        <label className="tl-range">
          <span className="sr-only">Timeline</span>
          <input
            type="range"
            min={0}
            max={END}
            step={10}
            value={t}
            aria-valuetext={`${t} ms`}
            onChange={(e) => {
              stop();
              setPlaying(false);
              setT(Number(e.target.value));
            }}
          />
        </label>
        <span className="tl-time" aria-hidden="true">
          {t} ms
        </span>
      </div>

      <div className="two">
        {sides.map((side) => {
          const active = side.steps.filter((step) => t >= step.at).length - 1;
          return (
            <article key={side.name} className="card tl-side" aria-label={side.name}>
              <div className="tl-head">
                <h3 className="tl-name">{side.name}</h3>
                <span className={`tl-badge${side.badgeTone ? ` tl-badge--${side.badgeTone}` : ''}`}>{side.badge}</span>
              </div>

              <div className="tl-screen" aria-hidden="true">
                {painted ? (
                  NAV.map((item, i) => (
                    <div key={item.label} className={`tl-item${i === 0 ? ' tl-item--on' : ''}`}>
                      {side.showIcons && <span className={`tl-item-icon${side.pop ? ' pop' : ''}`}>{item.icon}</span>}
                      <span>{item.label}</span>
                    </div>
                  ))
                ) : (
                  <span className="tl-blank">Blank page, HTML still on its way</span>
                )}
              </div>

              <div className="tl-bars" aria-hidden="true">
                {side.bars.map((bar) => {
                  const end = Math.min(bar.to, Math.max(bar.from, t));
                  return (
                    <Fragment key={bar.label}>
                      <span className={`code-font tl-bar-label${bar.none ? ' tl-bar-label--none' : ''}`}>{bar.label}</span>
                      <div className={`tl-track${bar.none ? ' tl-track--none' : ''}`}>
                        {!bar.none && (
                          <div
                            className={`tl-fill${bar.bad ? ' tl-fill--bad' : ''}`}
                            style={{ left: `${bar.from / 10}%`, width: `${(end - bar.from) / 10}%` }}
                          />
                        )}
                      </div>
                    </Fragment>
                  );
                })}
                <div className="tl-playhead">
                  <div className="tl-head-mark" style={{ left: `${t / 10}%` }} />
                </div>
                <div className="code-font tl-axis">
                  <span>0</span>
                  <span>500</span>
                  <span>1000 ms</span>
                </div>
              </div>

              <div className="tl-caption">
                <ol className="tl-steps">
                  {side.steps.map((step, i) => (
                    <li key={step.at} hidden={i !== active} aria-current={i === active ? 'step' : undefined}>
                      <span className={`tl-step${side.warn ? ' tl-step--bad' : ''}`}>
                        {i + 1}/{side.steps.length}
                      </span>
                      <p>{step.text}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
