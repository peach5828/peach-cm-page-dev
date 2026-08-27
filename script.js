function preloadImages(list){
  list.forEach(src => {
    const img = new Image();
    img.src = src;
  });
}

function formatPrice(price){
  return Number(price).toLocaleString('ko-KR');
}

function replaceLineByPrefix(lines, prefix, newLine){
  const idx = lines.findIndex(line => line.trimStart().startsWith(prefix));
  if(idx !== -1){
    lines[idx] = newLine;
  }
  return lines;
}

let selectedBaseOption = null;
let selectedAddonOptions = [];
let isCommercialUsage = false;

function selectUsage(입력){
  isCommercialUsage = (입력 === 'com');
  const cardNon = document.getElementById('usageCardNon');
  const cardCom = document.getElementById('usageCardCom');
  if(isCommercialUsage){
    cardNon.classList.remove('selected');
    cardCom.classList.add('selected');
  } else {
    cardCom.classList.remove('selected');
    cardNon.classList.add('selected');
  }
  updateUI();
}

/* ============================================================
   협업 작가 캐러셀 (페이지당 4명, 체크 선택 시 신청서와 연동)
   ============================================================ */

const collabArtists = [
  { name:'Eryn 작가님', desc:'일러 5만원 + 리깅 5만원 할인', href:'https://artmug.kr/index.php?channel=view&uid=51881' },
  { name:'욤 작가님', desc:'일러 3만원 할인+리깅 5만원 할인/볼빵빵 무료', href:'https://artmug.kr/index.php?channel=view&uid=56616' },
  { name:'네코노바 작가님', desc:'일러 5만원 + 리깅 10만원 할인 + 표정 3종 리깅 무료', href:'https://artmug.kr/index.php?channel=view&uid=51824' },
  { name:'다중 작가님', desc:'일러 5만원 + 리깅 5만원 할인', href:'https://artmug.kr/index.php?channel=view&uid=42826' },
  { name:'ROPON 작가님', desc:'리깅 5만원 할인', href:'https://artmug.kr/index.php?channel=view&uid=26980' },
  { name:'마가린 작가님', desc:'일러 3만원 + 리깅 3만원 할인', href:'https://artmug.kr/index.php?channel=view&uid=42853' },
  { name:'하예나 작가님', desc:'리깅 10만원 할인', href:'https://artmug.kr/index.php?channel=view&uid=26603' },
  { name:'세르팡 작가님', desc:'', href:'https://artmug.kr/index.php?channel=view&uid=25829' },
  { name:'꽃무 작가님', desc:'', href:'https://artmug.kr/index.php?channel=view&uid=31127' }
];

/* ✅ 감자야 작가 삭제됨 */
const COLLAB_PAGE_SIZE = 4;
let collabPage = 0;
let selectedCollabArtist = null;

function collabTotalPages(){
  return Math.ceil(collabArtists.length / COLLAB_PAGE_SIZE);
}

function renderCollabPage(direction){
  const grid = document.getElementById('collabGrid');
  if(!grid) return;

  const totalPages = collabTotalPages();
  const start = collabPage * COLLAB_PAGE_SIZE;
  const pageItems = collabArtists.slice(start, start + COLLAB_PAGE_SIZE);

  grid.innerHTML = pageItems.map(artist => {
    const isSelected = selectedCollabArtist === artist.name;
    const descHtml = artist.desc ? `<a class="collab-desc" href="${artist.href}" target="_blank" rel="noopener noreferrer">${escapeHtml(artist.desc)}</a>` : '';
    return `
      <div class="collab-card${isSelected ? ' selected' : ''}">
        <div class="collab-text-group">
          <a class="collab-name" href="${artist.href}" target="_blank" rel="noopener noreferrer">${escapeHtml(artist.name)}</a>
          ${descHtml}
          <a class="collab-arrow" href="${artist.href}" target="_blank" rel="noopener noreferrer">클릭하여 페이지 이동 ↗</a>
        </div>
        <button type="button" class="collab-check-btn" aria-label="${escapeHtml(artist.name)} 선택" onclick="toggleCollabArtist('${escapeHtml(artist.name)}')">
          <span class="collab-check-icon">✓</span>
        </button>
      </div>
    `;
  }).join('');

  grid.classList.remove('collab-slide-left', 'collab-slide-right');
  if(direction === 'next' || direction === 'prev'){
    void grid.offsetWidth;
    grid.classList.add(direction === 'next' ? 'collab-slide-right' : 'collab-slide-left');
  }

  const dotsEl = document.getElementById('collabDots');
  if(dotsEl){
    dotsEl.textContent = Array.from({ length: totalPages }, (_, i) => i === collabPage ? '●' : '○').join(' ');
  }
}

