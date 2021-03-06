/*jshint esversion: 6 */ 

let oddaja = "";
let vrednotenje = {};
let offsets = {};
let stNaloga = 0;

function cE(tag, innerHTML, classList, parent) {
    let el = document.createElement(tag);
    if (innerHTML) el.innerHTML = innerHTML;
    if (classList) el.classList = classList;
    if (parent) parent.appendChild(el);
    return el;
}

function zacniOcenjevanje() {
    document.getElementById('vnos').style.display = 'none';
    oddaja = document.getElementById('oddaja').value;

    let xhttp = new XMLHttpRequest();
    xhttp.onload = (ev) => {
        let json = JSON.parse(ev.target.responseText);
        vrednotenje = json.vrednotenja;
        offsets = json.offsets;
        izpisiStran();
    };

    stNaloga = document.getElementById('naloga').value;

    xhttp.open('GET', 'naloge/' + stNaloga + '.json');
    xhttp.send();
}

function napaka(besedilo) {
    let naloge = document.getElementById('naloge');
    naloge.innerHTML = '';
    let row = cE('div', '', 'row mt-5', naloge);
    let col = cE('div', '', 'col-md-6 offset-md-3 text-center', row);
    cE('h2', besedilo, 'text-danger', col);
    let btn = cE('button', 'Nazaj', 'btn btn-secondary', col);
    btn.onclick = () => {
        document.getElementById('vnos').style.display = '';
        naloge.innerHTML = '';
    };
}

function oceniOddajo() {
    let ocena = document.getElementById('ocena');
    ocena.innerHTML = '';
    let tbl = cE('table', '<thead><tr><th scope="col">Sklop</th><th scope="col">Točke</th></tr></thead>', 'table mb-5', ocena);
    let body = cE('tbody', '', '', tbl);

    let vsota = {};
    
    Array.from(document.querySelectorAll('input[type="checkbox"]')).forEach( (el) => {
        let value = (el.checked) ? parseInt(el.value) : 0;
        if (vsota[el.sklop]) 
            vsota[el.sklop] += value;
        else
            vsota[el.sklop] = value;
    });

    Array.from(document.querySelectorAll('input[type="number"]')).forEach( (el) => {
        let value = parseInt(el.value);
        if (vsota[el.sklop]) 
            vsota[el.sklop] += value;
        else
            vsota[el.sklop] = value;
    });
    
    let skupaj = 0;

    let celice = [];
    Object.keys(vsota).forEach( (sklop) => {
        let tr = cE('tr', '', '', body);
        cE('td', sklop, '', tr);
        cE('td', (vsota[sklop]) ? vsota[sklop] : '0', '', tr);
        skupaj += vsota[sklop];
        celice.push('"' + offsets[sklop][vsota[sklop]] + '"');
    });
    let tr = cE('tr', '', '', body);
    cE('th', 'Skupaj', '', tr);
    cE('th', skupaj, '', tr);

    cE('p','Hitri vnos v Moodle - prilepi v konzolo na strani za vrednotenje oddaje', 'lead', ocena);
    let obvestilo = cE('h4', '', 'badge bg-secondary', ocena);
    let ta = cE('textarea', '[' + celice.join(',') + '].forEach((i)=>{document.getElementById("id_chosenlevelid__idx_"+i).checked=true;});', 'mb-5 w-100', ocena);
    ta.onclick = (el) => {
        el.target.select();
        document.execCommand("copy");
        obvestilo.innerHTML = 'Kopirano v odložišče';
    };
    ta.rows = 3;
    cE('p','Oblikovani komentarji - prilepi v okno za komentarje na strani za vrednotenje oddaje', 'lead', ocena);
    let obvestilo_komentarji = cE('h4', '' , 'badge bg-secondary', ocena);
    let komentarji = cE('textarea', '', 'mb-5 w-100', ocena);
    komentarji.id = 'komentarji-vsi';
    komentarji.onclick = (el) => {
        el.target.select();
        document.execCommand("copy");
        obvestilo_komentarji.innerHTML = 'Kopirano v odložišče';
    };
    komentarji.innerHTML = vrniKomentarje();
}

