import { Icon } from '@nyawave/baked-icons';

export function WorksWith() {
  return (
    <section className="wrap works" aria-label="Works with">
      <div className="works-bar">
        <span className="works-label">Works with</span>
        <ul className="works-list">
          <li>
            <Icon icon="simple-icons:react" width={22} />
            React 18+
          </li>
          <li>
            <Icon icon="simple-icons:nextdotjs" width={22} />
            Next.js
          </li>
          <li>
            <Icon icon="simple-icons:vite" width={22} />
            Vite
          </li>
          <li>
            <Icon icon="simple-icons:webpack" width={22} />
            webpack
          </li>
          <li>
            <Icon icon="tabler:bolt" width={22} />
            Turbopack
          </li>
        </ul>
      </div>
    </section>
  );
}
