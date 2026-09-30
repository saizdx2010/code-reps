import ts from 'typescript'
import type { Rep } from './rep'

export type DirectoryScenario = { loading: boolean; error: string | null; people: { name: string }[] }
export const previewScenarios: Record<string, DirectoryScenario> = {
  ready: { loading: false, error: null, people: [{ name: 'Ada' }, { name: 'Bo' }, { name: 'Adam' }] },
  loading: { loading: true, error: null, people: [] },
  error: { loading: false, error: 'Offline', people: [] },
  empty: { loading: false, error: null, people: [] },
}

export function buildFrontendFrame(code: string, rep: Rep, token: string, mode: 'preview' | 'checks', scenario = previewScenarios.ready): string {
  if (typeof code !== 'string' || code.length > 100_000) throw new Error('The solution is too large to preview.')
  const output = ts.transpileModule(code, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }, reportDiagnostics: true,
  })
  const error = output.diagnostics?.find(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error)
  if (error) throw new Error(ts.flattenDiagnosticMessageText(error.messageText, '\n'))
  const payload = JSON.stringify({ code: output.outputText, functionName: rep.functionName, checks: rep.checks, preserveInput: rep.preserveInput, token, mode, scenario }).replace(/</g, '\\u003c')
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline'"><meta name="viewport" content="width=device-width, initial-scale=1"><style>
  * { box-sizing: border-box } body { margin: 0; padding: 24px; background: #171d1c; color: #edf0eb; font: 15px/1.6 system-ui, sans-serif } label { display: block; margin-bottom: 6px } input, button { font: inherit; border: 1px solid #718873; border-radius: 5px; padding: 9px 12px; color: inherit; background: #252d2b } input { width: 100%; max-width: 360px } button { cursor: pointer } :focus-visible { outline: 2px solid #bce57b; outline-offset: 3px } ul, ol { padding-left: 24px } li { padding: 5px 0 } [role="alert"] { color: #ef978b } .preview-feedback { border-top: 1px solid #37413e; margin-top: 20px; padding-top: 12px; font-size: 12px; color: #bce57b }
  </style></head><body><main id="exercise-root"></main><script>
  const settings = ${payload};
  const root = document.getElementById('exercise-root');
  const send = data => parent.postMessage({ token: settings.token, ...data }, '*');
  const message = error => error instanceof Error ? error.message : String(error);
  try {
    const mount = new Function(settings.code + '\\nreturn typeof ' + settings.functionName + ' === "function" ? ' + settings.functionName + ' : undefined')();
    if (typeof mount !== 'function') throw new Error('Define a function named ' + settings.functionName + '.');
    if (settings.mode === 'preview') {
      const state = settings.scenario;
      let calls = 0;
      state.retry = () => {
        calls++;
        let feedback = document.querySelector('.preview-feedback');
        if (!feedback) { feedback = document.createElement('p'); feedback.className = 'preview-feedback'; feedback.setAttribute('role', 'status'); document.body.append(feedback); }
        feedback.textContent = 'Retry requested ' + calls + (calls === 1 ? ' time.' : ' times.');
      };
      mount(root, state);
      window.addEventListener('error', event => send({ error: event.message || 'The preview encountered an error.' }));
      send({ ready: true });
    } else {
      const results = settings.checks.map(check => {
        root.replaceChildren();
        const state = JSON.parse(JSON.stringify(check.input[0]));
        const original = JSON.stringify(state);
        const interaction = check.input[1] || {};
        let retryCalls = 0;
        state.retry = () => retryCalls++;
        try {
          mount(root, state);
          const search = root.querySelector('[data-testid="search"]');
          const retry = root.querySelector('[data-testid="retry"]');
          for (const query of interaction.queries || []) {
            if (!(search instanceof HTMLInputElement)) throw new Error('Add an input with data-testid="search".');
            search.value = query;
            search.dispatchEvent(new Event('input', { bubbles: true }));
          }
          if (interaction.clickRetry) {
            if (!(retry instanceof HTMLButtonElement)) throw new Error('Add a button with data-testid="retry".');
            retry.click();
          }
          const people = [...root.querySelectorAll('[data-testid="person"]')];
          const actual = { message: root.querySelector('[data-testid="message"]')?.textContent || '', people: people.map(item => item.textContent), search: search instanceof HTMLInputElement, retry: retry instanceof HTMLButtonElement, retryCalls };
          const namedSearch = !actual.search || [...(search.labels || [])].some(label => label.textContent.trim() === 'Search people');
          const validList = people.every(item => item.tagName === 'LI' && ['UL', 'OL'].includes(item.parentElement?.tagName) && item.children.length === 0);
          const unchanged = !settings.preserveInput || JSON.stringify(state) === original;
          const matches = JSON.stringify(actual) === JSON.stringify(check.expected);
          const passed = matches && namedSearch && validList && unchanged;
          const detail = !unchanged ? 'The function changed its input data.' : !namedSearch ? 'Associate the Search people label with its input.' : !validList ? 'Render each name as text in a real list item.' : 'Expected ' + JSON.stringify(check.expected) + ', received ' + JSON.stringify(actual) + '.';
          return { name: check.name, passed, ...(passed ? {} : { input: JSON.stringify(check.input), expected: JSON.stringify(check.expected), actual: JSON.stringify(actual), message: detail }) };
        } catch (error) { return { name: check.name, passed: false, input: JSON.stringify(check.input), message: message(error) }; }
      });
      send({ results });
    }
  } catch (error) {
    root.replaceChildren();
    const feedback = document.createElement('p'); feedback.setAttribute('role', 'alert'); feedback.textContent = message(error); root.append(feedback);
    send({ error: message(error) });
  }
  </script></body></html>`
}