function xmlDiff(prikazDiv, targetXml) {
    let xhttp = new XMLHttpRequest();
    xhttp.onload = (ev) => {
        let targetHtml = ev.target.responseText;
        
        let card = cE('div', '', 'card mx-auto', prikazDiv);
        let cardBody = cE('div', '', 'card-body', card);
        cE('h5', '<a class="link-dark" href="https://teaching.lavbic.net/cdn/OIS/DN2/' + targetXml.replace('html', 'xml') + '"> Vstavi shranjeno ' + targetXml + '</a>', 'card-title', cardBody);
        cE('h6', 'Svoj racun shrani kot .html (desni klik->Shrani stran kot...) in ga vstavi sem', 'card-title', cardBody);
        let input = cE('input', '', 'card-subtitle my-2', cardBody);
        input.type = 'file';
        input.accept = "text/html";
        
        let diffcard = cE('div', '', 'card mx-auto mt-1', cardBody);
        diffcard.hidden = true;
        let diffcardBody = cE('div', '', 'card-body', diffcard);
        cE('h6', 'Prikazana razlika', 'card-title', diffcardBody);
        let status = cE('h6', '', 'card-title', diffcardBody);
        let diffBody = cE('h6', '', 'card-subtitle', diffcardBody);
        let pre = cE('pre', '<code class="language-diff hljs"></code>', 'card-text', diffBody);
        
        input.onchange = (iev) => {
            const reader = new FileReader();
            
            reader.onload = (fev) => {
                diffcard.hidden = false;
                let t1 = document.createElement('div');
                t1.innerHTML = targetHtml;
                let t2 = document.createElement('div');
                t2.innerHTML = fev.target.result;
                
                result = patienceDiffPlus(t1.innerText.split('\n'), t2.innerText.split('\n'));
                let diffLines = "";

                result.lines.forEach((o) => {
                    if (o.line.trim() == "") {
                        return;
                    } else if (o.bIndex < 0 && o.moved) {
                        diffLines += "-m  ";
                    } else if (o.moved) {
                        diffLines += "+m  ";
                    } else if (o.aIndex < 0) {
                        diffLines += "+   ";
                    } else if (o.bIndex < 0) {
                        diffLines += "-   ";
                    } else {
                        return;
                    }
                    diffLines += o.line.trim() + "\n";
                });
                if(!diffLines) {
                    diffLines = "@@ Brez razlike!";
                }
                pre.firstChild.innerHTML = diffLines.replaceAll('<', '&lt;');
                status.innerHTML = `<span class="text-success">+${result.lineCountInserted}</span> <span class="text-danger">-${result.lineCountDeleted}</span> <span class="text-info">M${result.lineCountMoved}</span>`;

                hljs.highlightElement(pre.firstChild);
            };

            reader.readAsText(iev.target.files[0]);
        };

    };
    xhttp.open('GET', 'naloge/eracun/' + targetXml);
    xhttp.send();
}

