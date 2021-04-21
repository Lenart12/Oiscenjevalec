/*jshint esversion: 6 */ 


const N = 17;
let offsets = {};
const CRIT = Array.from(document.querySelectorAll('td[class="criterion"]')).map(td => td.innerText.split('\n')[1]);

for(let i = 0; i < N; i++){
    offsets[CRIT[i]] = Array.from(document.querySelectorAll(`[name=chosenlevelid__idx_${i}]`)).map(e => i +"_" + e.value);
}

console.log(JSON.stringify(offsets));