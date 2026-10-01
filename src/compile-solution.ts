import ts from 'typescript'
import { decodeFiles } from './project-files.ts'
function transpile(code: string, filename: string, module: ts.ModuleKind) {
  const result = ts.transpileModule(code, { fileName: filename, compilerOptions: { target: ts.ScriptTarget.ES2022, module }, reportDiagnostics: true })
  const error = result.diagnostics?.find(d => d.category === ts.DiagnosticCategory.Error)
  if (error) throw new Error(`${filename}: ${ts.flattenDiagnosticMessageText(error.messageText, '\n')}`)
  return result.outputText
}
/** A bounded module loader for authored local exercises; not a third-party security sandbox. */
export function compileSolution(code: string, functionName: string) {
  if (typeof code !== 'string' || code.length > 100_000) throw new Error('The solution is too large to run.')
  if (!/^[A-Za-z_$][\w$]*$/.test(functionName)) throw new Error('Invalid entry function.')
  const project = decodeFiles(code)
  if (!project) return transpile(code, 'solution.ts', ts.ModuleKind.ESNext)
  const modules = Object.fromEntries(Object.entries(project.files).map(([name, source]) => [name, transpile(source, name, ts.ModuleKind.CommonJS)]))
  return `const ${functionName} = (() => {
    const modules = ${JSON.stringify(modules)};
    const cache = Object.create(null);
    const load = (name) => {
      if (cache[name]) return cache[name].exports;
      if (!Object.hasOwn(modules, name)) throw new Error('Missing local module: ' + name);
      const module = { exports: {} }; cache[name] = module;
      const require = specifier => {
        if (!/^\\.\\/[a-z][a-z0-9-]*(\\.ts)?$/.test(specifier)) throw new Error('Only local project imports are available: ' + specifier);
        const target = specifier.slice(2); return load(target.endsWith('.ts') ? target : target + '.ts');
      };
      new Function('module', 'exports', 'require', modules[name])(module, module.exports, require);
      return module.exports;
    };
    return load(${JSON.stringify(project.entry)})[${JSON.stringify(functionName)}];
  })();`
}
