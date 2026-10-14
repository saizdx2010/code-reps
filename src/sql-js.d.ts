declare module 'sql.js' {
  export default function initSqlJs(options: {
    locateFile: (file: string) => string
  }): Promise<{ Database: new () => import('./sqlite-task.ts').SqliteDatabase }>
}
