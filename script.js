// ==========================================
// 1. AUTO-FORMATOWANIE I NAWIGACJA
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // Nawigacja Enterem
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
            e.preventDefault();
            
            // Sprawdzanie, czy to ostatnie pole w którymś z zadań
            if (e.target.id === 't1-bc') { checkTask1(); return; }
            if (e.target.id === 't2-valid') { checkTask2(); return; }
            if (e.target.id === 't4-bc') { checkTask34(); return; }

            // Przejście do następnego pola
            const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="number"]:not([readonly])'));
            const index = inputs.indexOf(e.target);
            
            if (index > -1 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            } else {
                e.target.blur();
            }
        }
    });

    // Formatowanie po opuszczeniu pola
    document.addEventListener('focusout', function(e) {
        if (e.target && e.target.classList.contains('auto-format')) {
            let val = e.target.value.trim();
            if (!val) return;

            val = val.replace(/,/g, '.');

            if (e.target.id.includes('range')) {
                if (val.includes('-')) {
                    let parts = val.split('-');
                    if (parts.length === 2) val = `${parts[0].trim()} - ${parts[1].trim()}`;
                } else if (val.includes(' ')) {
                    let parts = val.split(/\s+/);
                    if (parts.length === 2) val = `${parts[0]} - ${parts[1]}`;
                }
            } else {
                val = val.replace(/\s+/g, '.');
                val = val.replace(/\.+/g, '.');
            }
            e.target.value = val;
        }
    });
});

// ==========================================
// 2. FUNKCJE POMOCNICZE I ZARZĄDZANIE
// ==========================================
function switchTab(tabId, btnElement) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).classList.remove('hidden');
    btnElement.classList.add('active');
}