function izpisiStran() {
    let naloge = document.getElementById('naloge');
    let nav = document.getElementById('navigacija');
    naloge.innerHTML = '';
    nav.innerHTML = '';

    if(stNaloga == "1") {
        vrednotenje.forEach((el, index) => {
            let row = cE('div', '', 'row mt-3 mx-5', naloge);
            cE('hr', '', 'w-100', row);
            let tockeDiv = cE('div', '', 'col-md-6', row);
            let prikazDiv = cE('div', '', 'col-md-6', row);
    
            for (let i = 0; i < el.navodila.length; i++) {
                if (i > 0)
                    cE('hr', '', 'w-100', tockeDiv);
                if (el.navodila[i].naslov)
                    cE('h5', el.navodila[i].naslov, '', tockeDiv);
    
                let ol = cE('ol', '', 'form-group mt-1', tockeDiv);
    
                for (let j = 0; j < el.navodila[i].naloge.length; j++) {
                    let li = cE('li', '', '', ol);
                    let label = cE('label', '' , 'tocke mx-2', li);
                    label.for = index + '-' + el.navodila[i].sklop + '-' + j;
                    let cbx = cE('input', '', '', label);
    
                    if(el.navodila[i].naloge[j].tocke == 1){
                        cbx.type = 'checkbox';
                        cbx.value = el.navodila[i].naloge[j].tocke; }
                    else{
                        cbx.type = 'number';
                        cbx.max = el.navodila[i].naloge[j].tocke;
                        cbx.min = cbx.value = 0;
                        cbx.style.width = "2em";
                        cbx.onclick = (ev) =>  ev.stopPropagation();
                        cbx.oninput = () => {
                            if (parseInt(cbx.value) > parseInt(cbx.max))
                                cbx.value = cbx.max;
                            else if (parseInt(cbx.value) < parseInt(cbx.min))
                                cbx.value = cbx.min;
                            oceniOddajo();
                        };
                        label.onclick = () => {
                            cbx.value = el.navodila[i].naloge[j].tocke;
                        };
                    }
                    cbx.id = index + '-' + el.navodila[i].sklop + '-' + j;
                    cbx.sklop = (index + 1) + '.' + el.navodila[i].sklop;
                    cbx.onchange = oceniOddajo;
                    let tocke = 'točke';
                    switch(el.navodila[i].naloge[j].tocke % 10){
                        case 0: tocke = 'točk'; break;
                        case 1: tocke = 'točka'; break;
                        case 2: tocke = 'točki'; break;
                    }
                    label.appendChild(document.createTextNode(' ' + el.navodila[i].naloge[j].tocke + ' ' + tocke));
                    cE('span', el.navodila[i].naloge[j].besedilo , '', li);
                }
    
                if (el.navodila[i].opomba)
                    cE('p', el.navodila[i].opomba, 'small', tockeDiv);
                
                let komentarji_label = cE('label', 'Lastni komentarji' , 'mt-1 w-100', tockeDiv);
                komentarji_label.for = "textarea";
                let komentarji = cE('textarea', '', 'form-control w-100', komentarji_label);
                komentarji.id = el.navodila[i].sklop + "-komentar";
                komentarji.onchange = () =>  {oceniOddajo();};
            }
                
            switch(el.tip) {
                case 'prikazi': {
                    let rexp = new RegExp(el.format, 's');
                    let resitev = rexp.exec(oddaja);
                    if (resitev && resitev.length == 2) {
                        resitev = resitev[1];
                        let card = cE('div', '', 'card mx-auto', prikazDiv);
                        let cardBody = cE('div', '', 'card-body', card);
                        cE('pre', '<code>' + resitev + '</code>', 'card-text', cardBody);
    
                    }
                    else {
                        cE('h5', 'Ne najdem rešitve v oddaji', 'text-danger', prikazDiv);
                    }
                    break;
                }
                case 'commit': {
    
                    let rexp = new RegExp(el.format, 's');
                    let url = rexp.exec(oddaja);
                    if (url && url.length == 2) {
                        url = url[1];
                        let xhttp = new XMLHttpRequest();
                        xhttp.onload = (ev) => {
                            let commit = JSON.parse(ev.target.responseText);
                            let card = cE('div', '', 'card mx-auto', prikazDiv);
                            let cardBody = cE('div', '', 'card-body', card);
                            cE('h5', '<a class="link-dark" href="' + url + '">' + commit.commit.message + '</a>', 'card-title', cardBody);
                            cE('h6', '<span class="text-success">+' + commit.stats.additions + " </span>" +
                                     '<span class="text-danger"> -' + commit.stats.deletions + "</span>",
                                'card-subtitle', cardBody);
                            
                            commit.files.forEach( (file) => {
                                let filecard = cE('div', '', 'card mx-auto mt-1', cardBody);
                                let filecardBody = cE('div', '', 'card-body', filecard);
                                cE('h6', '<a class="link-dark" href="' + file.blob_url + '">' + file.filename + '</a>', 'card-title', filecardBody);
                                cE('h6', '<span class="text-success">+' + file.additions + " </span>" +
                                        '<span class="text-danger"> -' + file.deletions + " </span>" + 
                                        '<span class="text-secondary">' + file.status + "</span>",
                                    'card-subtitle', filecardBody);
                                let pre = cE('pre', '<code class="language-diff hljs">' + file.patch.replaceAll('<', '&lt;') + '</code>', 'card-text', filecardBody);
                                hljs.highlightElement(pre.firstChild);
                            });
    
                        };
    
                        xhttp.open('GET', 'git.php?dst=' + url);
                        xhttp.send();
                    }
                    else {
                        cE('h5', 'Ne najdem rešitve v oddaji', 'text-danger', prikazDiv);
                    }
                    break;
                }
                case 'prenesi' : {
                    let rexp = new RegExp(el.format, 's');
                    let url = rexp.exec(oddaja);
                    if (url && url.length == 2) {
                        url = url[1];
                        let card = cE('div', '', 'card mx-auto', prikazDiv);
                        let cardBody = cE('div', '', 'card-body', card);
                        cE('ic', 'git clone ' + url, 'card-text', cardBody);
                    } else {
                        cE('h5', 'Ne najdem rešitve v oddaji', 'text-danger', prikazDiv);
                    }
                    break;
                }
                default:{
                    cE('h5', 'Neznan tip prikaza', 'text-danger', prikazDiv);
                    break;
                }
            }
    
            row.id = 'naloga-' + (index + 1);
            let a = cE('a', index + 1, 'nav-link', nav);
            a.href = '#naloga-' + (index + 1);
        });
    } else if (stNaloga == "2" || stNaloga == "3") {
        vrednotenje.forEach((el, index) => {
            let row = cE('div', '', 'row mt-3 mx-5', naloge);
            cE('hr', '', 'w-100', row);

            let tockeDiv;
            let prikazDiv;
            if(el.tip == "eracun"){
                tockeDiv = cE('div', '', 'col-md-6', row);
                prikazDiv = cE('div', '', 'col-md-6', row);
                xmlDiff(prikazDiv, el.html);
            } else {
                tockeDiv = cE('div', '', 'col-md-12', row);
            }
    
            for (let i = 0; i < el.navodila.length; i++) {
                if (i > 0)
                    cE('hr', '', 'w-100', tockeDiv);
                if (el.navodila[i].naslov)
                    cE('h5', el.navodila[i].sklop + '. ' + el.navodila[i].naslov, '', tockeDiv);
    
                let ol = cE('ol', '', 'form-group mt-1', tockeDiv);
    
                for (let j = 0; j < el.navodila[i].naloge.length; j++) {
                    let li = cE('li', '', '', ol);
                    let label = cE('label', '' , 'tocke mx-2', li);
                    label.for = index + '-' + el.navodila[i].sklop + '-' + j;
                    let cbx = cE('input', '', '', label);
    
                    if(el.navodila[i].naloge[j].tocke == 1){
                        cbx.type = 'checkbox';
                        cbx.value = el.navodila[i].naloge[j].tocke; }
                    else{
                        cbx.type = 'number';
                        cbx.max = el.navodila[i].naloge[j].tocke;
                        cbx.min = cbx.value = 0;
                        cbx.style.width = "2em";
                        cbx.onclick = (ev) =>  ev.stopPropagation();
                        cbx.oninput = () => {
                            if (parseInt(cbx.value) > parseInt(cbx.max))
                                cbx.value = cbx.max;
                            else if (parseInt(cbx.value) < parseInt(cbx.min))
                                cbx.value = cbx.min;
                            oceniOddajo();
                        };
                        label.onclick = () => {
                            cbx.value = el.navodila[i].naloge[j].tocke;
                            oceniOddajo();
                        };
                    }
                    cbx.id = index + '-' + el.navodila[i].sklop + '-' + j;
                    cbx.sklop = (index + 1) + '.' + el.navodila[i].sklop;
                    cbx.onchange = oceniOddajo;
                    let tocke = 'točke';
                    switch(el.navodila[i].naloge[j].tocke % 10){
                        case 0: tocke = 'točk'; break;
                        case 1: tocke = 'točka'; break;
                        case 2: tocke = 'točki'; break;
                    }
                    label.appendChild(document.createTextNode(' ' + el.navodila[i].naloge[j].tocke + ' ' + tocke));
                    cE('span', el.navodila[i].naloge[j].besedilo , '', li);
                }
    
                if (el.navodila[i].opomba)
                    cE('p', el.navodila[i].opomba, 'small', tockeDiv);
                
                let komentarji_label = cE('label', 'Lastni komentarji' , 'mt-1 w-100', tockeDiv);
                komentarji_label.for = "textarea";
                let komentarji = cE('textarea', '', 'form-control w-100', komentarji_label);
                komentarji.id = el.navodila[i].sklop + "-komentar";
                komentarji.onchange = () =>  {oceniOddajo();};
            }

            row.id = 'naloga-' + (index + 1);
            let a = cE('a', index + 1, 'nav-link', nav);
            a.href = '#naloga-' + (index + 1);
        });
    }

    hljs.highlightAll();
    let a = cE('a', 'Ocena', 'nav-link', nav);
    a.href = '#ocena';
    oceniOddajo();
}

function vrniKomentarje() {
    var komentarji = document.querySelectorAll('[id*="komentar"]');
    var vsi_komentarji = "";
    for (var i = 0; i < komentarji.length; i++) {
        if (komentarji[i].value.length>0) {
            vsi_komentarji += "# " + komentarji[i].id.split("-")[0] + " # " + komentarji[i].value + " #\n";
        }
    }
    document.getElementById('komentarji-vsi').value = vsi_komentarji;
}
