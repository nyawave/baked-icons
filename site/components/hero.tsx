import { Icon } from '@nyawave/baked-icons';
import { GetStarted } from './get-started';

export function Hero() {
  return (
    <section id="top" className="wrap hero">
      <div className="in hero-copy">
        <span className="badge">
          <span className="badge-dot" />
          Drop-in replacement for @iconify/react
        </span>
        <h1 className="disp h1">Iconify icons, baked into your bundle</h1>
        <p className="hero-sub">
          Keep writing &lt;Icon icon=&quot;mdi:home&quot; /&gt;. The SVG is inlined at build time, so icons render on
          the first frame, even in Server Components.
        </p>
        <GetStarted />
      </div>

      <figure className="in2 demo" style={{ margin: 0 }}>
        <figcaption className="demo-head">
          <span className="code-font demo-file">Nav.tsx</span>
          <span className="demo-chip">1 line changed</span>
        </figcaption>
        <pre className="code" style={{ padding: '4px 0 18px' }}>
          <span className="del">- import {'{ Icon }'} from &apos;@iconify/react&apos;;</span>
          <span className="add">+ import {'{ Icon }'} from &apos;@nyawave/baked-icons&apos;;</span>
          <span className="diff-body">
            {'\n  '}
            <span className="k">export function</span> Nav() {'{\n    '}
            <span className="k">return</span> ({'\n      <nav>\n        <Icon icon='}
            <span className="s">&quot;mdi:home&quot;</span>
            {' /> Home\n        <Icon icon='}
            <span className="s">&quot;lucide:bell&quot;</span>
            {' /> Alerts\n        <Icon icon='}
            <span className="s">&quot;ph:cat&quot;</span>
            {' /> Profile\n      </nav>\n    );\n  }'}
          </span>
        </pre>
        <div className="demo-result">
          <span className="demo-result-label">On the first frame, with no request to the Iconify API</span>
          <div className="demo-nav">
            <span className="demo-item demo-item--on">
              <Icon icon="mdi:home" width={19} />
              Home
            </span>
            <span className="demo-item">
              <Icon icon="lucide:bell" width={19} />
              Alerts
            </span>
            <span className="demo-item">
              <Icon icon="ph:cat" width={19} />
              Profile
            </span>
          </div>
        </div>
      </figure>
    </section>
  );
}
