import { rolldown } from 'rolldown'
export async function bundleReactFrame() {
  const bundle = await rolldown({
    input: new URL('../src/react-frame-runtime.mjs', import.meta.url).pathname,
    platform: 'browser',
    transform: { define: { 'process.env.NODE_ENV': JSON.stringify('production') } },
  })
  try {
    const result = await bundle.generate({ format: 'iife', minify: true })
    return result.output[0].code
  } finally {
    await bundle.close()
  }
}
