// sql.js ships no types of its own, and `@types/sql.js` pulls in DOM-dependent emscripten types,
// so the module is declared loosely here and cast to our own `InitSqlJs` at the use site.
declare module 'sql.js' {
  const initSqlJs: (config?: Record<string, unknown>) => Promise<unknown>;
  export default initSqlJs;
}