function prevCollabPage(){
  const totalPages = collabTotalPages();
  collabPage = (collabPage - 1 + totalPages) % totalPages;
  renderCollabPage('prev');
}

function nextCollabPage(){
  const totalPages = collabTotalPages();
  collabPage = (collabPage + 1) % totalPages;
  renderCollabPage('next');
}

function toggleCollabArtist(name){
  const artist = collabArtists.find(a => a.name === name);
  if(!artist) return;

  selectedCollabArtist = (selectedCollabArtist === name) ? null : name;

  syncCollabToForm(artist);
  renderCollabPage();
  updateFormQuadrant();
}

function syncCollabToForm(artist){
  const textarea = document.getElementById('inputText');
  if(!textarea) return;

  const lines = textarea.value.split('\n');
  const newLine = selectedCollabArtist
    ? `6. 협업 리깅 작가 : ${artist.name}${artist.desc ? ` (${artist.desc})` : ''}`
    : '6. 협업 리깅 작가 : (선택사항입니다! 다른 리깅작가가 있다면 작가명을 기재해 주세요.)';

  replaceLineByPrefix(lines, '6. 협업 리깅 작가', newLine);
  textarea.value = lines.join('\n');
  autoResizeTextarea();
}

function getBaseOptionItems(){
  return Array.from(document.querySelectorAll('.base-option-item'));
}

function findAddonElement(name){
  return Array.from(document.querySelectorAll('.addon-item')).find(el => el.dataset.addonName === name) || null;
}

function setQtyValue(name, qty){
  const el = Array.from(document.querySelectorAll('[data-qty-for]')).find(el => el.dataset.qtyFor === name);
  if(el){
    el.textContent = String(qty);
    el.classList.remove('qty-bump');
    void el.offsetWidth;
    el.classList.add('qty-bump');
  }
}

function hasFoldedArmSelected(){
  return selectedAddonOptions.some(o => o.name === '추가 팔 파츠');
}

function requiresFoldedArm(name){
  return name === '끌어안는 인형' || name === '마이크' || name === '게임기';
}

function enforceAddonRules(){
  if(hasFoldedArmSelected()) return false;

  const blocked = ['끌어안는 인형', '마이크', '게임기'];
  let changed = false;

  blocked.forEach(name => {
    const idx = selectedAddonOptions.findIndex(o => o.name === name);
    if(idx > -1){
      selectedAddonOptions.splice(idx, 1);
      const el = findAddonElement(name);
      if(el) el.classList.remove('active');
      changed = true;
    }
  });

  return changed;
}

