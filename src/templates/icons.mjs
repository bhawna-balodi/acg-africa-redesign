// One local, dependency-free outline vocabulary. CSS masks are decorative:
// existing text supplies meaning, with no additional DOM or focus stops.
const paths={
 concept:'<path d="M9 18h6m-5 3h4M8 13a6 6 0 1 1 8 0c-1 1-1 2-1 2H9s0-1-1-2Z"/>',
 feasibility:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M7 10l2 2 4-4"/>',
 bankability:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-5"/>',
 delivery:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 20v-5h6v5M8 8h2m4 0h2M8 11h2m4 0h2"/>',
 operations:'<path d="M20 7v5h-5M4 17v-5h5M6 6a8 8 0 0 1 13 3M5 15a8 8 0 0 0 13 3"/>',
 people:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2m1-15a3 3 0 0 1 0 6m2 3a6 6 0 0 1 3 5v1"/>',
 route:'<circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 5h8a4 4 0 0 1 0 8H9a3 3 0 0 0 0 6h8"/>',
 link:'<path d="m10 13 4-4m-6 6-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 2 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0" transform="translate(1 1)"/>',
 growth:'<path d="M4 20V4m0 16h16M7 15l5-5 4 3 5-7m-5 0h5v5"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-14 4h2m4 0h2m-8 3h2"/>',
 mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
 external:'<path d="M14 3h7v7m0-7L10 14M10 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/>',
 forward:'<path d="M5 12h14m-6-6 6 6-6 6"/>'
};
export function renderIconTokens(){
 return ':root{'+Object.entries(paths).map(([name,path])=>{
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1e4844" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
  return `--icon-${name}:url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
 }).join(';')+'}\n';
}
