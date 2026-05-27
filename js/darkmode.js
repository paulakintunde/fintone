// js/darkmode.js — Dark-mode fast path (must load in <head> before body renders)
// Reads the cached preference and applies .dark before first paint to prevent FOUC.
(function(){try{var s=localStorage.getItem('finflow_dark_cache');if(s==='true')document.body.classList.add('dark');}catch(e){}}());