function updateSelectionSummary(){
  const list = document.getElementById('selectionSummaryList');
  const basePriceEl = document.getElementById('summaryBasePrice');
  const addonPriceEl = document.getElementById('summaryAddonPrice');
  const totalPriceEl = document.getElementById('summaryTotalPrice');

  list.innerHTML = '';

  const baseTotal = selectedBaseOption ? selectedBaseOption.price : 0;
  let addonTotal = 0;

  if(selectedBaseOption){
    const item = document.createElement('div');
    item.className = 'selection-summary-item';
    item.innerHTML = `
      <div class="left">
        <div class="name">패키지</div>
        <div class="sub">${selectedBaseOption.name}</div>
      </div>
      <div class="right">
        <strong>${formatPrice(selectedBaseOption.price)}원</strong>
      </div>
    `;
    list.appendChild(item);
    basePriceEl.textContent = `${formatPrice(selectedBaseOption.price)}원`;
  }else{
    basePriceEl.textContent = '미선택';
  }

  selectedAddonOptions.forEach(option => {
    const subtotal = option.price * option.qty;
    addonTotal += subtotal;

    const isInquiry = option.price === 0;
    const item = document.createElement('div');
    item.className = 'selection-summary-item';
    item.innerHTML = `
      <div class="left">
        <div class="name">${isInquiry ? option.name.replace(' 별도문의','') : option.name}</div>
        <div class="sub">${isInquiry ? '별도 문의' : `${option.qty}개 (+${formatPrice(option.price)}원)`}</div>
      </div>
      <div class="right">
        <strong>${isInquiry ? '문의' : formatPrice(subtotal)+'원'}</strong>
      </div>
    `;
    list.appendChild(item);
  });

  if(isCommercialUsage){
    const commercialPrice = 300000;
    addonTotal += commercialPrice;
    const item = document.createElement('div');
    item.className = 'selection-summary-item';
    item.innerHTML = `
      <div class="left">
        <div class="name">저작이용권 구매</div>
        <div class="sub">상업용 이용권</div>
      </div>
      <div class="right">
        <strong>${formatPrice(commercialPrice)}원</strong>
      </div>
    `;
    list.appendChild(item);
  }

  if(!list.children.length){
    const empty = document.createElement('div');
    empty.className = 'selection-empty';
    empty.textContent = '선택된 항목이 없습니다.';
    list.appendChild(empty);
  }

  addonPriceEl.textContent = `${formatPrice(addonTotal)}원`;
  totalPriceEl.textContent = `${formatPrice(baseTotal + addonTotal)}원`;
}

function autoResizeTextarea(){
  const textarea = document.getElementById('inputText');
  if(!textarea) return;
  const maxHeight = window.matchMedia('(max-width: 640px)').matches ? 380 : 500;
  textarea.style.height = 'auto';
  const newHeight = Math.min(textarea.scrollHeight, maxHeight);
  textarea.style.height = newHeight + 'px';
  textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
}

function updateFormText(){
  const textarea = document.getElementById('inputText');
  const lines = textarea.value.split('\n');

  const baseText = selectedBaseOption
    ? `7. 버츄얼 패키지 : ${selectedBaseOption.name} (+${formatPrice(selectedBaseOption.price)}원)`
    : '7. 버츄얼 패키지 : ';

  const addonParts = selectedAddonOptions.map(o =>
    o.price === 0
      ? `${o.name.replace(' 별도문의', '')} (별도 문의)`
      : `${o.name} x${o.qty} (+${formatPrice(o.price * o.qty)}원)`
  );
  if(isCommercialUsage) addonParts.push('저작이용권 구매 (+300,000원)');

  const addonText = addonParts.length
    ? `8. 추가 옵션 : ${addonParts.join(', ')}`
    : '8. 추가 옵션 : ';

  const usageText = `9. 사용 범위 : ${isCommercialUsage ? '상업용' : '비상업용'}`;

  const basePriceText = document.getElementById('summaryBasePrice').textContent;
  const addonPriceText = document.getElementById('summaryAddonPrice').textContent;
  const totalPriceText = document.getElementById('summaryTotalPrice').textContent;
  const totalText = `10. 예상 합계 : 기본 패키지 ${basePriceText} + 추가옵션 ${addonPriceText} / 예상 합계 ${totalPriceText}`;

  replaceLineByPrefix(lines, '7. 버츄얼 패키지', baseText);
  replaceLineByPrefix(lines, '8. 추가 옵션', addonText);
  replaceLineByPrefix(lines, '9. 사용 범위', usageText);
  replaceLineByPrefix(lines, '10. 예상 합계', totalText);
  textarea.value = lines.join('\n');
  autoResizeTextarea();
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, ch => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[ch]));
}

