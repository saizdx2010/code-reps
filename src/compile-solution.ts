import ts from 'typescript'
import { decodeFiles } from './project-files.ts'

/** A loop that runs this long without pausing is stopped, so frontend code cannot freeze the page that hosts its frame. */
export const loopLimitMs = 2000
export const loopStoppedMessage = `A loop ran for more than ${loopLimitMs / 1000} seconds and was stopped. Check that it can finish.`
// Once one loop is stopped, every later loop stops at once, so the remaining checks finish instead of each waiting out the limit.
const loopGuardSource = `var __codeRepsLoop = start => { if (globalThis.__codeRepsLoopStopped || Date.now() - start > ${loopLimitMs}) { globalThis.__codeRepsLoopStopped = true; throw new Error(${JSON.stringify(loopStoppedMessage)}) } };\n`

/** Whether a loop can pause (await or yield) within its own function, so time spent waiting is not running time. */
function canPause(node: ts.Node): boolean {
  return Boolean(
    ts.forEachChild(node, child => {
      if (ts.isFunctionLike(child) || ts.isClassLike(child)) return false
      if (ts.isAwaitExpression(child) || ts.isYieldExpression(child) || (ts.isForOfStatement(child) && child.awaitModifier)) return true
      return canPause(child) || undefined
    }),
  )
}

/**
 * Each loop records when it started and checks the clock on every pass. A labelled loop keeps its labels, so
 * `continue label` still names a loop. Loops that await or yield are left alone: they hand control back while waiting.
 */
const guardLoops: ts.TransformerFactory<ts.SourceFile> = context => {
  const factory = context.factory
  let count = 0
  const withBody = (loop: ts.IterationStatement, body: ts.Statement): ts.IterationStatement => {
    if (ts.isForStatement(loop)) return factory.updateForStatement(loop, loop.initializer, loop.condition, loop.incrementor, body)
    if (ts.isForInStatement(loop)) return factory.updateForInStatement(loop, loop.initializer, loop.expression, body)
    if (ts.isForOfStatement(loop)) return factory.updateForOfStatement(loop, loop.awaitModifier, loop.initializer, loop.expression, body)
    if (ts.isWhileStatement(loop)) return factory.updateWhileStatement(loop, loop.expression, body)
    return factory.updateDoStatement(loop as ts.DoStatement, body, (loop as ts.DoStatement).expression)
  }
  const guard = (labels: ts.Identifier[], original: ts.IterationStatement): ts.Statement => {
    const loop = ts.visitEachChild(original, visit, context)
    if (canPause(original))
      return labels.reduceRight<ts.Statement>((statement, label) => factory.createLabeledStatement(label, statement), loop)
    const start = factory.createUniqueName(`__codeRepsStart${++count}`)
    const check = factory.createExpressionStatement(
      factory.createCallExpression(factory.createIdentifier('__codeRepsLoop'), undefined, [start]),
    )
    const body = factory.createBlock([check, ...(ts.isBlock(loop.statement) ? loop.statement.statements : [loop.statement])], true)
    const now = factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier('Date'), 'now'), undefined, [])
    const declaration = factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList([factory.createVariableDeclaration(start, undefined, undefined, now)], ts.NodeFlags.Const),
    )
    const guarded = labels.reduceRight<ts.Statement>(
      (statement, label) => factory.createLabeledStatement(label, statement),
      withBody(loop, body),
    )
    return factory.createBlock([declaration, guarded], true)
  }
  const visit = (node: ts.Node): ts.VisitResult<ts.Node> => {
    if (ts.isLabeledStatement(node)) {
      const labels: ts.Identifier[] = []
      let inner: ts.Statement = node
      while (ts.isLabeledStatement(inner)) {
        labels.push(inner.label)
        inner = inner.statement
      }
      if (ts.isIterationStatement(inner, false)) return guard(labels, inner)
    }
    if (ts.isIterationStatement(node, false)) return guard([], node)
    return ts.visitEachChild(node, visit, context)
  }
  return file => ts.visitEachChild(file, visit, context)
}

/**
 * A single-file solution runs as a script, so `export` on a declaration is dropped and export statements are removed;
 * the entry function is found by name.
 */
const dropExports: ts.TransformerFactory<ts.SourceFile> = context => file => {
  const factory = context.factory
  const statements = file.statements.flatMap(statement => {
    if (ts.isExportDeclaration(statement) || ts.isExportAssignment(statement)) return []
    if (!ts.canHaveModifiers(statement)) return [statement]
    const modifiers = ts.getModifiers(statement)
    if (!modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) return [statement]
    const kept = modifiers.filter(
      modifier => modifier.kind !== ts.SyntaxKind.ExportKeyword && modifier.kind !== ts.SyntaxKind.DefaultKeyword,
    )
    return [factory.replaceModifiers(statement, kept)]
  })
  return factory.updateSourceFile(file, statements)
}

function transpile(code: string, filename: string, module: ts.ModuleKind, before: ts.TransformerFactory<ts.SourceFile>[] = []) {
  const result = ts.transpileModule(code, {
    fileName: filename,
    compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React, module },
    reportDiagnostics: true,
    transformers: { before },
  })
  const error = result.diagnostics?.find(d => d.category === ts.DiagnosticCategory.Error)
  if (error) throw new Error(`${filename}: ${ts.flattenDiagnosticMessageText(error.messageText, '\n')}`)
  return result.outputText
}
/**
 * A bounded module loader for authored local exercises; not a third-party security sandbox. `guardLoops` stops long
 * loops for code that runs on the page's own thread (frontend frames); worker runs are stopped by their timeout instead.
 */
export function compileSolution(code: string, functionName: string, jsx = false, { guardLoops: guarded = false } = {}) {
  if (typeof code !== 'string' || code.length > 100_000) throw new Error('The solution is too large to run.')
  if (!/^[A-Za-z_$][\w$]*$/.test(functionName)) throw new Error('Invalid entry function.')
  const project = decodeFiles(code)
  const prelude = guarded ? loopGuardSource : ''
  const loops = guarded ? [guardLoops] : []
  if (!project) {
    const script = transpile(code, jsx ? 'solution.tsx' : 'solution.ts', ts.ModuleKind.ESNext, [dropExports, ...loops])
    // TypeScript marks a file that had exports as a module with `export {}`; a script cannot contain it.
    return prelude + script.replace(/^export \{\};?\s*$/m, '')
  }
  const modules = Object.fromEntries(
    Object.entries(project.files).map(([name, source]) => [name, transpile(source, name, ts.ModuleKind.CommonJS, loops)]),
  )
  return `${prelude}const ${functionName} = (() => {
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
      // Module bodies compile in global scope, so the loop guard is passed in rather than found in this scope.
      new Function('module', 'exports', 'require', '__codeRepsLoop', modules[name])(module, module.exports, require, ${guarded ? '__codeRepsLoop' : 'undefined'});
      return module.exports;
    };
    return load(${JSON.stringify(project.entry)})[${JSON.stringify(functionName)}];
  })();`
}
