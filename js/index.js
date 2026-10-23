const DATA_URL = 'data.json';
const LOCALE = 'nl-BE';

const dom = {
  timeline: document.querySelector('#timeline'),
  stats: document.querySelector('#stats'),
  itemTemplate: document.querySelector('#timeline-item-template'),
};

/* ---------- Formatting ---------- */

const monthFormatter = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const percentFormatter = new Intl.NumberFormat('en-GB', {
  style: 'percent',
  maximumFractionDigits: 0,
  signDisplay: 'exceptZero',
});

const moneyFormatters = new Map();

function formatMoney(amount, currency = 'EUR') {
  if (!moneyFormatters.has(currency)) {
    moneyFormatters.set(
      currency,
      new Intl.NumberFormat(LOCALE, { style: 'currency', currency }),
    );
  }
  return moneyFormatters.get(currency).format(amount);
}

// Puts the sign in front of the currency symbol: "+€ 77,35" / "−€ 10,00".
function formatSignedMoney(amount, currency = 'EUR') {
  const sign = amount > 0 ? '+' : amount < 0 ? '\u2212' : '';
  return `${sign} ${formatMoney(Math.abs(amount), currency)}`;
}

function formatMonth(isoMonth) {
  return monthFormatter.format(new Date(`${isoMonth}-01T00:00:00Z`));
}

/* ---------- DOM helpers ---------- */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function fill(root, values) {
  for (const [field, value] of Object.entries(values)) {
    root.querySelectorAll(`[data-field="${field}"]`).forEach((node) => {
      node.textContent = value;
    });
  }
}

/* ---------- Rendering ---------- */

function renderBenefits(container, benefits = {}) {
  for (const [category, items] of Object.entries(benefits)) {
    const group = el('section', 'benefit-group');
    group.append(el('h4', null, category));

    const list = el('ul');
    items.forEach((item) => list.append(el('li', null, item)));

    group.append(list);
    container.append(group);
  }
}

function createTimelineItem(record, previous) {
  const node = dom.itemTemplate.content.cloneNode(true);
  const { currency, gross, net } = record.salary;

  node.querySelector('.timeline-item').id = record.date;
  node.querySelector('time').dateTime = record.date;

  fill(node, {
    date: formatMonth(record.date),
    role: record.role,
    net: formatMoney(net, currency),
    gross: formatMoney(gross, currency),
    age: record.age,
    maritalStatus: record.maritalStatus,
    kids: record.kids,
    region: record.region,
    sector: record.sector,
    reason: record.reason,
  });

  if (previous) {
    const difference = net - previous.salary.net;
    const delta = node.querySelector('.delta');
    delta.textContent = `${formatSignedMoney(difference, currency)} net vs previous`;
    delta.dataset.trend = difference > 0 ? 'up' : difference < 0 ? 'down' : 'flat';
    delta.hidden = false;
  }

  renderBenefits(node.querySelector('.benefits'), record.benefits);
  return node;
}

function renderStats(records) {
  const latest = records[0];
  const first = records.at(-1);
  const { currency } = latest.salary;
  const since = formatMonth(latest.date);

  const stats = [
    [`Latest net since ${since}`, formatMoney(latest.salary.net, currency)],
    [`Latest gross since ${since}`, formatMoney(latest.salary.gross, currency)],
  ];

  if (records.length > 1) {
    const growth = latest.salary.gross / first.salary.gross - 1;
    stats.push([`Gross growth since ${formatMonth(first.date)}`, percentFormatter.format(growth)]);
  }

  const fragment = document.createDocumentFragment();
  for (const [label, value] of stats) {
    const stat = el('div', 'stat');
    stat.append(el('dt', null, label), el('dd', null, value));
    fragment.append(stat);
  }

  dom.stats.replaceChildren(fragment);
}

function renderTimeline(records) {
  const fragment = document.createDocumentFragment();

  records.forEach((record, index) => {
    fragment.append(createTimelineItem(record, records[index + 1]));
  });

  dom.timeline.replaceChildren(fragment);
}

function openFromHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return;

  const target = document.getElementById(id);
  const details = target?.querySelector('details');
  if (!details) return;

  details.open = true;
  target.scrollIntoView({ block: 'center' });
}

function showError(message) {
  const item = el('li', 'error', message);
  item.setAttribute('role', 'alert');
  dom.timeline.replaceChildren(item);
}

/* ---------- Data ---------- */

async function loadRecords() {
  const response = await fetch(DATA_URL);
  if (!response.ok) {
    throw new Error(`Could not load ${DATA_URL} (HTTP ${response.status})`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error(`${DATA_URL} should contain an array of records`);
  }

  // ISO months (YYYY-MM) sort correctly as strings. Newest first.
  return [...data].sort((a, b) => b.date.localeCompare(a.date));
}

/* ---------- Init ---------- */

async function init() {
  if (!dom.timeline || !dom.stats || !dom.itemTemplate) {
    console.error('Required elements are missing from the page.');
    return;
  }

  try {
    const records = await loadRecords();
    if (records.length === 0) {
      showError('No records yet.');
      return;
    }

    renderStats(records);
    renderTimeline(records);
    openFromHash();
  } catch (error) {
    console.error(error);
    showError('Something went wrong while loading the data. Please try again later.');
  }
}

init();