/* ============================================================
   신청서 하단 3분할 블록(1.버츄얼 패키지 / 2.추가 옵션 / 3.협업 리깅 작가)
   ============================================================ */

const MINI_BASE_OPTIONS = [
  { name:'전신 패키지', price:800000 },
  { name:'반신 패키지', price:500000 }
];

function initMiniPackage(){
  const el = document.getElementById('miniPackageBody');
  if(!el) return;

  el.innerHTML = MINI_BASE_OPTIONS.map(opt => `
      <div class="mini-chip selectable" data-package-name="${escapeHtml(opt.name)}" data-package-price="${opt.price}" onclick="miniSelectPackage('${escapeHtml(opt.name)}', ${opt.price})">
        <div class="mini-chip-name">${escapeHtml(opt.name)}</div>
        <div class="mini-chip-meta"><strong>+${formatPrice(opt.price)}원</strong></div>
      </div>
    `).join('');
}

function renderMiniPackage(){
  const el = document.getElementById('miniPackageBody');
  if(!el) return;

  if(!el.querySelector('.mini-chip')){
    initMiniPackage();
  }

  el.querySelectorAll('.mini-chip').forEach(chip => {
    const isActive = !!(selectedBaseOption && selectedBaseOption.name === chip.dataset.packageName);
    chip.classList.toggle('active', isActive);
  });
}

function miniSelectPackage(name, price){
  const isSame = selectedBaseOption && selectedBaseOption.name === name;

  document.querySelectorAll('.base-option-item').forEach(el => {
    el.classList.remove('active');
  });

  if(isSame){
    selectedBaseOption = null;
  } else {
    selectedBaseOption = { name, price };
    document.querySelectorAll('.base-option-item').forEach(el => {
      if(el.textContent.includes(name)){
        el.classList.add('active');
      }
    });
  }

  updateUI();
}

function renderMiniAddon(){
  const el = document.getElementById('miniAddonBody');
  if(!el) return;

  if(!selectedAddonOptions.length){
    el.innerHTML = '<div class="form-mini-empty">선택된 옵션이 없습니다.</div>';
    return;
  }

  el.innerHTML = selectedAddonOptions.map(option => {
    const isInquiry = option.price === 0;
    const label = isInquiry ? option.name.replace(' 별도문의', '') : option.name;

    if(isInquiry){
      return `
        <div class="mini-chip active">
          <div class="mini-chip-name">${escapeHtml(label)}</div>
          <div class="mini-chip-meta"><strong>별도문의</strong></div>
        </div>
      `;
    }

    return `
      <div class="mini-chip active">
        <div class="mini-chip-name">${escapeHtml(label)}</div>
        <div class="mini-chip-meta">
          <span class="qty-controls" onclick="event.stopPropagation()">
            <button type="button" onclick="changeAddonQty('${escapeHtml(option.name)}', -1)">−</button>
            <span class="qty-value">${option.qty}</span>
            <button type="button" onclick="changeAddonQty('${escapeHtml(option.name)}', 1)">+</button>
          </span>
          <strong>+${formatPrice(option.price * option.qty)}원</strong>
        </div>
      </div>
    `;
  }).join('');
}

function renderMiniCollab(){
  const el = document.getElementById('miniCollabBody');
  if(!el) return;

  if(!selectedCollabArtist){
    el.innerHTML = '<div class="form-mini-empty">선택한 협업 작가가 없습니다.</div>';
    return;
  }

  const artist = collabArtists.find(a => a.name === selectedCollabArtist);
  const desc = artist && artist.desc ? ` (${artist.desc})` : '';
  el.innerHTML = `<div class="mini-chip active selectable" onclick="miniDeselectCollab()" title="눌러서 선택 취소"><div class="mini-chip-name">${escapeHtml(selectedCollabArtist)}${escapeHtml(desc)}</div></div>`;
}