function ipToInt(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function intToIp(int) {
    return [(int >>> 24) & 255, (int >>> 16) & 255, (int >>> 8) & 255, int & 255].join('.');
}

function getMaskFromCidr(cidr) {
    let maskBinStr = "".padStart(cidr, '1').padEnd(32, '0');
    return [
        parseInt(maskBinStr.slice(0, 8), 2),
        parseInt(maskBinStr.slice(8, 16), 2),
        parseInt(maskBinStr.slice(16, 24), 2),
        parseInt(maskBinStr.slice(24, 32), 2)
    ].join('.');
}

// ==========================================
// 3. KALKULATOR (TRYB TŁUMACZA)
// ==========================================
function calculate() {
    const ipStr = document.getElementById('ipInput').value;
    const cidr = parseInt(document.getElementById('cidrInput').value);

    const ipOctets = ipStr.split('.').map(Number);
    let maskBinStr = "".padStart(cidr, '1').padEnd(32, '0');
    let maskOctetsBin = [
        maskBinStr.slice(0, 8), maskBinStr.slice(8, 16),
        maskBinStr.slice(16, 24), maskBinStr.slice(24, 32)
    ];
    let maskOctetsDec = maskOctetsBin.map(bin => parseInt(bin, 2));

    let networkOctets = [];
    let broadcastOctets = [];
    for (let i = 0; i < 4; i++) {
        networkOctets[i] = ipOctets[i] & maskOctetsDec[i];
        broadcastOctets[i] = networkOctets[i] | (255 - maskOctetsDec[i]);
    }

    const hostBits = 32 - cidr; 
    const maxHosts = Math.pow(2, hostBits) - 2;
    let interestingOctetIndex = Math.floor((cidr === 32 ? 31 : cidr) / 8);

    let mixedMask = maskOctetsDec.map((dec, i) => {
        if(i < interestingOctetIndex) return "255";
        if(i === interestingOctetIndex) return maskOctetsBin[i];
        return "00000000";
    }).join('.');

    const resultsDiv = document.getElementById('results');
    resultsDiv.classList.remove('hidden');
    resultsDiv.innerHTML = `
        <div class="explanation-box">
            <h2>Wyniki dla ${ipStr}/${cidr}</h2>
            <ul>
                <li><strong>Maska dziesiętnie:</strong> ${maskOctetsDec.join('.')}</li>
                <li><strong>Adres Sieci:</strong> ${networkOctets.join('.')}</li>
                <li><strong>Broadcast:</strong> ${broadcastOctets.join('.')}</li>
                <li><strong>Maksymalna liczba hostów:</strong> ${maxHosts < 0 ? 0 : maxHosts}</li>
            </ul>
            <h3>Jak to policzyć na kartce?</h3>
            <ul>
                <li><strong>JEDYNKI licz od LEWEJ:</strong> Maska to /${cidr}, czyli masz ${cidr} jedynek określających sieć.</li>
                <li><strong>ZERA licz od PRAWEJ:</strong> Masz ${hostBits} zer określających pulę hostów. Ze wzoru <strong>2<sup>n</sup> - 2</strong>: 2<sup>${hostBits}</sup> - 2 = <strong>${maxHosts < 0 ? 0 : maxHosts}</strong>.</li>
            </ul>
        </div>
        <p style="margin-top:20px;"><strong>Wizualizacja maski w ciekawym oktecie:</strong></p>
        <div class="binary-view">Maska: ${mixedMask}</div>
        <p>Kluczowy oktet (nr ${interestingOctetIndex + 1}):</p>
        <div class="binary-view"><span class="highlight">Wagi:  128  64  32  16   8   4   2   1</span>
Bity:    ${maskOctetsBin[interestingOctetIndex].split('').join('   ')}</div>
    `;
}

// ==========================================
// 4. ZADANIE 1: KLASYCZNY PODZIAŁ
// ==========================================
let currentTask1 = {};

function generateTask1() {
    const subnetsOptions = [2, 4, 8, 16];
    const subnetsNeeded = subnetsOptions[Math.floor(Math.random() * subnetsOptions.length)];
    const bitsBorrowed = Math.log2(subnetsNeeded);
    const maxBaseCidr = 30 - bitsBorrowed;
    const baseCidr = Math.floor(Math.random() * (maxBaseCidr - 16 + 1)) + 16;
    
    let rawIpInt = ipToInt(`${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}.0`);
    let maskInt = parseInt("".padStart(baseCidr, '1').padEnd(32, '0'), 2) >>> 0;
    let baseNetworkInt = (rawIpInt & maskInt) >>> 0;
    const baseIP = intToIp(baseNetworkInt);

    const newCidr = baseCidr + bitsBorrowed;
    const targetSubnetNumber = Math.floor(Math.random() * subnetsNeeded) + 1; 
    const blockSize = Math.pow(2, 32 - newCidr); 
    
    const targetNetInt = baseNetworkInt + ((targetSubnetNumber - 1) * blockSize);
    const targetBcInt = targetNetInt + blockSize - 1;

    currentTask1 = {
        baseIP: baseIP, baseCidr: baseCidr, subnetsNeeded: subnetsNeeded,
        targetSubnet: targetSubnetNumber, newCidr: newCidr,
        correctMask: getMaskFromCidr(newCidr), correctNet: intToIp(targetNetInt),
        correctHostMin: intToIp(targetNetInt + 1), correctHostMax: intToIp(targetBcInt - 1),
        correctBc: intToIp(targetBcInt)
    };

    document.getElementById('task1-content').classList.remove('hidden');
    document.getElementById('task1-explanation').classList.add('hidden');
    document.getElementById('btn-explain-t1').classList.add('hidden');
    
    ['t1-mask', 't1-net', 't1-range', 't1-bc'].forEach(id => {
        let el = document.getElementById(id); el.value = ''; el.classList.remove('correct', 'incorrect');
    });

    document.getElementById('task1-question').innerHTML = 
        `Administrator dostał adres sieci <strong>${baseIP}/${baseCidr}</strong>. 
         Zaproponuj podział sieci na <strong>${subnetsNeeded}</strong> równe podsieci. 
         Wypełnij tabelę dla podsieci numer <strong>${targetSubnetNumber}</strong>.`;
}

function checkTask1() {
    let hasErrors = false;
    const cleanStr = (str) => str.replace(/\s/g, '');
    const validateField = (id, userInput, expectedValue) => {
        const el = document.getElementById(id);
        if (userInput === expectedValue) { el.classList.remove('incorrect'); el.classList.add('correct'); } 
        else { el.classList.remove('correct'); el.classList.add('incorrect'); hasErrors = true; }
    };

    validateField('t1-mask', cleanStr(document.getElementById('t1-mask').value), currentTask1.correctMask);
    validateField('t1-net', cleanStr(document.getElementById('t1-net').value), currentTask1.correctNet);
    validateField('t1-range', cleanStr(document.getElementById('t1-range').value), `${currentTask1.correctHostMin}-${currentTask1.correctHostMax}`);
    validateField('t1-bc', cleanStr(document.getElementById('t1-bc').value), currentTask1.correctBc);

    if (hasErrors) document.getElementById('btn-explain-t1').classList.remove('hidden');
    else { document.getElementById('btn-explain-t1').classList.add('hidden'); setTimeout(() => alert("Brawo! Wszystko poprawnie! 🎉"), 100); }
}

function solveTask1() {
    if (Object.keys(currentTask1).length === 0) return;
    document.getElementById('t1-mask').value = currentTask1.correctMask;
    document.getElementById('t1-net').value = currentTask1.correctNet;
    document.getElementById('t1-range').value = `${currentTask1.correctHostMin} - ${currentTask1.correctHostMax}`;
    document.getElementById('t1-bc').value = currentTask1.correctBc;
    ['t1-mask', 't1-net', 't1-range', 't1-bc'].forEach(id => {
        document.getElementById(id).classList.remove('incorrect'); document.getElementById(id).classList.add('correct');
    });
    document.getElementById('btn-explain-t1').classList.add('hidden');
    explainTask1();
}

function explainTask1() {
    const expDiv = document.getElementById('task1-explanation');
    expDiv.classList.remove('hidden');
    const bitsBorrowed = Math.log2(currentTask1.subnetsNeeded);
    expDiv.innerHTML = `
        <h3>Wyjaśnienie krok po kroku:</h3>
        <p>1. <strong>Maska:</strong> Chcemy ${currentTask1.subnetsNeeded} podsieci. Szukamy potęgi liczby 2: 2<sup>${bitsBorrowed}</sup> = ${currentTask1.subnetsNeeded}. Pożyczamy <strong>${bitsBorrowed} bity</strong>. Nowa maska to /${currentTask1.newCidr} (${currentTask1.correctMask}).</p>
        <p>2. <strong>Podsieć nr ${currentTask1.targetSubnet}:</strong> Przesuwając się o ${currentTask1.targetSubnet - 1} blok(i) wielkości ${Math.pow(2, 32 - currentTask1.newCidr)} adresów, otrzymujemy start: <strong>${currentTask1.correctNet}</strong>.</p>
        <p>3. <strong>Broadcast i Hosty:</strong> Broadcast to ostatni adres bloku (<strong>${currentTask1.correctBc}</strong>). Hosty to przestrzeń wewnątrz: <strong>${currentTask1.correctHostMin}</strong> - <strong>${currentTask1.correctHostMax}</strong>.</p>
    `;
}

// ==========================================
// 5. ZADANIE 2: IDENTYFIKACJA HOSTA
// ==========================================
let currentTask2 = {};

function generateTask2() {
    const cidr = Math.floor(Math.random() * (29 - 12 + 1)) + 12;
    const firstOctet = Math.floor(Math.random() * 223) + 1; 
    const rawIpInt = ipToInt(`${firstOctet}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}`);
    
    const maskInt = parseInt("".padStart(cidr, '1').padEnd(32, '0'), 2) >>> 0;
    const netInt = (rawIpInt & maskInt) >>> 0;
    const bcInt = netInt + Math.pow(2, 32 - cidr) - 1;
    
    let providedIpInt;
    let isValid = true;
    let invalidReason = "";
    
    const randChoice = Math.random();
    if (randChoice < 0.125) { 
        providedIpInt = netInt; isValid = false; invalidReason = "To jest adres samej sieci.";
    } else if (randChoice < 0.25) { 
        providedIpInt = bcInt; isValid = false; invalidReason = "To jest adres rozgłoszeniowy (Broadcast).";
    } else { 
        const hostOffset = Math.floor(Math.random() * (bcInt - netInt - 1)) + 1;
        providedIpInt = netInt + hostOffset;
    }

    currentTask2 = {
        providedIp: intToIp(providedIpInt), cidr: cidr, correctNet: intToIp(netInt),
        correctHostMin: intToIp(netInt + 1), correctHostMax: intToIp(bcInt - 1),
        correctBc: intToIp(bcInt), isValid: isValid, invalidReason: invalidReason
    };

    document.getElementById('task2-content').classList.remove('hidden');
    document.getElementById('task2-explanation').classList.add('hidden');
    document.getElementById('btn-explain-t2').classList.add('hidden');
    
    ['t2-net', 't2-range', 't2-bc', 't2-valid'].forEach(id => {
        let el = document.getElementById(id); el.value = ''; el.classList.remove('correct', 'incorrect');
    });

    document.getElementById('task2-question').innerHTML = `Urządzenie sieciowe dostało adres <strong>${currentTask2.providedIp}/${cidr}</strong>. Do której podsieci należy urządzenie?`;
}

function checkTask2() {
    let hasErrors = false;
    const cleanStr = (str) => str.replace(/\s/g, '');
    const validateField = (id, userInput, expectedValue) => {
        const el = document.getElementById(id);
        if (userInput === expectedValue) { el.classList.remove('incorrect'); el.classList.add('correct'); } 
        else { el.classList.remove('correct'); el.classList.add('incorrect'); hasErrors = true; }
    };

    validateField('t2-net', cleanStr(document.getElementById('t2-net').value), currentTask2.correctNet);
    validateField('t2-range', cleanStr(document.getElementById('t2-range').value), `${currentTask2.correctHostMin}-${currentTask2.correctHostMax}`);
    validateField('t2-bc', cleanStr(document.getElementById('t2-bc').value), currentTask2.correctBc);

    const uValidRaw = document.getElementById('t2-valid').value.trim().toLowerCase();
    let uValid = null;
    if (['tak', 't', 'yes', 'y'].includes(uValidRaw)) uValid = true;
    if (['nie', 'n', 'no'].includes(uValidRaw)) uValid = false;

    const validEl = document.getElementById('t2-valid');
    if (uValid === currentTask2.isValid) { validEl.classList.remove('incorrect'); validEl.classList.add('correct'); } 
    else { validEl.classList.remove('correct'); validEl.classList.add('incorrect'); hasErrors = true; }

    if (hasErrors) document.getElementById('btn-explain-t2').classList.remove('hidden');
    else { document.getElementById('btn-explain-t2').classList.add('hidden'); setTimeout(() => alert("Perfekcyjnie! Adresy zidentyfikowane bezbłędnie. 🚀"), 100); }
}

function solveTask2() {
    if (Object.keys(currentTask2).length === 0) return;
    document.getElementById('t2-net').value = currentTask2.correctNet;
    document.getElementById('t2-range').value = `${currentTask2.correctHostMin} - ${currentTask2.correctHostMax}`;
    document.getElementById('t2-bc').value = currentTask2.correctBc;
    document.getElementById('t2-valid').value = currentTask2.isValid ? "Tak" : "Nie";
    
    ['t2-net', 't2-range', 't2-bc', 't2-valid'].forEach(id => {
        document.getElementById(id).classList.remove('incorrect'); document.getElementById(id).classList.add('correct');
    });
    document.getElementById('btn-explain-t2').classList.add('hidden');
    explainTask2();
}

function explainTask2() {
    const expDiv = document.getElementById('task2-explanation');
    expDiv.classList.remove('hidden');
    let validExp = currentTask2.isValid ? `<p><strong>Adres jest prawidłowy:</strong> Leży wewnątrz puli hostów.</p>` : `<p><strong>Adres jest NIEPRAWIDŁOWY dla hosta:</strong> ${currentTask2.invalidReason}</p>`;
    expDiv.innerHTML = `
        <h3>Jak sprawdzić ten adres?</h3>
        <p>1. <strong>Adres podsieci:</strong> Po zastosowaniu maski /${currentTask2.cidr} otrzymujemy adres bazowy: <strong>${currentTask2.correctNet}</strong>.</p>
        <p>2. <strong>Broadcast i Hosty:</strong> Jej adres rozgłoszeniowy to <strong>${currentTask2.correctBc}</strong>. Hosty są od <strong>${currentTask2.correctHostMin}</strong> do <strong>${currentTask2.correctHostMax}</strong>.</p>
        ${validExp}
    `;
}

// ==========================================
// 6. ZADANIE 3 i 4: VLSM ORAZ SUPERSIECI
// ==========================================
let currentTask34 = {};

function generateTask34() {
    const possibleSizes = [10000, 4000, 2000, 1000, 500, 250, 100, 60, 30, 15];
    let requirements = [];
    
    let numDepts = Math.floor(Math.random() * 2) + 3; 
    let alphabet = "ABCDEF";
    for(let i=0; i<numDepts; i++) requirements.push({ name: `Dział ${alphabet[i]}`, needed: possibleSizes[Math.floor(Math.random()*possibleSizes.length)] });
    
    let numRouters = Math.floor(Math.random() * 3) + 2;
    for(let i=0; i<numRouters; i++) requirements.push({ name: `Router ${i+1}`, needed: 2 });

    const reqStr = requirements.map(r => `${r.name}=${r.needed}`).join(', ');
    requirements.sort((a,b) => b.needed - a.needed);

    const baseIPs = ["10.0.0.0", "172.16.0.0", "172.20.0.0", "10.128.0.0"];
    const baseIPStr = baseIPs[Math.floor(Math.random() * baseIPs.length)];
    let currentIpInt = ipToInt(baseIPStr);
    
    let vlsmData = [];
    
    requirements.forEach(req => {
        let bitsNeeded = Math.ceil(Math.log2(req.needed + 2));
        let cidr = 32 - bitsNeeded;
        let blockSize = Math.pow(2, bitsNeeded);

        let netInt = currentIpInt;
        let bcInt = netInt + blockSize - 1;

        vlsmData.push({
            name: req.name, needed: req.needed, cidr: cidr, maskDec: getMaskFromCidr(cidr),
            net: intToIp(netInt), hostMin: intToIp(netInt + 1), hostMax: intToIp(bcInt - 1), bc: intToIp(bcInt)
        });
        currentIpInt += blockSize; 
    });

    let firstNetInt = ipToInt(vlsmData[0].net);
    let lastBcInt = ipToInt(vlsmData[vlsmData.length - 1].bc);

    let commonBits = 32;
    let mask = 0xFFFFFFFF;
    while ((firstNetInt & mask) !== (lastBcInt & mask)) {
        commonBits--;
        mask = (mask << 1) >>> 0; 
    }

    let supernetInt = (firstNetInt & mask) >>> 0;
    let superBcInt = supernetInt + Math.pow(2, 32 - commonBits) - 1;

    currentTask34 = {
        baseIP: baseIPStr, vlsm: vlsmData, reqStr: reqStr,
        supernet: { cidr: commonBits, maskDec: getMaskFromCidr(commonBits), net: intToIp(supernetInt), bc: intToIp(superBcInt) }
    };

    renderTask34();
}

function renderTask34() {
    document.getElementById('task34-content').classList.remove('hidden');
    document.getElementById('task34-explanation').classList.add('hidden');
    document.getElementById('btn-explain-t34').classList.add('hidden');

    document.getElementById('t3-question').innerHTML = `Masz adres sieci <strong>${currentTask34.baseIP}</strong>. Zaproponuj podział na podsieci (VLSM).`;
    document.getElementById('t3-requirements').innerText = `Zapotrzebowanie: ${currentTask34.reqStr}`;

    const tbody = document.getElementById('t3-tbody');
    tbody.innerHTML = '';
    currentTask34.vlsm.forEach((sub, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${sub.needed}</td>
            <td><input type="text" id="t3-net-${i}" class="auto-format"></td>
            <td><input type="text" id="t3-range-${i}" class="auto-format"></td>
            <td><input type="text" id="t3-bc-${i}" class="auto-format"></td>
            <td><input type="text" id="t3-mask-${i}" class="auto-format" placeholder="/X lub dec"></td>
        `;
        tbody.appendChild(tr);
    });

    ['t4-mask', 't4-net', 't4-bc'].forEach(id => {
        let el = document.getElementById(id); el.value = ''; el.classList.remove('correct', 'incorrect');
    });
}

function checkTask34() {
    let hasErrors = false;
    const cleanStr = (str) => str.replace(/\s/g, '');

    const validate = (id, userInput, expectedValue1, expectedValue2 = null) => {
        const el = document.getElementById(id);
        if (userInput === expectedValue1 || userInput === expectedValue2) { el.classList.remove('incorrect'); el.classList.add('correct'); } 
        else { el.classList.remove('correct'); el.classList.add('incorrect'); hasErrors = true; }
    };

    currentTask34.vlsm.forEach((sub, i) => {
        validate(`t3-net-${i}`, cleanStr(document.getElementById(`t3-net-${i}`).value), sub.net);
        validate(`t3-range-${i}`, cleanStr(document.getElementById(`t3-range-${i}`).value), `${sub.hostMin}-${sub.hostMax}`);
        validate(`t3-bc-${i}`, cleanStr(document.getElementById(`t3-bc-${i}`).value), sub.bc);
        let uMask = cleanStr(document.getElementById(`t3-mask-${i}`).value);
        validate(`t3-mask-${i}`, uMask, sub.maskDec, `/${sub.cidr}`);
        if(uMask === sub.cidr.toString()) document.getElementById(`t3-mask-${i}`).classList.add('correct'); 
    });

    validate('t4-net', cleanStr(document.getElementById('t4-net').value), currentTask34.supernet.net);
    validate('t4-bc', cleanStr(document.getElementById('t4-bc').value), currentTask34.supernet.bc);
    validate('t4-mask', cleanStr(document.getElementById('t4-mask').value), currentTask34.supernet.maskDec, `/${currentTask34.supernet.cidr}`);

    if (hasErrors) document.getElementById('btn-explain-t34').classList.remove('hidden');
    else { document.getElementById('btn-explain-t34').classList.add('hidden'); setTimeout(() => alert("Epicko! VLSM i Supersieci rozwalone bezbłędnie! 👑"), 100); }
}

function solveTask34() {
    if (Object.keys(currentTask34).length === 0) return;
    currentTask34.vlsm.forEach((sub, i) => {
        document.getElementById(`t3-net-${i}`).value = sub.net;
        document.getElementById(`t3-range-${i}`).value = `${sub.hostMin} - ${sub.hostMax}`;
        document.getElementById(`t3-bc-${i}`).value = sub.bc;
        document.getElementById(`t3-mask-${i}`).value = sub.maskDec;
        [`t3-net-${i}`, `t3-range-${i}`, `t3-bc-${i}`, `t3-mask-${i}`].forEach(id => {
            document.getElementById(id).classList.remove('incorrect'); document.getElementById(id).classList.add('correct');
        });
    });

    document.getElementById('t4-net').value = currentTask34.supernet.net;
    document.getElementById('t4-bc').value = currentTask34.supernet.bc;
    document.getElementById('t4-mask').value = currentTask34.supernet.maskDec;

    ['t4-net', 't4-bc', 't4-mask'].forEach(id => {
        document.getElementById(id).classList.remove('incorrect'); document.getElementById(id).classList.add('correct');
    });
    document.getElementById('btn-explain-t34').classList.add('hidden');
    explainTask34();
}

function explainTask34() {
    const expDiv = document.getElementById('task34-explanation');
    expDiv.classList.remove('hidden');
    let html = `<h3>Zad. 3: Logika VLSM</h3><p><strong>1. Sortowanie:</strong> Najpierw układamy duże działy, na końcu sieci dla routerów (/30).</p><ul>`;
    currentTask34.vlsm.forEach(sub => {
        html += `<li><strong>Potrzeba ${sub.needed}:</strong> Szukamy 2<sup>n</sup> - 2 >= ${sub.needed}. Potrzebujemy ${32 - sub.cidr} bitów na hosty. Maska to /${sub.cidr} (${sub.maskDec}).</li>`;
    });
    html += `</ul><h3>Zad. 4: Logika Supersieci (Agregacji)</h3>
    <p>Szukamy "wspólnego mianownika" bitowego dla <strong>${currentTask34.vlsm[0].net}</strong> oraz <strong>${currentTask34.vlsm[currentTask34.vlsm.length - 1].bc}</strong>.</p>
    <p>Wspólne od lewej: <strong>${currentTask34.supernet.cidr}</strong> bitów (maska). Adresem tej połączonej struktury staje się <strong>${currentTask34.supernet.net}</strong>.</p>`;
    expDiv.innerHTML = html;
}
