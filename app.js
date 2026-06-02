const organs = [
  { name: "Heart", folder: "HEART", regions: ["Atrial Muscle", "Epicardium", "Ventricular Muscle1", "Ventricular Muscle2", "Vessel"], spots: 16880, ions: 7420, metabolites: 584 },
  { name: "Liver", folder: "LIVER", regions: ["Hepatic Parenchyma", "Bile Duct", "Capsule", "Vessel Gap"], spots: 21360, ions: 8240, metabolites: 641 },
  { name: "Spleen", folder: "SPLEEN", regions: ["White Pulp", "Red Pulp", "Marginal Zone", "Capsule"], spots: 14905, ions: 6970, metabolites: 558 },
  { name: "Lung", folder: "LUNG", regions: ["Airway", "Alveoli", "Vessel", "Pleura"], spots: 17210, ions: 7130, metabolites: 529 },
  { name: "Kidney", folder: "KIDNEY", regions: ["Cortex", "Medulla", "Pelvis", "Capsule"], spots: 18420, ions: 7860, metabolites: 612 },
  { name: "Lymph Node", folder: "LYMPH", regions: ["Outer Cortex", "Inner Cortex", "Medulla", "Capsule"], spots: 13560, ions: 6760, metabolites: 517 },
  { name: "Bone Marrow", folder: "STERNUM", regions: ["HSPC", "Rib", "Sternal Bone", "Muscle"], spots: 12330, ions: 6680, metabolites: 506 },
  { name: "Thymus", folder: "THYMUS", regions: ["Cortex", "Medulla", "Capsule", "Septum"], spots: 11780, ions: 6450, metabolites: 493 },
  { name: "Intestine", folder: "INTESTINE", regions: ["Villus", "Crypt", "Muscular Layer", "Lumen"], spots: 19760, ions: 7910, metabolites: 601 }
];

const cohorts = [
  { key: "FY", label: "Young Female" },
  { key: "MY", label: "Young Male" },
  { key: "FO", label: "Aged Female" },
  { key: "MO", label: "Aged Male" }
];

const state = {
  organ: organs[0],
  cohort: cohorts[2],
  module2Organ: organs[0],
  module2ClusterKey: ""
};

const formatNumber = (value) => value.toLocaleString("en-US");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function button(label, className, onClick) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = className;
  element.textContent = label;
  element.addEventListener("click", onClick);
  return element;
}

function renderOrganStrip(containerId, compact = false) {
  const container = document.querySelector(containerId);
  if (!container) return;
  container.innerHTML = "";
  organs.forEach((organ) => {
    const item = button(organ.name, compact ? "chip small" : "chip", () => {
      state.organ = organ;
      state.region = organ.regions[0];
      render();
    });
    item.classList.toggle("active", state.organ.name === organ.name);
    container.appendChild(item);
  });
}

function renderModule2OrganStrip() {
  const container = document.querySelector("#specificityOrganStrip");
  if (!container) return;
  container.innerHTML = "";
  organs.forEach((organ) => {
    const item = button(organ.name, "chip small", () => {
      state.module2Organ = organ;
      state.module2ClusterKey = firstModule2Cluster(organ)?.key || "";
      renderModule2();
    });
    item.classList.toggle("active", state.module2Organ.folder === organ.folder);
    container.appendChild(item);
  });
}

function renderSelect(selector) {
  const select = document.querySelector(selector);
  if (!select) return;
  select.innerHTML = organs.map((organ) => `<option>${organ.name}</option>`).join("");
  select.value = state.organ.name;
}

function renderCohortTable() {
  const table = document.querySelector("#cohortTable");
  const title = document.querySelector("#tableOrganName");
  if (!table || !title) return;
  title.textContent = state.organ.name;
  table.innerHTML = cohorts.map((cohort) => {
    const isActive = cohort.key === state.cohort.key;
    return `
      <tr class="${isActive ? "active" : ""}" data-cohort="${cohort.key}">
        <td>${cohort.label}</td>
        <td>3</td>
        <td>${formatNumber(state.organ.spots)}</td>
        <td>${formatNumber(state.organ.ions)}</td>
        <td>${formatNumber(state.organ.metabolites)}</td>
      </tr>
    `;
  }).join("");
  table.querySelectorAll("tr[data-cohort]").forEach((row) => {
    row.addEventListener("click", () => {
      state.cohort = cohorts.find((cohort) => cohort.key === row.dataset.cohort);
      render();
    });
  });
}

function renderCohortButtons() {
  const container = document.querySelector("#browseCohortRow");
  if (!container) return;
  container.innerHTML = "";
  cohorts.forEach((cohort) => {
    const item = button(cohort.label, "chip", () => {
      state.cohort = cohort;
      render();
    });
    item.classList.toggle("active", state.cohort.key === cohort.key);
    container.appendChild(item);
  });
}

function sampleAssetsFor(organ, cohort, sampleIndex) {
  return window.SMA_SAMPLE_ASSETS?.[organ.folder]?.[cohort.key]?.[sampleIndex] || { histology: "", cluster: "" };
}

function renderSampleGrid() {
  const grid = document.querySelector("#sampleGrid");
  if (!grid) return;
  grid.innerHTML = "";
  [0, 1, 2].forEach((sampleIndex) => {
    const sampleName = `S${sampleIndex + 1}`;
    grid.insertAdjacentHTML("beforeend", `
      <article class="sample-row" data-sample-index="${sampleIndex}">
        <strong>${sampleName}</strong>
        <figure class="empty-figure" data-kind="histology">
          <div>Loading image</div>
          <figcaption>H&amp;E image</figcaption>
        </figure>
        <figure class="empty-figure" data-kind="cluster">
          <div>Loading image</div>
          <figcaption>Spatial clustering and annotation</figcaption>
        </figure>
        <figure class="empty-figure">
          <div>Pending</div>
          <figcaption>Metabolite class chart</figcaption>
        </figure>
      </article>
    `);
  });
  hydrateSampleImages(state.organ, state.cohort);
}