function miniDeselectCollab(){
  if(selectedCollabArtist){
    toggleCollabArtist(selectedCollabArtist);
  }
}

const MINI_USAGE_OPTIONS = [
  { key:'non', label:'비상업용' },
  { key:'com', label:'상업용' }
];

function initMiniUsage(){
  const el = document.getElementById('miniUsageBody');
  if(!el) return;

  el.innerHTML = MINI_USAGE_OPTIONS.map(opt => `
      <div class="mini-chip selectable" data-usage-key="${opt.key}" onclick="miniSelectUsage('${opt.key}')">
        <div class="mini-chip-name">${opt.label}</div>
      </div>
    `).join('');
}

function renderMiniUsage(){
  const el = document.getElementById('miniUsageBody');
  if(!el) return;

  if(!el.querySelector('.mini-chip')){
    initMiniUsage();
  }

  el.querySelectorAll('.mini-chip').forEach(chip => {
    const isActive = (chip.dataset.usageKey === 'com') === isCommercialUsage;
    chip.classList.toggle('active', isActive);
  });
}

function miniSelectUsage(type){
  selectUsage(type);
}

function updateFormQuadrant(){
  renderMiniPackage();
  renderMiniAddon();
  renderMiniCollab();
  renderMiniUsage();
}

/* ============================================================
   스크롤 진입 시 카드가 살짝 올라오며 나타나는 효과
   ============================================================ */

function initScrollReveal(){
  const revealEls = document.querySelectorAll('.reveal');
  if(!revealEls.length) return;

  if(!('IntersectionObserver' in window)){
    revealEls.forEach(el => el.classList.add('in-view'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold:0.12, rootMargin:'0px 0px -60px 0px' });

  revealEls.forEach(el => io.observe(el));

  setTimeout(() => {
    revealEls.forEach(el => el.classList.add('in-view'));
  }, 2500);
}

/* ============================================================
   추가옵션 하위 카테고리 아코디언 애니메이션
   ============================================================ */

function setupAccordionAnimation(){
  const detailsList = document.querySelectorAll('details.price-box');
  if(!detailsList.length) return;

  detailsList.forEach(details => {
    const summary = details.querySelector('summary');
    const content = details.querySelector('.price-box-content');
    if(!summary || !content) return;

    const state = {
      endListener: null,
      timeoutId: null
    };

const clearPending = () => {
  if(state.endListener){
    content.removeEventListener('transitionend', state.endListener);
    state.endListener = null;
  }
  // ⛔ 타이머는 지우지 않음 (아래 타이머가 확실히 실행되도록)
  // if(state.timeoutId) { clearTimeout(state.timeoutId); state.timeoutId = null; }
};

    summary.addEventListener('click', (event) => {
      if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      event.preventDefault();

      clearPending();

      content.style.transition = 'none';
      void content.offsetHeight;
      content.style.transition = '';

      if(details.open){
        const startHeight = content.scrollHeight;
        content.style.maxHeight = startHeight + 'px';
        void content.offsetHeight;
        content.style.maxHeight = '0px';

        state.endListener = (e) => {
          if(e.propertyName !== 'max-height') return;
          clearPending();
          details.open = false;
          content.style.maxHeight = '';
        };
        content.addEventListener('transitionend', state.endListener);

state.timeoutId = setTimeout(() => {
  // clearPending() 제거
  details.open = false;
  content.style.maxHeight = '';
  state.timeoutId = null;
}, 400);
      } else {
        details.open = true;
        content.style.maxHeight = '0px';
        void content.offsetHeight;
        const targetHeight = content.scrollHeight;
        content.style.maxHeight = targetHeight + 'px';

state.timeoutId = setTimeout(() => {
  // clearPending() 제거
  content.style.maxHeight = 'none';
  state.timeoutId = null;
}, 400);
        content.addEventListener('transitionend', state.endListener);

        state.timeoutId = setTimeout(() => {
          clearPending();
          content.style.maxHeight = 'none';
        }, 400);
      }
    });
  });
}

/* ============================================================
   팔/포즈 리플 효과 (지속 파동)
   ============================================================ */

let armPoseRippleActive = false;

function activateArmPoseRipple(){
  if(armPoseRippleActive) return;
  armPoseRippleActive = true;
  
  const detailsList = document.querySelectorAll('details.price-box');
  detailsList.forEach(details => {
    const summary = details.querySelector('summary');
    if(summary && summary.textContent.includes('팔 / 포즈')){
      details.classList.add('details-arm-pose');
      // 클릭 시 비활성화
      summary.addEventListener('click', () => {
        armPoseRippleActive = false;
        details.classList.remove('details-arm-pose');
      }, { once:true });
    }
  });
}
}

