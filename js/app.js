// Interactive Bible Map — Main Application

(function () {
  'use strict';

  // ===== STATE =====
  const state = {
    currentSection: 'acts',
    currentIndex: 0,          // index within filtered locations array
    activeMarkers: [],        // { marker, location, element } objects
    locationDots: [],         // small location dots on map
    visitedIds: new Set(),
    isAncientLayer: true,
    map: null,
    modernTiles: null,
    ancientTiles: null,
    ancientLabels: null,
    popupOpen: false,
    rightPanelOpen: false,
    activeChapter: 0,         // current chapter tab index (multi-chapter locations)
    textSize: 'standard',
    language: 'en',           // 'en' | 'ko'
    defaultMode: 'summary',   // 'summary' | 'bible' | 'both'
    opacityMode: 'semi',      // 'semi' | 'opaque'
    musicState: 'silent',     // 'silent' | 'ambient' | 'hymn'
    musicAudio: null
  };

  // ===== MAP INIT =====
  function initMap() {
    state.map = L.map('map', {
      center: [32.0, 35.5],
      zoom: 6,
      zoomControl: true,
      attributionControl: true
    });

    // Custom pane for ancient labels — sits below location markers (markerPane z:600)
    state.map.createPane('ancientLabelPane');
    state.map.getPane('ancientLabelPane').style.zIndex = 350;
    state.map.getPane('ancientLabelPane').style.pointerEvents = 'none';

    // Modern tile layer (CartoDB Voyager — clean, English labels, free)
    state.modernTiles = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
      }
    );

    // Ancient terrain tile layer — ESRI World Shaded Relief
    // Pure elevation shading, zero political borders, zero modern labels.
    // CSS sepia filter (ancient-mode class) turns grayscale relief into parchment.
    state.ancientTiles = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; <a href="https://www.esri.com">Esri</a> &mdash; Esri, USGS, NOAA',
        maxZoom: 13
      }
    );

    // Ancient place-name label overlay
    state.ancientLabels = buildAncientLabels();

    // Zoom control position
    state.map.zoomControl.setPosition('bottomright');

    // Add Home button (custom control)
    const HomeControl = L.Control.extend({
      options: { position: 'bottomright' },
      onAdd: function(map) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const button = L.DomUtil.create('a', 'leaflet-control-zoom-home', container);
        button.href = '#';
        button.title = 'Go to overview (all locations)';
        button.textContent = '⊙';
        button.style.fontSize = '18px';
        button.style.width = '36px';
        button.style.height = '36px';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.borderRadius = '4px';

        L.DomEvent.on(button, 'click', L.DomEvent.preventDefault);
        L.DomEvent.on(button, 'click', function() {
          resetMapToOverview();
        });

        return container;
      }
    });

    state.map.addControl(new HomeControl());

    // Default: ancient mode
    state.ancientTiles.addTo(state.map);
    state.ancientLabels.addTo(state.map);
    document.getElementById('map').classList.add('ancient-mode');
  }

  // ===== LAYER TOGGLE =====
  function setLayer(ancient) {
    state.isAncientLayer = ancient;
    if (ancient) {
      if (!state.map.hasLayer(state.ancientTiles))  state.ancientTiles.addTo(state.map);
      if (!state.map.hasLayer(state.ancientLabels)) state.ancientLabels.addTo(state.map);
      if (state.map.hasLayer(state.modernTiles))    state.map.removeLayer(state.modernTiles);
      document.getElementById('map').classList.add('ancient-mode');
    } else {
      if (!state.map.hasLayer(state.modernTiles))   state.modernTiles.addTo(state.map);
      if (state.map.hasLayer(state.ancientTiles))   state.map.removeLayer(state.ancientTiles);
      if (state.map.hasLayer(state.ancientLabels))  state.map.removeLayer(state.ancientLabels);
      document.getElementById('map').classList.remove('ancient-mode');
    }

    document.getElementById('btn-ancient').classList.toggle('active', ancient);
    document.getElementById('btn-modern').classList.toggle('active', !ancient);
    document.getElementById('btn-ancient').setAttribute('aria-pressed', ancient);
    document.getElementById('btn-modern').setAttribute('aria-pressed', !ancient);

    // Sync mobile drawer
    document.querySelectorAll('.drawer-layer').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.layer === (ancient ? 'ancient' : 'modern'));
    });
  }

  // ===== ANCIENT MAP LABELS =====
  function buildAncientLabels() {
    const group = L.layerGroup();
    const isKo = state.language === 'ko';

    function addLabel(lat, lng, text, cls) {
      L.marker([lat, lng], {
        icon: L.divIcon({
          html: `<span class="ancient-label ${cls}">${text}</span>`,
          className: 'ancient-label-icon',
          iconSize: [1, 1],
          iconAnchor: [0, 0]
        }),
        interactive: false,
        keyboard: false,
        pane: 'ancientLabelPane'
      }).addTo(group);
    }

    if (isKo) {
      // ── Korean labels from i18n-ko.js ─────────────────────────────────────────
      I18N_KO_LABELS.regions.forEach(([name, lat, lng]) => addLabel(lat, lng, name, 'region'));
      I18N_KO_LABELS.seas.forEach(([name, lat, lng])    => addLabel(lat, lng, name, 'sea'));
      I18N_KO_LABELS.rivers.forEach(([name, lat, lng])  => addLabel(lat, lng, name, 'river'));
      I18N_KO_LABELS.cities.forEach(([name, lat, lng])  => addLabel(lat, lng, name, 'city'));
    } else {
      // ── English labels ───────────────────────────────────────────────────────

      // ── Regions ───────────────────────────────────────────────────────────────
      [
        ['ITALY',              43.5,  13.0],
        ['SICILY',             37.6,  14.2],
        ['DALMATIA',           43.0,  17.5],
        ['MOESIA',             43.5,  24.5],
        ['THRACE',             41.7,  26.5],
        ['MACEDONIA',          41.2,  22.3],
        ['ACHAIA',             38.5,  22.2],
        ['EPIRUS',             39.5,  20.5],
        ['BITHYNIA & PONTUS',  41.3,  32.0],
        ['GALATIA',            39.5,  33.5],
        ['CAPPADOCIA',         38.5,  37.0],
        ['CILICIA',            36.7,  35.5],
        ['SYRIA',              34.8,  38.5],
        ['GALILEE',            32.8,  35.4],
        ['SAMARIA',            32.2,  35.3],
        ['JUDAEA',             31.3,  35.7],
        ['IDUMAEA',            30.8,  34.9],
        ['ARABIA',             28.5,  38.5],
        ['EGYPT',              27.5,  30.5],
        ['CYRENAICA',          32.0,  21.5],
        ['LIBYA',              28.0,  16.5],
        ['MESOPOTAMIA',        33.5,  43.0],
        ['ASSYRIA',            36.0,  43.5],
        ['ASIA',               38.8,  28.8],
        ['MYSIA',              39.8,  27.5],
        ['LYDIA',              38.5,  27.8],
        ['PHRYGIA',            38.8,  30.0],
        ['LYCAONIA',           37.7,  33.2],
        ['PAMPHYLIA',          37.0,  31.2],
        ['LYCIA',              36.5,  29.5],
        ['PISIDIA',            37.8,  31.3],
      ].forEach(([name, lat, lng]) => addLabel(lat, lng, name, 'region'));

      // ── Seas & bodies of water ─────────────────────────────────────────────────
      [
        ['MEDITERRANEAN SEA',  35.2,  14.0],
        ['BLACK SEA',          43.0,  33.5],
        ['AEGEAN SEA',         39.2,  25.2],
        ['ADRIATIC SEA',       43.0,  15.5],
        ['RED SEA',            22.0,  38.0],
        ['CASPIAN SEA',        41.5,  50.5],
        ['DEAD SEA',           31.5,  35.5],
        ['SEA OF GALILEE',     32.8,  35.6],
      ].forEach(([name, lat, lng]) => addLabel(lat, lng, name, 'sea'));

      // ── Rivers ────────────────────────────────────────────────────────────────
      [
        ['Nile',       28.0, 31.2],
        ['Euphrates',  34.5, 40.0],
        ['Tigris',     35.5, 43.5],
        ['Jordan',     32.0, 35.5],
      ].forEach(([name, lat, lng]) => addLabel(lat, lng, name, 'river'));

      // ── City labels ───────────────────────────────────────────────────────────
      [
        // Italy & western Med
        ['Rome',               41.90, 12.50],
        ['Puteoli',            40.83, 14.12],
        ['Syracuse',           37.07, 15.29],
        ['Rhegium',            38.11, 15.65],
        ['Nicopolis',          39.01, 20.72],
        // Greece
        ['Corinth',            37.94, 22.93],
        ['Cenchreae',          37.89, 23.00],
        ['Athens',             37.98, 23.73],
        ['Thessalonica',       40.64, 22.94],
        ['Philippi',           41.01, 24.29],
        ['Neapolis',           40.93, 24.42],
        ['Amphipolis',         40.83, 23.85],
        ['Apollonia',          40.93, 22.50],
        ['Berea',              40.52, 22.21],
        // Asia Minor (western)
        ['Byzantium',          41.01, 28.98],
        ['Nicomedia',          40.77, 29.92],
        ['Troas',              39.75, 26.17],
        ['Assos',              39.49, 26.34],
        ['Mytilene',           39.11, 26.55],
        ['Chios',              38.37, 26.14],
        ['Samos',              37.75, 26.97],
        ['Ephesus',            37.94, 27.34],
        ['Miletus',            37.53, 27.28],
        ['Smyrna',             38.42, 27.14],
        ['Pergamum',           39.13, 27.18],
        ['Thyatira',           38.92, 27.84],
        ['Sardis',             38.49, 28.05],
        ['Philadelphia',       38.35, 28.52],
        ['Laodicea',           37.84, 29.12],
        ['Colossae',           37.78, 29.22],
        ['Cnidus',             36.69, 27.38],
        ['Rhodes',             36.43, 28.22],
        ['Patara',             36.27, 29.32],
        ['Myra',               36.27, 29.98],
        // Asia Minor (interior & south)
        ['Perga',              36.97, 30.85],
        ['Attalia',            36.88, 30.70],
        ['Pisidian Antioch',   38.30, 31.20],
        ['Iconium',            37.87, 32.49],
        ['Lystra',             37.59, 32.41],
        ['Derbe',              37.41, 33.40],
        ['Tarsus',             36.92, 34.89],
        // Cyprus
        ['Salamis',            35.19, 33.90],
        ['Paphos',             34.76, 32.42],
        // Syria & Levant
        ['Antioch',            36.20, 36.16],
        ['Seleucia',           36.08, 35.93],
        ['Damascus',           33.51, 36.29],
        ['Sidon',              33.56, 35.37],
        ['Tyre',               33.27, 35.20],
        ['Caesarea Philippi',  33.25, 35.69],
        ['Caesarea',           32.50, 34.90],
        ['Joppa',              32.06, 34.76],
        ['Gaza',               31.50, 34.47],
        // Galilee & Samaria
        ['Samaria',            32.28, 35.20],
        ['Nazareth',           32.70, 35.30],
        ['Capernaum',          32.88, 35.57],
        ['Cana',               32.74, 35.34],
        ['Bethsaida',          32.91, 35.63],
        ['Tiberias',           32.80, 35.54],
        ['Chorazin',           32.93, 35.56],
        // Judaea
        ['Jerusalem',          31.78, 35.23],
        ['Bethlehem',          31.70, 35.20],
        ['Bethany',            31.77, 35.27],
        ['Jericho',            31.86, 35.45],
        ['Emmaus',             31.83, 35.06],
        // Africa
        ['Alexandria',         31.20, 29.92],
        ['Cyrene',             32.82, 21.86],
        // Islands & other
        ['Malta',              35.94, 14.37],
        ['Fair Havens',        34.92, 24.90],
      ].forEach(([name, lat, lng]) => addLabel(lat, lng, name, 'city'));
    }

    return group;
  }

  // ===== SECTION MANAGEMENT =====
  function getLocations(section) {
    return (LOCATIONS[section] || []).slice().sort((a, b) => a.sequence - b.sequence);
  }

  function loadSection(section) {
    state.currentSection = section;
    state.currentIndex = 0;
    state.visitedIds.clear();
    closePopup();
    clearMarkers();
    renderMarkers(getLocations(section));

    // Update tab UI
    document.querySelectorAll('.section-tab').forEach(btn => {
      const active = btn.dataset.section === section;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active);
    });
    document.querySelectorAll('.drawer-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.section === section);
    });

    // Rebuild jump grid for new section (if panel is open)
    const panel = document.getElementById('jump-panel');
    if (panel && panel.classList.contains('visible')) {
      buildJumpList(getLocations(section));
    }

    // Pan map to section center
    const centers = {
      acts: [32.5, 35.0],
      jesus: [32.0, 35.4],
      letters: [37.0, 26.0]
    };
    const zooms = { acts: 6, jesus: 7, letters: 5 };
    state.map.flyTo(centers[section] || [32.0, 35.5], zooms[section] || 6, { duration: 1.2 });
  }

  // ===== MARKER RENDERING =====
  function clearMarkers() {
    state.activeMarkers.forEach(({ marker }) => state.map.removeLayer(marker));
    state.activeMarkers = [];
    if (state.locationDots) {
      state.locationDots.forEach(dot => state.map.removeLayer(dot));
      state.locationDots = [];
    }
  }

  // displayNum is always derived from array position (idx+1) so adding
  // new stops never breaks the visible numbering.
  function createMarkerIcon(location, state_class, displayNum) {
    let html;
    const num = displayNum !== undefined ? displayNum : location.sequence;

    if (location.type === 'narrative') {
      html = `<div class="marker-narrative">${num}</div>`;
    } else if (location.type === 'epistle-from') {
      html = `<div class="marker-epistle-from"><span class="marker-inner">▲</span></div>`;
    } else {
      html = `<div class="marker-epistle-to"><span class="marker-inner">▼</span></div>`;
    }

    return L.divIcon({
      html: `<div class="marker-wrapper ${state_class}">${html}</div>`,
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
  }

  function renderMarkers(locations) {
    locations.forEach((loc, idx) => {
      const displayNum = idx + 1;
      const marker = L.marker([loc.lat, loc.lng], {
        icon: createMarkerIcon(loc, '', displayNum),
        title: `${displayNum}. ${loc.name}`,
        alt: loc.name,
        riseOnHover: true
      });

      marker.on('click', () => openPopup(idx, locations));
      marker.addTo(state.map);

      state.activeMarkers.push({ marker, location: loc, index: idx });

      // Add a small location dot (only for locations that have popups)
      if (loc.name) {
        const dot = L.circleMarker([loc.lat, loc.lng], {
          radius: 3.5,
          fillColor: '#D4A843',
          color: '#F9F4EC',
          weight: 0.5,
          opacity: 0.7,
          fillOpacity: 0.85,
          interactive: false,
          pane: 'markerPane'
        }).addTo(state.map);
        // Store for cleanup if needed
        if (!state.locationDots) state.locationDots = [];
        state.locationDots.push(dot);
      }
    });
  }

  function updateMarkerStates(activeIdx, locations) {
    state.activeMarkers.forEach(({ marker, location, index }) => {
      let cls = '';
      if (index === activeIdx) {
        cls = 'marker-active';
        marker.setZIndexOffset(1000);
      } else if (state.visitedIds.has(location.id)) {
        cls = 'marker-visited';
        marker.setZIndexOffset(0);
      } else {
        marker.setZIndexOffset(0);
      }
      marker.setIcon(createMarkerIcon(location, cls, index + 1));
    });
  }

  // ===== POPUP — DUAL PANEL SYSTEM =====

  // Escape HTML special chars for safe innerHTML injection
  function escHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Ko helper: get translated location data
  function koData(loc) {
    return (state.language === 'ko' && LOCATIONS_KO[loc.section] && LOCATIONS_KO[loc.section][loc.id]) || null;
  }

  // ── Create YouTube button(s) for a chapter ────────────────────────────────────
  // Red SVG play triangle for YouTube buttons
  function makePlayIcon() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 12 12');
    svg.setAttribute('width', '12');
    svg.setAttribute('height', '12');
    svg.classList.add('youtube-play-icon');
    svg.setAttribute('aria-hidden', 'true');
    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    poly.setAttribute('points', '2,1 11,6 2,11');
    poly.setAttribute('fill', '#e00');
    svg.appendChild(poly);
    return svg;
  }

  function createYouTubeElement(youtubeUrls) {
    const isKo = state.language === 'ko';

    // Only show if YouTube URLs exist
    if (!youtubeUrls || youtubeUrls.length === 0) return null;

    // Only show YouTube buttons in Korean mode
    if (!isKo) return null;

    const container = document.createElement('div');
    container.className = 'youtube-buttons-container';

    if (youtubeUrls.length === 1) {
      // Single anchor button
      const btn = document.createElement('a');
      btn.href = youtubeUrls[0];
      btn.target = '_blank';
      btn.rel = 'noopener noreferrer';
      btn.className = 'youtube-watch-btn';
      btn.appendChild(makePlayIcon());
      btn.appendChild(document.createTextNode(' ' + I18N_KO_UI.popup.watchSermon));
      container.appendChild(btn);
    } else {
      // Dropdown button for multiple links
      const dropdownBtn = document.createElement('button');
      dropdownBtn.className = 'youtube-dropdown-btn';
      dropdownBtn.type = 'button';
      dropdownBtn.appendChild(makePlayIcon());
      dropdownBtn.appendChild(document.createTextNode(' ' + I18N_KO_UI.popup.watchSermon + ' ▾'));

      const menu = document.createElement('div');
      menu.className = 'youtube-dropdown-menu';

      youtubeUrls.forEach((url, idx) => {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.appendChild(makePlayIcon());
        link.appendChild(document.createTextNode(' ' + I18N_KO_UI.popup.watchSermon + ' ' + (idx + 1)));
        menu.appendChild(link);
      });

      // Toggle dropdown; stopPropagation prevents the outside-click handler from
      // firing in the same event and immediately closing the menu
      dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('visible');
      });

      // Close when clicking outside
      const outsideHandler = (e) => {
        if (!container.contains(e.target)) {
          menu.classList.remove('visible');
        }
      };
      document.addEventListener('click', outsideHandler);

      container.appendChild(dropdownBtn);
      container.appendChild(menu);
    }

    return container;
  }

  // ── Left panel: render location name, tabs, summary ──────────────────────────
  function renderLeftPanel(loc) {
    const ko = koData(loc);
    const isKo = state.language === 'ko';
    const approxLabel = isKo ? '추정 연대:' : 'Approximate date:';

    // Header — with "Read Bible" button for Summary First mode
    const nameEl = document.getElementById('popup-location-name');
    nameEl.textContent = (ko && ko.name) || loc.name;
    document.getElementById('popup-modern-name').textContent = loc.modernName || '';

    // Add "Read Bible" button to header (to the left of the ✕ close button)
    let readBtn = document.getElementById('read-bible-btn');
    if (!readBtn) {
      readBtn = document.createElement('button');
      readBtn.id = 'read-bible-btn';
      readBtn.className = 'popup-read-btn';
      readBtn.addEventListener('click', () => {
        // Toggle behavior: if right panel open, close it; otherwise open it
        const right = document.getElementById('popup-right');
        if (right.classList.contains('visible')) {
          closeRightPanel();
        } else {
          openRightPanel();
        }
      });
      // Insert before the close button in the header
      const closeBtn = document.getElementById('popup-close');
      closeBtn.parentElement.insertBefore(readBtn, closeBtn);
    }

    // Update button text based on right panel visibility
    const right = document.getElementById('popup-right');
    const isRightOpen = right.classList.contains('visible');
    readBtn.textContent = isRightOpen
      ? (isKo ? '성경 숨기기' : 'Hide Bible')
      : (isKo ? '성경 읽기' : 'Read Bible');
    readBtn.setAttribute('aria-label', isRightOpen
      ? (isKo ? '성경 숨기기' : 'Hide Scripture panel')
      : (isKo ? '성경 읽기' : 'Open Scripture panel'));

    // Chapter tabs (multi-chapter only)
    const tabsEl = document.getElementById('chapter-tabs');
    if (loc.chapters && loc.chapters.length > 1) {
      tabsEl.style.display = '';
      const CIRCLED = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩'];
      tabsEl.innerHTML = loc.chapters.map((ch, i) => {
        const koCh = ko && ko.chapters && ko.chapters[i];
        const rawTitle = (koCh && koCh.title) || ch.title;
        // Use only the part before " — " as a short tab label
        const label = rawTitle.split(' — ')[0] || rawTitle;
        const circled = CIRCLED[i] || String(i + 1);
        return `<button class="chapter-tab ${i === state.activeChapter ? 'active' : ''}" data-chapter="${i}">${circled} ${escHtml(label)}</button>`;
      }).join('');
      tabsEl.querySelectorAll('.chapter-tab').forEach(btn => {
        btn.addEventListener('click', () => selectChapter(parseInt(btn.dataset.chapter, 10)));
      });
    } else {
      tabsEl.style.display = 'none';
    }

    // Summary body
    const oldBadge = document.getElementById('epistle-badge');
    if (oldBadge) oldBadge.remove();

    if (loc.chapters && loc.chapters.length) {
      const ch = loc.chapters[state.activeChapter] || loc.chapters[0];
      const koCh = ko && ko.chapters && ko.chapters[state.activeChapter];
      document.getElementById('popup-title').textContent = (koCh && koCh.title) || ch.title || '';
      document.getElementById('popup-summary').textContent = (koCh && koCh.summary) || ch.summary || '';
      document.getElementById('popup-date').textContent = ch.approximateDate ? `${approxLabel} ${ch.approximateDate}` : '';
    } else {
      const isEpistle = loc.type && loc.type.startsWith('epistle');
      if (isEpistle) {
        document.getElementById('popup-title').textContent = (ko && ko.epistleNameKo) || loc.epistleName || '';
        document.getElementById('popup-summary').textContent = (ko && ko.summary) || loc.summary || '';
        document.getElementById('popup-date').textContent = loc.approximateDate ? `${approxLabel} ${loc.approximateDate}` : '';
        // Epistle badge
        const badge = document.createElement('div');
        badge.id = 'epistle-badge';
        const isFrom = loc.type === 'epistle-from';
        const eName = (ko && ko.epistleNameKo) || loc.epistleName;
        const ftLabel = isFrom
          ? ((ko && ko.writtenFromLabelKo) || loc.writtenFromLabel)
          : ((ko && ko.writtenToLabelKo)   || loc.writtenToLabel);
        badge.innerHTML = `<span class="popup-epistle-badge ${isFrom ? '' : 'to'}">${escHtml(eName)} — ${escHtml(ftLabel)}</span>`;
        document.getElementById('popup-title').after(badge);
      } else {
        document.getElementById('popup-title').textContent = (ko && ko.title) || loc.title || '';
        document.getElementById('popup-summary').textContent = (ko && ko.summary) || loc.summary || '';
        document.getElementById('popup-date').textContent = loc.approximateDate ? `${approxLabel} ${loc.approximateDate}` : '';
      }
    }

    // Progress + nav
    const locs = getLocations(state.currentSection);
    const progText = isKo
      ? I18N_KO_UI.popup.progress(state.currentIndex + 1, locs.length)
      : `Stop ${state.currentIndex + 1} of ${locs.length}`;
    document.getElementById('popup-progress').textContent = progText;
    document.getElementById('popup-prev').disabled = state.currentIndex === 0;
    document.getElementById('popup-next').disabled = state.currentIndex === locs.length - 1;

    // Add YouTube buttons to footer if available
    const footerYoutubeContainer = document.getElementById('popup-footer-youtube');
    if (footerYoutubeContainer) {
      footerYoutubeContainer.innerHTML = '';
      let youtubeUrls = [];
      if (loc.chapters && loc.chapters.length) {
        const ch = loc.chapters[state.activeChapter] || loc.chapters[0];
        youtubeUrls = ch.youtubeUrls || [];
      } else {
        youtubeUrls = loc.youtubeUrls || [];
      }
      const youtubeEl = createYouTubeElement(youtubeUrls);
      if (youtubeEl) {
        footerYoutubeContainer.appendChild(youtubeEl);
      }
    }
  }

  // ── Right panel: render KJV scripture for the current chapter ─────────────────
  function renderRightPanel(loc) {
    const isKo = state.language === 'ko';
    const kjvLabel  = isKo ? '(KJV 영어 성경)' : '(KJV)';
    const fullLabel = isKo ? '전체 본문:'       : 'Full passage:';

    // Add "See Summary" button in right panel header if not already present
    let summaryBtn = document.getElementById('see-summary-btn');
    if (!summaryBtn) {
      summaryBtn = document.createElement('button');
      summaryBtn.id = 'see-summary-btn';
      summaryBtn.className = 'popup-see-summary-btn';
      summaryBtn.addEventListener('click', () => {
        // Toggle behavior: if left panel open, close it; otherwise open it
        const left = document.getElementById('popup-left');
        if (left.classList.contains('visible')) {
          closeLeftPanel();
        } else {
          openLeftPanel();
        }
      });
      const header = document.getElementById('popup-right').querySelector('.popup-right-header');
      header.appendChild(summaryBtn);
    }

    // Update button text based on left panel visibility
    const left = document.getElementById('popup-left');
    const isLeftOpen = left.classList.contains('visible');
    summaryBtn.textContent = isLeftOpen
      ? (isKo ? '요약 숨기기' : 'Hide Summary')
      : (isKo ? '요약 보기' : 'See Summary');
    summaryBtn.setAttribute('aria-label', isLeftOpen
      ? (isKo ? '요약 숨기기' : 'Hide Summary panel')
      : (isKo ? '요약 보기' : 'Open Summary panel'));

    let kjvText, kjvRef, scriptureRef;

    if (loc.chapters && loc.chapters.length) {
      const ch = loc.chapters[state.activeChapter] || loc.chapters[0];
      kjvText      = ch.kjvText;
      kjvRef       = ch.kjvRef;
      scriptureRef = ch.scriptureRef;
    } else if (loc.type && loc.type.startsWith('epistle')) {
      kjvText      = loc.keyVerse;
      kjvRef       = loc.keyRef;
      scriptureRef = null;
    } else {
      kjvText      = loc.kjvText;
      kjvRef       = loc.kjvRef;
      scriptureRef = loc.scriptureRef;
    }

    // Right panel header ref
    document.getElementById('popup-right-ref').textContent = kjvRef || '';

    if (kjvText) {
      const pages = paginateText(kjvText);
      renderScripturePages(pages, true);
      let refText = `${kjvRef || ''} ${kjvLabel}`;
      if (scriptureRef) refText += `  ·  ${fullLabel} ${scriptureRef}`;
      document.getElementById('scripture-ref').textContent = refText;
    } else {
      resetScripturePages();
      document.getElementById('scripture-ref').textContent = '';
    }

    // Add YouTube buttons to right panel footer if available
    const rightFooterYoutubeContainer = document.getElementById('popup-right-footer-youtube');
    if (rightFooterYoutubeContainer) {
      rightFooterYoutubeContainer.innerHTML = '';
      let youtubeUrls = [];
      if (loc.chapters && loc.chapters.length) {
        const ch = loc.chapters[state.activeChapter] || loc.chapters[0];
        youtubeUrls = ch.youtubeUrls || [];
      } else {
        youtubeUrls = loc.youtubeUrls || [];
      }
      const youtubeEl = createYouTubeElement(youtubeUrls);
      if (youtubeEl) {
        rightFooterYoutubeContainer.appendChild(youtubeEl);
      }
    }

    document.getElementById('popup-right-body').scrollTop = 0;
  }

  // ── Select a chapter tab (multi-chapter locations) ────────────────────────────
  function selectChapter(chIdx) {
    const locs = getLocations(state.currentSection);
    const loc  = locs[state.currentIndex];
    if (!loc || !loc.chapters) return;
    state.activeChapter = chIdx;

    document.querySelectorAll('.chapter-tab').forEach((tab, i) => {
      tab.classList.toggle('active', i === chIdx);
    });

    renderLeftPanel(loc);   // refresh summary + tabs + youtube buttons
    renderRightPanel(loc);  // refresh scripture + youtube buttons
    refreshJumpList();
  }

  // ── Update button text based on panel states ──────────────────────────────────
  function updateButtonTexts() {
    const isKo = state.language === 'ko';
    const left = document.getElementById('popup-left');
    const right = document.getElementById('popup-right');
    const isLeftOpen = left.classList.contains('visible');
    const isRightOpen = right.classList.contains('visible');

    // Update "Read Bible" / "Hide Bible" button
    const readBtn = document.getElementById('read-bible-btn');
    if (readBtn) {
      readBtn.textContent = isRightOpen
        ? (isKo ? '성경 숨기기' : 'Hide Bible')
        : (isKo ? '성경 읽기' : 'Read Bible');
      readBtn.setAttribute('aria-label', isRightOpen
        ? (isKo ? '성경 숨기기' : 'Hide Scripture panel')
        : (isKo ? '성경 읽기' : 'Open Scripture panel'));
    }

    // Update "See Summary" / "Hide Summary" button
    const summaryBtn = document.getElementById('see-summary-btn');
    if (summaryBtn) {
      summaryBtn.textContent = isLeftOpen
        ? (isKo ? '요약 숨기기' : 'Hide Summary')
        : (isKo ? '요약 보기' : 'See Summary');
      summaryBtn.setAttribute('aria-label', isLeftOpen
        ? (isKo ? '요약 숨기기' : 'Hide Summary panel')
        : (isKo ? '요약 보기' : 'Open Summary panel'));
    }
  }

  // ── Open/close individual panels ──────────────────────────────────────────────
  function openLeftPanel() {
    const left = document.getElementById('popup-left');
    const right = document.getElementById('popup-right');
    left.classList.add('visible');
    left.setAttribute('aria-hidden', 'false');
    state.popupOpen = true;
    // Bring left panel to front by bumping z-index
    left.style.zIndex = '2001';
    if (right.classList.contains('visible')) {
      right.style.zIndex = '2000';
    }
    // Update button text
    updateButtonTexts();
    refreshJumpList();
  }

  function openRightPanel() {
    const left = document.getElementById('popup-left');
    const right = document.getElementById('popup-right');
    right.classList.add('visible');
    right.setAttribute('aria-hidden', 'false');
    state.rightPanelOpen = true;
    // Bring right panel to front by bumping z-index
    right.style.zIndex = '2001';
    if (left.classList.contains('visible')) {
      left.style.zIndex = '2000';
    }
    // Update button text
    updateButtonTexts();
    refreshJumpList();
  }

  function closeLeftPanel() {
    const left = document.getElementById('popup-left');
    left.classList.remove('visible');
    left.setAttribute('aria-hidden', 'true');
    left.style.zIndex = '2000';
    state.popupOpen = false;
    // Update button text
    updateButtonTexts();
    refreshJumpList();
  }

  function closeRightPanel() {
    const right = document.getElementById('popup-right');
    right.classList.remove('visible');
    right.setAttribute('aria-hidden', 'true');
    right.style.zIndex = '2000';
    state.rightPanelOpen = false;
    // Update button text
    updateButtonTexts();
    refreshJumpList();
  }

  // ── Open location — show default panel based on mode ──────────────────────────
  function openPopup(idx, locations) {
    const loc = locations[idx];
    if (!loc) return;

    state.currentIndex  = idx;
    state.activeChapter = 0;
    state.visitedIds.add(loc.id);
    updateMarkerStates(idx, locations);

    state.map.panTo([loc.lat, loc.lng], { animate: true, duration: 0.6 });

    renderLeftPanel(loc);
    renderRightPanel(loc);

    // Show appropriate default panel based on mode
    if (state.defaultMode === 'bible') {
      // Bible First: show only right panel, positioned left-center to avoid jump panel
      closeLeftPanel();
      openRightPanel();
      const right = document.getElementById('popup-right');
      right.style.left = '16px';
      right.style.right = 'auto';
      right.style.top = 'calc(var(--nav-height) + 16px)';
    } else if (state.defaultMode === 'both') {
      // Both mode: show both panels, left on left, right on lower-right
      openLeftPanel();
      openRightPanel();
      const left = document.getElementById('popup-left');
      const right = document.getElementById('popup-right');
      // Left panel stays at its default left position
      left.style.left = '16px';
      left.style.right = 'auto';
      left.style.top = 'calc(var(--nav-height) + 16px)';
      // Right panel positioned lower-right to avoid jump panel (280px wide + margins)
      right.style.left = 'auto';
      right.style.right = '16px';
      right.style.top = 'calc(var(--nav-height) + 380px)'; /* below left panel */
    } else {
      // Summary First: show only left panel
      openLeftPanel();
      closeRightPanel();
      const left = document.getElementById('popup-left');
      left.style.left = '16px';
      left.style.right = 'auto';
    }

    refreshJumpList();
    highlightCityLabel(loc.name);
    document.getElementById('popup-body').scrollTop = 0;

    setTimeout(() => {
      const focusBtn = state.defaultMode === 'bible'
        ? document.getElementById('popup-right-close')
        : document.getElementById('popup-close');
      if (focusBtn) focusBtn.focus();
    }, 50);
  }

  function closePopup() {
    closeLeftPanel();
    closeRightPanel();
    state.popupOpen      = false;
    state.rightPanelOpen = false;
    const locs = getLocations(state.currentSection);
    updateMarkerStates(-1, locs);
    clearCityLabelHighlight();
    refreshJumpList();
  }

  function navigatePopup(delta) {
    const locs = getLocations(state.currentSection);
    const newIdx = state.currentIndex + delta;
    if (newIdx >= 0 && newIdx < locs.length) {
      openPopup(newIdx, locs);
    }
  }

  function startFromBeginning() {
    const locs = getLocations(state.currentSection);
    if (locs && locs.length > 0) {
      openPopup(0, locs);
    }
  }

  // ── Drag-to-reposition ────────────────────────────────────────────────────────
  function makeDraggable(panel, handleEl) {
    let startX, startY, origLeft, origTop;
    handleEl.addEventListener('mousedown', e => {
      const rect = panel.getBoundingClientRect();
      startX  = e.clientX;
      startY  = e.clientY;
      origLeft = rect.left;
      origTop  = rect.top;

      function onMove(e) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        panel.style.left   = Math.max(0, origLeft + dx) + 'px';
        panel.style.top    = Math.max(0, origTop  + dy) + 'px';
        panel.style.right  = 'auto';
        panel.style.bottom = 'auto';
      }
      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      e.preventDefault();
    });
    // Touch support
    handleEl.addEventListener('touchstart', e => {
      const t = e.touches[0];
      const rect = panel.getBoundingClientRect();
      startX  = t.clientX; startY  = t.clientY;
      origLeft = rect.left; origTop  = rect.top;
      function onMove(e) {
        const t = e.touches[0];
        panel.style.left   = Math.max(0, origLeft + (t.clientX - startX)) + 'px';
        panel.style.top    = Math.max(0, origTop  + (t.clientY - startY)) + 'px';
        panel.style.right  = 'auto';
        panel.style.bottom = 'auto';
        e.preventDefault();
      }
      function onEnd() {
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
      }
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onEnd);
    }, { passive: true });
  }

  // ── Resize-from-corner ────────────────────────────────────────────────────────
  function makeResizable(panel, handleEl) {
    const MIN_W = 240;
    const MIN_H = 180;

    function startResize(startX, startY) {
      const rect = panel.getBoundingClientRect();
      const origW = rect.width;
      const origH = rect.height;

      function onMove(clientX, clientY) {
        const dw = clientX - startX;
        const dh = clientY - startY;
        const newW = Math.max(MIN_W, origW + dw);
        const newH = Math.max(MIN_H, Math.min(window.innerHeight - rect.top - 10, origH + dh));
        panel.style.width  = newW + 'px';
        panel.style.height = newH + 'px';
        // Disable max-height restriction once user manually sized the panel
        panel.style.maxHeight = newH + 'px';
      }

      function onMouseMove(e) { onMove(e.clientX, e.clientY); }
      function onTouchMove(e) { const t = e.touches[0]; onMove(t.clientX, t.clientY); e.preventDefault(); }

      function cleanup() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', cleanup);
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', cleanup);
      }

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', cleanup);
      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', cleanup);
    }

    handleEl.addEventListener('mousedown', e => {
      startResize(e.clientX, e.clientY);
      e.preventDefault();
      e.stopPropagation();   // don't trigger drag
    });

    handleEl.addEventListener('touchstart', e => {
      const t = e.touches[0];
      startResize(t.clientX, t.clientY);
    }, { passive: true });
  }

  // ===== CITY LABEL HIGHLIGHTING =====
  function highlightCityLabel(cityName) {
    clearCityLabelHighlight();
    document.querySelectorAll('.ancient-label.city').forEach(label => {
      if (label.textContent.trim() === cityName.trim()) {
        label.classList.add('highlighted');
      }
    });
  }

  function clearCityLabelHighlight() {
    document.querySelectorAll('.ancient-label.city.highlighted').forEach(label => {
      label.classList.remove('highlighted');
    });
  }

  // ===== TEXT SIZE =====
  function setTextSize(size) {
    state.textSize = size;
    document.body.classList.remove('text-large', 'text-xlarge');
    if (size === 'large') document.body.classList.add('text-large');
    if (size === 'xlarge') document.body.classList.add('text-xlarge');

    document.querySelectorAll('.size-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.size === size);
      btn.setAttribute('aria-pressed', btn.dataset.size === size);
    });

    savePrefs();
  }

  // ===== MUSIC PLAYLIST =====
  // Add your MP3 files to the audio/ folder and list them here.
  // Tracks play in order, then loop back to the start.
  // Any number of files — just add more lines to the arrays.
  const PLAYLISTS = {
    ambient: [
      'audio/ambient-01.mp3'
      // Add more tracks here later — they'll play in sequence automatically
    ],
    hymn: [
      // Add hymn tracks here when ready
      // e.g. 'audio/hymn-01.mp3', 'audio/hymn-02.mp3'
    ]
  };

  const music = {
    audio: null,
    playlist: [],
    trackIndex: 0,
    targetVolume: 0.18,
    fadeTimer: null
  };

  function musicFadeIn(audio) {
    audio.volume = 0;
    if (music.fadeTimer) clearInterval(music.fadeTimer);
    music.fadeTimer = setInterval(() => {
      audio.volume = Math.min(audio.volume + 0.03, music.targetVolume);
      if (audio.volume >= music.targetVolume) {
        audio.volume = music.targetVolume;
        clearInterval(music.fadeTimer);
        music.fadeTimer = null;
      }
    }, 60);
  }

  function musicFadeOut(audio, onDone) {
    if (music.fadeTimer) clearInterval(music.fadeTimer);
    music.fadeTimer = setInterval(() => {
      audio.volume = Math.max(audio.volume - 0.03, 0);
      if (audio.volume <= 0) {
        clearInterval(music.fadeTimer);
        music.fadeTimer = null;
        audio.pause();
        if (onDone) onDone();
      }
    }, 60);
  }

  function playTrack(index) {
    if (!music.playlist.length) return;
    music.trackIndex = ((index % music.playlist.length) + music.playlist.length) % music.playlist.length;
    const src = music.playlist[music.trackIndex];

    if (music.audio) {
      music.audio.pause();
      music.audio.onended = null;
    }

    const audio = new Audio(src);
    music.audio = audio;
    audio.volume = 0;

    audio.onended = () => playTrack(music.trackIndex + 1);  // advance to next track

    audio.play().then(() => {
      musicFadeIn(audio);
    }).catch(() => {
      // File missing — skip to next track after a short delay
      setTimeout(() => playTrack(music.trackIndex + 1), 500);
    });
  }

  function stopMusic(onDone) {
    if (music.audio) {
      musicFadeOut(music.audio, () => {
        music.audio = null;
        if (onDone) onDone();
      });
    } else {
      if (onDone) onDone();
    }
  }

  function cycleMusic() {
    // Only include 'hymn' in the cycle if hymn tracks are loaded
    const states = PLAYLISTS.hymn.length
      ? ['silent', 'ambient', 'hymn']
      : ['silent', 'ambient'];
    const icons = { silent: '🔇', ambient: '🎵', hymn: '⛪' };
    const labels = { silent: 'Music: Off', ambient: 'Music: Ambient', hymn: 'Music: Hymns' };

    const next = states[(states.indexOf(state.musicState) + 1) % states.length];
    state.musicState = next;

    stopMusic(() => {
      if (next !== 'silent') {
        music.playlist = [...(PLAYLISTS[next] || [])];
        music.trackIndex = 0;
        playTrack(0);
      }
    });

    const btn = document.getElementById('music-toggle-btn');
    btn.querySelector('.music-icon').textContent = icons[next];
    btn.setAttribute('aria-label', labels[next]);
  }

  // ===== SCRIPTURE PAGINATION =====
  let scripturePages = [];
  let scripturePage = 0;

  function paginateText(text, maxChars = 700) {
    if (!text || text.length <= maxChars) return [text];
    const pages = [];
    let remaining = text.trim();
    while (remaining.length > maxChars) {
      // Try to break at a sentence end, otherwise at a space
      let breakAt = remaining.lastIndexOf('. ', maxChars);
      if (breakAt < maxChars * 0.55) breakAt = remaining.lastIndexOf(' ', maxChars);
      if (breakAt < 0) breakAt = maxChars;
      pages.push(remaining.slice(0, breakAt + 1).trim());
      remaining = remaining.slice(breakAt + 1).trim();
    }
    if (remaining.length > 0) pages.push(remaining);
    return pages;
  }

  function renderScripturePages(pages, quoted) {
    scripturePages = pages;
    scripturePage = 0;
    showScripturePage(quoted);
  }

  function resetScripturePages() {
    scripturePages = [];
    scripturePage = 0;
    document.getElementById('scripture-page-nav').style.display = 'none';
  }

  function showScripturePage(quoted) {
    const el = document.getElementById('scripture-text');
    const navEl = document.getElementById('scripture-page-nav');
    const numEl = document.getElementById('scripture-page-num');
    const prevBtn = document.getElementById('scripture-prev-page');
    const nextBtn = document.getElementById('scripture-next-page');

    const text = scripturePages[scripturePage] || '';
    el.textContent = quoted ? `"${text}"` : text;

    if (scripturePages.length > 1) {
      navEl.style.display = 'flex';
      numEl.textContent = `Page ${scripturePage + 1} of ${scripturePages.length}`;
      prevBtn.disabled = scripturePage === 0;
      nextBtn.disabled = scripturePage === scripturePages.length - 1;
    } else {
      navEl.style.display = 'none';
    }
  }

  // ===== SETTINGS & PREFERENCES =====
  const PREFS_KEY = 'imap-user-prefs';

  function loadPrefs() {
    try {
      const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
      if (saved.textSize)    setTextSize(saved.textSize);
      if (saved.defaultMode) applyDefaultMode(saved.defaultMode, false);
      if (saved.opacityMode) applyOpacity(saved.opacityMode, false);
    } catch (e) { /* ignore corrupt prefs */ }
  }

  function savePrefs() {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({
        textSize:    state.textSize,
        defaultMode: state.defaultMode,
        opacityMode: state.opacityMode
      }));
    } catch (e) { /* ignore private-browse */ }
  }

  function applyDefaultMode(mode, save = true) {
    state.defaultMode = mode;
    document.querySelectorAll('.settings-opt[data-pref="defaultMode"]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.val === mode);
    });
    if (save) savePrefs();
  }

  function applyOpacity(mode, save = true) {
    state.opacityMode = mode;
    document.body.classList.toggle('opacity-opaque', mode === 'opaque');
    document.querySelectorAll('.settings-opt[data-pref="opacityMode"]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.val === mode);
    });
    if (save) savePrefs();
  }

  function openSettings() {
    const panel = document.getElementById('settings-panel');
    panel.classList.add('visible');
    panel.setAttribute('aria-hidden', 'false');
    document.getElementById('settings-btn').classList.add('active');
    document.getElementById('settings-btn').setAttribute('aria-expanded', 'true');
  }

  function closeSettings() {
    const panel = document.getElementById('settings-panel');
    panel.classList.remove('visible');
    panel.setAttribute('aria-hidden', 'true');
    document.getElementById('settings-btn').classList.remove('active');
    document.getElementById('settings-btn').setAttribute('aria-expanded', 'false');
  }

  function toggleSettings() {
    const panel = document.getElementById('settings-panel');
    if (panel.classList.contains('visible')) closeSettings();
    else openSettings();
  }

  // ===== JUMP-TO PANEL =====
  function buildJumpList(locations) {
    const list  = document.getElementById('jump-list');
    const title = document.getElementById('jump-panel-title');
    const isKo  = state.language === 'ko';
    const CIRCLED = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩'];
    const sectionNames = isKo
      ? { acts: I18N_KO_UI.sections.acts, jesus: I18N_KO_UI.sections.jesus, letters: I18N_KO_UI.sections.letters }
      : { acts: 'Early Church (Acts)', jesus: "Jesus' Ministry", letters: "Paul's Letters" };
    title.textContent = sectionNames[state.currentSection] || 'Jump to Stop';

    list.innerHTML = '';
    locations.forEach((loc, idx) => {
      const displayNum = idx + 1;
      const ko = isKo && LOCATIONS_KO[loc.section] && LOCATIONS_KO[loc.section][loc.id];
      const displayName  = (ko && ko.name) || loc.name;
      const isMulti      = loc.chapters && loc.chapters.length > 1;
      const displayTitle = isMulti ? '' : ((ko && ko.title) || loc.title || '');
      const ariaLabel    = `Stop ${displayNum}: ${displayName}${displayTitle ? ' — ' + displayTitle : ''}`;

      const li = document.createElement('li');
      li.className = 'jump-list-item';

      // ── Parent button (location name + number) ──
      const btn = document.createElement('button');
      btn.className   = 'jump-list-btn';
      btn.setAttribute('aria-label', ariaLabel);
      btn.dataset.index = idx;
      const suffix = isMulti ? '' : (displayTitle ? ` — ${displayTitle}` : '');
      btn.innerHTML = `<span class="jump-list-num">${displayNum}</span><span class="jump-list-name">${escHtml(displayName)}${escHtml(suffix)}</span>`;
      if (state.visitedIds.has(loc.id)) btn.classList.add('visited');
      if (idx === state.currentIndex && state.popupOpen) btn.classList.add('active');
      btn.addEventListener('click', () => openPopup(idx, locations));
      li.appendChild(btn);

      // ── Sub-list (chapter titles for multi-chapter locations) ──
      if (isMulti) {
        const subUl = document.createElement('ul');
        subUl.className = 'jump-sub-list';
        loc.chapters.forEach((ch, ci) => {
          const koCh = ko && ko.chapters && ko.chapters[ci];
          const chTitle = (koCh && koCh.title) || ch.title || '';
          const circled = CIRCLED[ci] || String(ci + 1);
          const subLi  = document.createElement('li');
          const subBtn = document.createElement('button');
          subBtn.className = 'jump-sub-btn';
          subBtn.textContent = `${circled} ${chTitle}`;
          subBtn.dataset.index   = idx;
          subBtn.dataset.chapter = ci;
          if (idx === state.currentIndex && ci === state.activeChapter && state.popupOpen) {
            subBtn.classList.add('active');
          }
          subBtn.addEventListener('click', () => {
            state.activeChapter = ci;
            openPopup(idx, locations);
            closeJumpPanel(); // Auto-close jump panel on subheading click
          });
          subLi.appendChild(subBtn);
          subUl.appendChild(subLi);
        });
        li.appendChild(subUl);
      }

      list.appendChild(li);
    });

    // Scroll active item into view
    setTimeout(() => {
      const active = list.querySelector('.jump-list-btn.active, .jump-sub-btn.active');
      if (active) active.scrollIntoView({ block: 'nearest' });
    }, 50);
  }

  function refreshJumpList() {
    const locs = getLocations(state.currentSection);
    document.querySelectorAll('.jump-list-btn').forEach(btn => {
      const idx = parseInt(btn.dataset.index, 10);
      const loc = locs[idx];
      if (!loc) return;
      btn.classList.toggle('visited', state.visitedIds.has(loc.id) && idx !== state.currentIndex);
      btn.classList.toggle('active', idx === state.currentIndex && state.popupOpen);
    });
    document.querySelectorAll('.jump-sub-btn').forEach(btn => {
      const idx = parseInt(btn.dataset.index, 10);
      const ci  = parseInt(btn.dataset.chapter, 10);
      btn.classList.toggle('active', idx === state.currentIndex && ci === state.activeChapter && state.popupOpen);
    });
  }

  function openJumpPanel() {
    const locs = getLocations(state.currentSection);
    buildJumpList(locs);
    const panel = document.getElementById('jump-panel');
    panel.classList.add('visible');
    panel.setAttribute('aria-hidden', 'false');
    document.getElementById('jump-toggle-btn').setAttribute('aria-expanded', 'true');
  }

  function closeJumpPanel() {
    const panel = document.getElementById('jump-panel');
    panel.classList.remove('visible');
    panel.setAttribute('aria-hidden', 'true');
    document.getElementById('jump-toggle-btn').setAttribute('aria-expanded', 'false');
  }

  function toggleJumpPanel() {
    const panel = document.getElementById('jump-panel');
    if (panel.classList.contains('visible')) {
      closeJumpPanel();
    } else {
      openJumpPanel();
    }
  }

  // ===== LANGUAGE TOGGLE =====
  function setLanguage(lang) {
    if (state.language === lang) return;
    state.language = lang;

    // Body class controls Korean font CSS rules
    document.body.classList.toggle('lang-ko', lang === 'ko');

    // Update all language toggle buttons (desktop + mobile drawer)
    document.querySelectorAll('.lang-btn, .drawer-lang').forEach(btn => {
      const isActive = btn.dataset.lang === lang;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive);
    });

    // Rebuild ancient label layer with new language
    if (state.map.hasLayer(state.ancientLabels)) {
      state.map.removeLayer(state.ancientLabels);
      state.ancientLabels = buildAncientLabels();
      state.ancientLabels.addTo(state.map);
    } else {
      state.ancientLabels = buildAncientLabels();
    }

    // Refresh jump panel if it's open
    const panel = document.getElementById('jump-panel');
    if (panel && panel.classList.contains('visible')) {
      buildJumpList(getLocations(state.currentSection));
    }

    // Re-render open popup with new language
    if (state.popupOpen) {
      openPopup(state.currentIndex, getLocations(state.currentSection));
    }
  }

  // ===== MOBILE DRAWER =====
  function openDrawer() {
    document.getElementById('mobile-drawer').classList.add('open');
    document.getElementById('drawer-overlay').classList.add('visible');
    document.getElementById('hamburger-btn').setAttribute('aria-expanded', 'true');
    document.getElementById('mobile-drawer').setAttribute('aria-hidden', 'false');
  }

  function closeDrawer() {
    document.getElementById('mobile-drawer').classList.remove('open');
    document.getElementById('drawer-overlay').classList.remove('visible');
    document.getElementById('hamburger-btn').setAttribute('aria-expanded', 'false');
    document.getElementById('mobile-drawer').setAttribute('aria-hidden', 'true');
  }

  // ===== EVENT BINDING =====
  function bindEvents() {
    // Section tabs (desktop) — locked tabs are no-ops
    document.querySelectorAll('.section-tab').forEach(btn => {
      if (btn.classList.contains('locked')) return;
      btn.addEventListener('click', () => loadSection(btn.dataset.section));
    });

    // Section tabs (mobile drawer) — locked tabs are no-ops
    document.querySelectorAll('.drawer-tab').forEach(btn => {
      if (btn.classList.contains('locked')) return;
      btn.addEventListener('click', () => { loadSection(btn.dataset.section); closeDrawer(); });
    });

    // Layer toggle
    document.getElementById('btn-ancient').addEventListener('click', () => setLayer(true));
    document.getElementById('btn-modern').addEventListener('click', () => setLayer(false));
    document.querySelectorAll('.drawer-layer').forEach(btn => {
      btn.addEventListener('click', () => { setLayer(btn.dataset.layer === 'ancient'); closeDrawer(); });
    });

    // Language toggle (desktop nav + mobile drawer)
    document.querySelectorAll('.lang-btn, .drawer-lang').forEach(btn => {
      btn.addEventListener('click', () => {
        setLanguage(btn.dataset.lang);
        if (btn.classList.contains('drawer-lang')) closeDrawer();
      });
    });

    // Text size
    document.querySelectorAll('.size-btn').forEach(btn => {
      btn.addEventListener('click', () => setTextSize(btn.dataset.size));
    });

    // Music
    document.getElementById('music-toggle-btn').addEventListener('click', cycleMusic);

    // Hamburger
    document.getElementById('hamburger-btn').addEventListener('click', openDrawer);
    document.getElementById('drawer-overlay').addEventListener('click', closeDrawer);

    // Settings panel
    document.getElementById('settings-btn').addEventListener('click', toggleSettings);
    document.getElementById('settings-close').addEventListener('click', closeSettings);
    document.querySelectorAll('.settings-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const pref = btn.dataset.pref;
        const val  = btn.dataset.val;
        if (pref === 'defaultMode') applyDefaultMode(val);
        if (pref === 'opacityMode') applyOpacity(val);
      });
    });
    // Close settings when clicking outside
    document.addEventListener('click', e => {
      const panel = document.getElementById('settings-panel');
      const sBtn  = document.getElementById('settings-btn');
      if (panel.classList.contains('visible') && !panel.contains(e.target) && e.target !== sBtn) {
        closeSettings();
      }
    });

    // Dual popup: close buttons
    document.getElementById('popup-close').addEventListener('click', closePopup);
    document.getElementById('popup-right-close').addEventListener('click', closeRightPanel);

    // Popup navigation
    document.getElementById('popup-prev').addEventListener('click', () => navigatePopup(-1));
    document.getElementById('popup-next').addEventListener('click', () => navigatePopup(1));

    // Drag handles
    makeDraggable(document.getElementById('popup-left'),  document.getElementById('popup-left-handle'));
    makeDraggable(document.getElementById('popup-right'), document.getElementById('popup-right-handle'));

    // Resize handles (bottom-right corner)
    makeResizable(document.getElementById('popup-left'),  document.getElementById('popup-left-resize'));
    makeResizable(document.getElementById('popup-right'), document.getElementById('popup-right-resize'));

    // Keyboard navigation — cycle chapters first, then locations
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (state.popupOpen) closePopup();
        closeSettings();
        closeJumpPanel();
        return;
      }
      if (!state.popupOpen && !state.rightPanelOpen) return;

      const locs = getLocations(state.currentSection);
      const loc = locs[state.currentIndex];
      const isMulti = loc && loc.chapters && loc.chapters.length > 1;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (isMulti && state.activeChapter < loc.chapters.length - 1) {
          selectChapter(state.activeChapter + 1);
        } else {
          navigatePopup(1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (isMulti && state.activeChapter > 0) {
          selectChapter(state.activeChapter - 1);
        } else {
          navigatePopup(-1);
        }
      }
    });

    // Start from Beginning button
    document.getElementById('start-btn').addEventListener('click', startFromBeginning);

    // Jump-to panel
    document.getElementById('jump-toggle-btn').addEventListener('click', toggleJumpPanel);
    document.getElementById('jump-panel-close').addEventListener('click', closeJumpPanel);

    // Scripture pagination buttons
    document.getElementById('scripture-prev-page').addEventListener('click', () => {
      if (scripturePage > 0) { scripturePage--; showScripturePage(true); }
    });
    document.getElementById('scripture-next-page').addEventListener('click', () => {
      if (scripturePage < scripturePages.length - 1) { scripturePage++; showScripturePage(true); }
    });

    // About modal
    document.getElementById('about-btn').addEventListener('click', openAbout);
    document.getElementById('about-close').addEventListener('click', closeAbout);
    document.getElementById('about-modal').addEventListener('click', e => {
      if (e.target === e.currentTarget) closeAbout();
    });
  }

  function openAbout() {
    const modal = document.getElementById('about-modal');
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('visible');
    document.getElementById('about-close').focus();
  }

  function closeAbout() {
    const modal = document.getElementById('about-modal');
    modal.setAttribute('aria-hidden', 'true');
    modal.classList.remove('visible');
  }

  // ===== HOME BUTTON / RESET TO OVERVIEW =====
  function resetMapToOverview() {
    // Close any open panels
    document.getElementById('popup-left').classList.remove('visible');
    document.getElementById('popup-left').setAttribute('aria-hidden', 'true');
    document.getElementById('popup-right').classList.remove('visible');
    document.getElementById('popup-right').setAttribute('aria-hidden', 'true');
    closeJumpPanel();
    state.popupOpen = false;
    state.rightPanelOpen = false;

    // Get all locations for current section
    const locs = getLocations(state.currentSection);
    if (!locs || locs.length === 0) return;

    // Calculate bounds to fit all locations
    const bounds = L.latLngBounds([]);
    locs.forEach(loc => {
      bounds.extend([loc.lat, loc.lng]);
    });

    // Zoom to fit all locations with padding
    if (bounds.isValid()) {
      state.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 5 });
    }

    // Clear visited state for visual reset
    document.querySelectorAll('.jump-list-btn').forEach(btn => {
      btn.classList.remove('active', 'visited');
    });
  }

  // ===== BOOT =====
  function init() {
    initMap();
    bindEvents();
    setTextSize('standard');
    loadPrefs();          // restore saved settings from localStorage
    loadSection('acts');
  }

  document.addEventListener('DOMContentLoaded', init);

})();
