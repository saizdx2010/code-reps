import { encodeFiles } from '../../src/project-files.ts'
import { richSolutions } from './rich-solutions.mjs'
export const capstoneSolutions = {
  'project-team-directory': encodeFiles({ entry: 'directory.ts', files: {
    'data.ts': 'export function visiblePeople(people: {name:string}[], query:string) { const text=query.trim().toLowerCase(); return people.filter(person=>person.name.toLowerCase().includes(text)) }',
    'directory.ts': 'import { visiblePeople } from "./data"\nexport ' + richSolutions['frontend-directory'].trim().replace('const people = state.people.filter(person => person.name.toLowerCase().includes(query))', 'const people = visiblePeople(state.people, query)'),
  } }),
  'project-ticket-api': encodeFiles({ entry: 'handler.ts', files: {
    'query.ts': `export function parseQuery(q: unknown) {
      if(!q || typeof q !== 'object' || Array.isArray(q)) return null;
      const {status,search='',page=1,size=2}=q as Record<string,unknown>;
      if((status!==undefined && status!=='open' && status!=='closed') || typeof search!=='string' || typeof page!=='number' || !Number.isInteger(page) || page<1 || typeof size!=='number' || !Number.isInteger(size) || size<1 || size>3) return null;
      return {status,search:search.trim().toLowerCase(),page,size};
    }`,
    'handler.ts': `import { parseQuery } from './query';
      export function handleTickets(request:{method:string;query:unknown}, tickets:{id:string;title:string;status:string}[]) {
        if(request.method!=='GET')return {status:405,body:{error:'METHOD_NOT_ALLOWED'}};
        const q=parseQuery(request.query); if(!q)return {status:400,body:{error:'INVALID_QUERY'}};
        const {status,search,page,size}=q;
        const filtered=tickets.filter(t=>(status===undefined||t.status===status)&&t.title.toLowerCase().includes(search));
        return {status:200,body:{items:filtered.slice((page-1)*size,page*size),total:filtered.length,page,size}};
      }`,
  } }),
}