/* ============================================================
   이미지 로더 타이밍 개선
   ============================================================ */

const galleryLoadTokens = new WeakMap();

function showLoader(container){
  const loader = container?.querySelector('.heart-loader');
  loader?.classList.add('active');
}

function hideLoader(container){
  const loader = container?.querySelector('.heart-loader');
  loader?.classList.remove('active');
}

function changeGalleryImage(imgEl, newSrc, callback){
  const container = imgEl.parentElement;

  const token = Symbol('galleryLoad');
  galleryLoadTokens.set(imgEl, token);
  const isStale = () => galleryLoadTokens.get(imgEl) !== token;

  imgEl.style.visibility = 'hidden';
  imgEl.classList.remove('crossfade-visible');
  showLoader(container);

  const tempImg = new Image();
  tempImg.src = newSrc;

  const reveal = () => {
    if(isStale()) return;
    imgEl.src = newSrc;

    const onCrossfadeEnd = () => {
      if(isStale()) return;
      hideLoader(container);
      imgEl.style.visibility = 'visible';
    };

    imgEl.classList.add('crossfade-visible');

    if(imgEl.decode){
      imgEl.decode().then(() => {
        let crossfadeEndCalled = false;
        const crossfadeEndHandler = (e) => {
          if(e.propertyName !== 'opacity') return;
          if(crossfadeEndCalled) return;
          crossfadeEndCalled = true;
          imgEl.removeEventListener('transitionend', crossfadeEndHandler);
          onCrossfadeEnd();
        };
        imgEl.addEventListener('transitionend', crossfadeEndHandler);
        setTimeout(() => {
          if(!crossfadeEndCalled){
            crossfadeEndCalled = true;
            imgEl.removeEventListener('transitionend', crossfadeEndHandler);
            onCrossfadeEnd();
          }
        }, 550);
      }).catch(() => {
        hideLoader(container);
        imgEl.style.visibility = 'visible';
        imgEl.classList.add('crossfade-visible');
      });
    } else {
      tempImg.onload = () => {
        if(isStale()) return;
        imgEl.classList.add('crossfade-visible');
        setTimeout(() => {
          if(isStale()) return;
          hideLoader(container);
          imgEl.style.visibility = 'visible';
        }, 550);
      };
      tempImg.onerror = () => {
        hideLoader(container);
        imgEl.style.visibility = 'visible';
        imgEl.classList.add('crossfade-visible');
      };
      tempImg.src = newSrc;
    }
  };

  if(tempImg.decode){
    tempImg.decode().then(reveal).catch(reveal);
  } else {
    tempImg.onload = reveal;
    tempImg.onerror = reveal;
  }
}

function fadeSwap(imgEl, newSrc, callback){
  changeGalleryImage(imgEl, newSrc, callback);
}

