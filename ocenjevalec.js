/*jshint esversion: 6 */ 

let oddaja = "";
let vrednotenje = {};
let offsets = {};

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

    xhttp.open('GET', 'naloge/' + document.getElementById('naloga').value + '.json');
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
    
    Array.from(document.querySelectorAll('input[type="checkbox"]:not(#flexSwitchCheckChecked)')).forEach( (el) => {
        let value = (el.checked) ? parseInt(el.value) : 0;
        if (vsota[el.sklop]) 
            vsota[el.sklop] += value;
        else
            vsota[el.sklop] = value;
    });

    Array.from(document.querySelectorAll('input[type="number"]')).forEach( (el) => {
        vsota[el.sklop] += parseInt(el.value);
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

let linkRepoz = "";

function izpisiStran() {
    let naloge = document.getElementById('naloge');
    let nav = document.getElementById('navigacija');
    naloge.innerHTML = '';
    nav.innerHTML = '';
    vrednotenje.forEach((el, index) => {
        let row = cE('div', '', 'row mt-3 mx-5', naloge);
        cE('hr', '', '', row);
        let tockeDiv = cE('div', '', 'col-md-6', row);
        let prikazDiv = cE('div', '', 'col-md-6', row);

        for (let i = 0; i < el.navodila.length; i++) {
            if (i > 0)
                cE('hr', '', '', tockeDiv);
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
                            let filecard = cE('div', '', 'card mx-auto', cardBody);
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

async function spremeniBarve() {
    let html = document.querySelector('html');
    // console.log(html);
    if (html.className == "dark-mode") {
        html.className = "";
        document.getElementById('ninja-image').src = "ninja.png";
    } else {
        html.className = "dark-mode";
        document.getElementById('ninja-image').src = "ninja-dark.png";
    }
}