function hydrateSampleImages(organ, cohort) {
  const rows = [...document.querySelectorAll(".sample-row")];
  rows.forEach((row) => {
    const sampleIndex = Number(row.dataset.sampleIndex);
    const sampleName = `S${sampleIndex + 1}`;
    const assets = sampleAssetsFor(organ, cohort, sampleIndex);
    if (organ !== state.organ || cohort !== state.cohort) return;

    for (const kind of ["histology", "cluster"]) {
      const figure = row.querySelector(`figure[data-kind="${kind}"]`);
      const src = assets[kind];
      figure.classList.toggle("empty-figure", !src);
      const caption = kind === "histology" ? "H&E image" : "Spatial clustering and annotation";
      figure.innerHTML = src
        ? `<img src="${src}" alt="${organ.name} ${cohort.label} ${sampleName} ${caption}" /><figcaption>${caption}</figcaption>`
        : `<div>Image pending</div><figcaption>${caption}</figcaption>`;
    }
  });
}

function firstModule2Cluster(organ) {
  return window.SMA_MODULE2?.[organ.folder]?.clusters?.[0] || null;
}

function selectedModule2Cluster() {
  const clusters = window.SMA_MODULE2?.[state.module2Organ.folder]?.clusters || [];
  if (!clusters.length) return null;
  return clusters.find((cluster) => cluster.key === state.module2ClusterKey) || clusters[0];
}

function renderModule2Clusters() {
  const list = document.querySelector("#specificityClusterList");
  if (!list) return;
  list.innerHTML = "";
  const clusters = window.SMA_MODULE2?.[state.module2Organ.folder]?.clusters || [];
  if (!state.module2ClusterKey && clusters.length) state.module2ClusterKey = clusters[0].key;
  clusters.forEach((cluster) => {
    const item = button(cluster.label, "chip small", () => {
      state.module2ClusterKey = cluster.key;
      renderModule2();
    });
    item.classList.toggle("active", selectedModule2Cluster()?.key === cluster.key);
    list.appendChild(item);
  });
}

function formatNumberText(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return value || "";
  if (numeric === 0) return "0";
  if (Math.abs(numeric) < 0.001) return numeric.toExponential(2);
  return numeric.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function renderWordCloud(cluster) {
  const cloud = document.querySelector("#module2WordCloud");
  if (!cloud) return;
  cloud.innerHTML = "";
  (cluster?.metabolites || []).forEach((metabolite, index) => {
    const item = document.createElement("span");
    item.textContent = metabolite.name;
    item.style.fontSize = `${metabolite.size || 18}px`;
    item.style.color = ["#06718a", "#e86d4f", "#5ea86a", "#d99a25", "#7560a9", "#172f3a"][index % 6];
    item.style.transform = `rotate(${[-4, 2, 0, 4, -2][index % 5]}deg)`;
    cloud.appendChild(item);
  });
}

function renderMetaboliteTable(cluster) {
  const body = document.querySelector("#module2MetaboliteTable");
  if (!body) return;
  body.innerHTML = (cluster?.metabolites || []).map((row) => `
    <tr>
      <td>${escapeHtml(row.name)}</td>
      <td>${escapeHtml(row.superClass || "NA")}</td>
      <td>${formatNumberText(row.log2FC)}</td>
      <td>${formatNumberText(row.adjustedP)}</td>
    </tr>
  `).join("");
}

function renderPathwayTable(cluster) {
  const body = document.querySelector("#module2PathwayTable");
  if (!body) return;
  body.innerHTML = (cluster?.enrichmentRows || []).map((row) => `
    <tr>
      <td>${escapeHtml(row.pathway)}</td>
      <td>${formatNumberText(row.enrichmentRatio)}</td>
    </tr>
  `).join("");
}

function renderModule2() {
  if (!window.SMA_MODULE2) return;
  renderModule2OrganStrip();
  renderModule2Clusters();
  const organData = window.SMA_MODULE2[state.module2Organ.folder];
  const cluster = selectedModule2Cluster();
  const spatialTitle = document.querySelector("#module2SpatialTitle");
  const spatialImage = document.querySelector("#module2SpatialImage");
  const enrichmentImage = document.querySelector("#module2EnrichmentImage");
  if (spatialTitle) spatialTitle.textContent = `${state.module2Organ.name} Spatial Cluster`;
  if (spatialImage) {
    spatialImage.src = organData?.selectedImage || "";
    spatialImage.alt = `${state.module2Organ.name} selected spatial cluster map`;
  }
  if (enrichmentImage) {
    enrichmentImage.src = cluster?.enrichmentPlot || "";
    enrichmentImage.alt = `${state.module2Organ.name} ${cluster?.label || ""} pathway enrichment plot`;
  }
  renderWordCloud(cluster);
  renderMetaboliteTable(cluster);
  renderPathwayTable(cluster);
}

function render() {
  renderOrganStrip("#browseOrganStrip");
  renderSelect("#distributionOrgan");
  renderSelect("#agingOrgan");
  renderSelect("#sexOrgan");
  renderCohortTable();
  renderCohortButtons();
  renderSampleGrid();
  renderModule2();
}

render();