/* ============================================================
   갤러리 네비게이션 (기존 함수 유지)
   ============================================================ */

let current = 0;
const images = [
  'Cheriko_sample_collage.png',
  '93_sample_collage.png',
  'sina_sample_collage.png',
  'rararu_sample_collage.png',
  'koya_sample_collage.png',
  'raruka_sample_collage.png',
  'B_sample_collage.png'
];

function showGallery(index){
  current = index;
  const img = document.getElementById('galleryImg');
  fadeSwap(img, images[current], updateSampleThumbBorder);
  updateSampleThumbBorder();
}

function selectSample(index){
  showGallery(index);
}

function updateSampleThumbBorder(){
  const thumbs = document.querySelectorAll('#sampleThumbGrid img');
  thumbs.forEach((thumb, index) => {
    thumb.style.border = index === current ? '2px solid var(--pink-deep)' : '2px solid transparent';
  });
}

let faceCurrent = 0;
const faceImages = [
  'Cheriko_expressions.png',
  'raruka_face_types.png',
  'koya_face_9types.png',
  'sia_face_types.png'
];
const faceDescriptions = [
  '체리코님 표정 샘플',
  '라루카님 표정 샘플',
  '네무키 코야님 표정 샘플',
  '시로유키 시아님 1.0 표정 샘플'
];

function showFace(index){
  faceCurrent = index;
  const img = document.getElementById('faceGallery');
  const desc = document.getElementById('faceDesc');
  const descText = faceDescriptions[index]; // 인덱스 직접 참조
  fadeSwap(img, faceImages[faceCurrent], () => {
    desc.innerHTML = descText;
    updateFaceDots();
  });
  updateFaceDots();
}

function nextFace(){
  showFace((faceCurrent + 1) % faceImages.length);
}

function prevFace(){
  showFace((faceCurrent - 1 + faceImages.length) % faceImages.length);
}

function updateFaceDots(){
  const dotsEl = document.getElementById('faceDots');
  if(dotsEl) {
    dotsEl.innerText = faceImages.map((_, i) => i === faceCurrent ? '●' : '○').join(' ');
  }
}

let styleCurrent = 0;
const styleImages = [
  'style_01.png',
  'style_02.png',
  'style_03.png',
  'style_04.png'
];

function showStyle(index){
  styleCurrent = index;
  const img = document.getElementById('styleGallery');
  fadeSwap(img, styleImages[styleCurrent], updateStyleDots);
  updateStyleDots();
}

function nextStyle(){
  showStyle((styleCurrent + 1) % styleImages.length);
}

function prevStyle(){
  showStyle((styleCurrent - 1 + styleImages.length) % styleImages.length);
}

function updateStyleDots(){
  const dotsEl = document.getElementById('styleDots');
  if(dotsEl) {
    dotsEl.innerText = styleImages.map((_, i) => i === styleCurrent ? '●' : '○').join(' ');
  }
}

/* ============================================================
   옵션 토글 함수 (추가 옵션 / 기본 패키지)
   ============================================================ */

function updateUI(){
  if(enforceAddonRules()){
    // dependent add-ons removed; proceed with refreshed state
  }
  updateSelectionSummary();
  updateFormQuadrant();
  updateFormText();
  updateCopyButtonHint();
}

function updateCopyButtonHint(){
  const btn = document.querySelector('.copy-btn-large');
  if(!btn) return;
  btn.classList.toggle('breathe', !!selectedBaseOption);
}

function toggleBaseOption(el, name, price){
  const isSame = selectedBaseOption && selectedBaseOption.name === name;

  getBaseOptionItems().forEach(item => item.classList.remove('active'));

  if(isSame){
    selectedBaseOption = null;
    el.classList.remove('active');
  }else{
    selectedBaseOption = { name, price };
    el.classList.add('active');
  }

  updateUI();
}

function toggleAddonOption(el, name, price){
  const idx = selectedAddonOptions.findIndex(o => o.name === name);
  
  if(idx > -1){
    selectedAddonOptions.splice(idx, 1);
    el.classList.remove('active');
    updateUI();
    return;
  }
  
  if(requiresFoldedArm(name) && !hasFoldedArmSelected()){
    alert("팔 / 포즈 옵션을 먼저 선택해 주세요!");
    activateArmPoseRipple(); // 리플 활성화
    return;
  }
  
  selectedAddonOptions.push({ name, price, qty: 1 });
  el.classList.add('active');
  setQtyValue(name, 1);
  updateUI();
}

function changeAddonQty(name, delta){
  const option = selectedAddonOptions.find(o => o.name === name);
  if(!option) return;

  option.qty += delta;

  if(option.qty <= 0){
    selectedAddonOptions = selectedAddonOptions.filter(o => o.name !== name);
    const item = findAddonElement(name);
    if(item) item.classList.remove('active');
  }else{
    option.qty = Math.max(1, option.qty);
    setQtyValue(name, option.qty);
    const item = findAddonElement(name);
    if(item) item.classList.add('active');
  }

  updateUI();
}

function removeInquiryOption(name){
  const idx = selectedAddonOptions.findIndex(o => o.name === name);
  if(idx > -1){
    selectedAddonOptions.splice(idx, 1);
    const item = findAddonElement(name);
    if(item) item.classList.remove('active');
    updateUI();
  }
}

function copyText() {
  const textarea = document.getElementById('inputText');
  const text = textarea.value;

  function finishCopy(){
    const btn = document.querySelector('.copy-btn-large');
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if(btn){
      btn.classList.add('copy-success');
    }

    setTimeout(() => {
      alert('복사 완료! 문의란에 붙여넣어 주세요 ( ◜ᴗ◝ )♡');
      if(btn) btn.classList.remove('copy-success');
    }, prefersReduced ? 0 : 60);
  }

  if(navigator.clipboard && window.isSecureContext){
    navigator.clipboard.writeText(text).then(finishCopy).catch(() => fallbackCopy(text));
  }else{
    fallbackCopy(text);
  }

  function fallbackCopy(value){
    const temp = document.createElement('textarea');
    temp.value = value;
    temp.setAttribute('readonly', '');
    temp.style.position = 'fixed';
    temp.style.left = '-9999px';
    temp.style.top = '0';
    document.body.appendChild(temp);
    temp.focus();
    temp.select();
    temp.setSelectionRange(0, temp.value.length);

    try{
      document.execCommand('copy');
      finishCopy();
    }catch(err){
      alert('복사가 안 될 경우, 텍스트를 꾹 눌러 복사해 주세요 💗');
    }finally{
      temp.remove();
    }
  }
}

/* ============================================================
   초기화 실행 (DOMContentLoaded)
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();

  try{
    if(document.getElementById('galleryImg')) showGallery(0);
    if(document.getElementById('faceGallery')) showFace(0);
    if(document.getElementById('styleGallery')) showStyle(0);
    if(document.getElementById('collabGrid')) renderCollabPage();
  }catch(e){ console.error(e); }

  try{
    setupAccordionAnimation();
  }catch(e){ console.error(e); }

  try{
    setupArmPoseRipple();
  }catch(e){ console.error(e); }

  try{
    if(typeof updateUI === 'function'){
      updateUI();
    }
  }catch(e){ console.error(e); }

  try{
    const textarea = document.getElementById('inputText');
    if(textarea && typeof autoResizeTextarea === 'function'){
      autoResizeTextarea();
      textarea.addEventListener('input', autoResizeTextarea);
      textarea.addEventListener('input', updateFormQuadrant);

      let resizeTimer = null;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(autoResizeTextarea, 150);
      });
    }
  }catch(e){ console.error(e); }
});

if(typeof preloadImages === 'function'){
  preloadImages(images);
  preloadImages(faceImages);
  preloadImages(styleImages);
}
 
