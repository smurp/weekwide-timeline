console.log('🔧 [WEEKWIDE-TIMELINE] Starting module...');

/**
 * weekwide-timeline - GitHub-style contribution graph web component
 * 
 * Features:
 * - Display year of data by default
 * - Configurable date ranges
 * - Horizontal (default) or vertical orientation
 * - Fixed size with scrolling OR full size
 * - Color intensity based on value
 * - Hover tooltips with date and value
 * - Click events for day selection
 */

class WeekwideTimelineWC extends HTMLElement {
  constructor() {
    super();
    console.log('🏗️ [WEEKWIDE-TIMELINE] Constructor called');
    this.attachShadow({ mode: 'open' });
    console.log('✅ [WEEKWIDE-TIMELINE] Shadow DOM attached');
    
    // Configuration
    this._orientation = 'horizontal'; // 'horizontal' | 'vertical'
    this._startDate = null; // null = auto (1 year ago)
    this._endDate = null;   // null = auto (today)
    this._fixedSize = false; // false = full size, true = scrollable
    this._cellSize = 12; // pixels
    this._cellGap = 3; // pixels
    this._showMonthLabels = true;
    this._showDayLabels = true;
    this._showLegend = true; // Show the "Less/More" legend
    this._verticalMonthLabels = true; // true = vertical text, false = horizontal
    this._colorScheme = 'green'; // 'green' | 'blue' | 'purple' | 'orange'
    
    // Data
    this._data = new Map(); // Map<'YYYY-MM-DD', number>
    
    // Computed
    this._weeks = [];
    this._maxValue = 0;
    
    console.log('✅ [WEEKWIDE-TIMELINE] State initialized');
  }
  
  // Properties
  get orientation() { return this._orientation; }
  set orientation(value) {
    if (['horizontal', 'vertical'].includes(value)) {
      this._orientation = value;
      this.render();
    }
  }
  
  get startDate() { return this._startDate; }
  set startDate(value) {
    this._startDate = value ? new Date(value) : null;
    this.computeWeeks();
    this.render();
  }
  
  get endDate() { return this._endDate; }
  set endDate(value) {
    this._endDate = value ? new Date(value) : null;
    this.computeWeeks();
    this.render();
  }
  
  get fixedSize() { return this._fixedSize; }
  set fixedSize(value) {
    this._fixedSize = !!value;
    this.render();
  }
  
  get cellSize() { return this._cellSize; }
  set cellSize(value) {
    this._cellSize = Math.max(8, Math.min(20, value));
    this.render();
  }
  
  get cellGap() { return this._cellGap; }
  set cellGap(value) {
    this._cellGap = Math.max(1, Math.min(10, value));
    this.render();
  }
  
  get colorScheme() { return this._colorScheme; }
  set colorScheme(value) {
    if (['green', 'blue', 'purple', 'orange', 'red'].includes(value)) {
      this._colorScheme = value;
      this.render();
    }
  }
  
  get showMonthLabels() { return this._showMonthLabels; }
  set showMonthLabels(value) {
    this._showMonthLabels = !!value;
    this.render();
  }
  
  get showDayLabels() { return this._showDayLabels; }
  set showDayLabels(value) {
    this._showDayLabels = !!value;
    this.render();
  }
  
  get showLegend() { return this._showLegend; }
  set showLegend(value) {
    this._showLegend = !!value;
    this.render();
  }
  
  get verticalMonthLabels() { return this._verticalMonthLabels; }
  set verticalMonthLabels(value) {
    this._verticalMonthLabels = !!value;
    this.render();
  }
  
  connectedCallback() {
    console.log('🔌 [WEEKWIDE-TIMELINE] connectedCallback');
    this.computeWeeks();
    this.render();
  }
  
  disconnectedCallback() {
    console.log('🔌 [WEEKWIDE-TIMELINE] disconnectedCallback');
  }
  
  /**
   * Set data for the timeline
   * @param {Object|Map} data - Either a Map or Object with 'YYYY-MM-DD' keys and numeric values
   */
  setData(data) {
    console.log('📊 [WEEKWIDE-TIMELINE] setData called');
    this._data.clear();
    this._maxValue = 0;
    
    if (data instanceof Map) {
      data.forEach((value, key) => {
        this._data.set(key, value);
        this._maxValue = Math.max(this._maxValue, value);
      });
    } else if (typeof data === 'object') {
      Object.entries(data).forEach(([key, value]) => {
        this._data.set(key, value);
        this._maxValue = Math.max(this._maxValue, value);
      });
    }
    
    console.log(`✅ [WEEKWIDE-TIMELINE] Loaded ${this._data.size} data points, max value: ${this._maxValue}`);
    this.computeWeeks();
    this.render();
  }
  
  /**
   * Add or update a single data point
   */
  setDataPoint(date, value) {
    const dateStr = this.formatDate(new Date(date));
    this._data.set(dateStr, value);
    this._maxValue = Math.max(this._maxValue, value);
    this.render();
  }
  
  /**
   * Clear all data
   */
  clearData() {
    this._data.clear();
    this._maxValue = 0;
    this.computeWeeks();
    this.render();
  }
  
  /**
   * Format date as YYYY-MM-DD
   */
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  /**
   * Get the start of the week (Sunday) for a given date
   */
  getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day; // Sunday is 0
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  
  /**
   * Compute weeks grid based on date range
   */
  computeWeeks() {
    console.log('📅 [WEEKWIDE-TIMELINE] computeWeeks');
    
    // Determine date range
    const end = this._endDate || new Date();
    const start = this._startDate || new Date(end.getFullYear() - 1, end.getMonth(), end.getDate());
    
    // Snap to week boundaries
    const startWeek = this.getWeekStart(start);
    const endWeek = this.getWeekStart(end);
    endWeek.setDate(endWeek.getDate() + 6); // Include full last week
    
    console.log(`📅 Date range: ${this.formatDate(startWeek)} to ${this.formatDate(endWeek)}`);
    
    // Build weeks array
    this._weeks = [];
    const currentWeek = new Date(startWeek);
    
    while (currentWeek <= endWeek) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(currentWeek);
        day.setDate(day.getDate() + i);
        
        if (day >= start && day <= end) {
          week.push({
            date: new Date(day),
            dateStr: this.formatDate(day),
            value: this._data.get(this.formatDate(day)) || 0
          });
        } else {
          week.push(null); // Empty cell
        }
      }
      this._weeks.push(week);
      currentWeek.setDate(currentWeek.getDate() + 7);
    }
    
    console.log(`✅ Computed ${this._weeks.length} weeks`);
  }
  
  /**
   * Get color for a value
   */
  getColor(value) {
    if (value === 0) return 'var(--cell-empty)';
    
    const intensity = Math.min(4, Math.ceil((value / this._maxValue) * 4));
    return `var(--cell-level-${intensity})`;
  }
  
  /**
   * Get month labels for the timeline - positioned at month centers
   */
  getMonthLabels() {
    const labels = [];
    const monthRanges = new Map(); // Map<monthYear, {startWeek, endWeek}>
    const cellTotal = this._cellSize + this._cellGap;
    const isHorizontal = this._orientation === 'horizontal';
    
    this._weeks.forEach((week, weekIndex) => {
      const firstDay = week.find(d => d !== null);
      if (firstDay) {
        const monthYear = `${firstDay.date.getFullYear()}-${firstDay.date.getMonth()}`;
        if (!monthRanges.has(monthYear)) {
          monthRanges.set(monthYear, { 
            startWeek: weekIndex, 
            endWeek: weekIndex,
            month: firstDay.date.toLocaleString('default', { month: 'short' })
          });
        } else {
          monthRanges.get(monthYear).endWeek = weekIndex;
        }
      }
    });
    
    // Convert to labels with center position
    // Horizontal needs forward shift, vertical doesn't
    const halfMonthShift = isHorizontal ? (2 * cellTotal) : 0;
    
    monthRanges.forEach(({ startWeek, endWeek, month }) => {
      // Position at the midpoint between start and end weeks
      const centerWeek = (startWeek + endWeek) / 2;
      // Add half a cell to center on cells, plus shift for horizontal only
      const centerPos = centerWeek * cellTotal + (cellTotal / 2) + halfMonthShift;
      
      labels.push({
        position: centerPos,
        month: month
      });
    });
    
    return labels;
  }
  
  /**
   * Handle cell click
   */
  handleCellClick(day) {
    if (!day) return;
    
    console.log('🖱️ [WEEKWIDE-TIMELINE] Cell clicked:', day.dateStr, day.value);
    
    this.dispatchEvent(new CustomEvent('day-selected', {
      detail: {
        date: day.dateStr,
        value: day.value,
        dateObject: day.date
      },
      bubbles: true,
      composed: true
    }));
  }
  
  /**
   * Get color level for scheme
   */
  getColorLevel(level) {
    const schemes = {
      green: ['#9be9a8', '#40c463', '#30a14e', '#216e39'],
      blue: ['#9db9f5', '#4078c0', '#2e5ea8', '#1e4a7a'],
      purple: ['#c5b3e6', '#9678d3', '#7048b5', '#4a2b8f'],
      orange: ['#ffcc80', '#ff9800', '#f57c00', '#e65100'],
      red: ['#ff9999', '#ff6666', '#ff3333', '#cc0000']
    };
    
    return schemes[this._colorScheme]?.[level - 1] || schemes.green[level - 1];
  }
  
  /**
   * Render the component
   */
  render() {
    console.log('🎨 [WEEKWIDE-TIMELINE] Rendering...');
    
    const isHorizontal = this._orientation === 'horizontal';
    const monthLabels = this.getMonthLabels();
    const dayLabels = isHorizontal 
      ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    // Calculate dimensions
    const cellTotal = this._cellSize + this._cellGap;
    
    // Calculate day labels width for proper alignment
    const dayLabelsWidth = this._showDayLabels && isHorizontal ? 40 : 0; // Approximate width of day labels column
    
    const containerClass = this._fixedSize ? 'fixed-size' : 'full-size';
    const orientationClass = `orient-${this._orientation}`;
    
    const dayLabelsHTML = this._showDayLabels ? `
      <div class="day-labels">
        ${dayLabels.map(label => `
          <div class="day-label">${label}</div>
        `).join('')}
      </div>
    ` : '';
    
    const monthLabelsContainer = this._showMonthLabels ? `
      <div class="month-labels" style="${isHorizontal ? `padding-left: ${dayLabelsWidth}px` : ''}">
        ${monthLabels.map(({ position, month }) => `
          <span class="month-label" style="${isHorizontal ? `left: ${position}px` : `top: ${position}px`}">${month}</span>
        `).join('')}
      </div>
    ` : '';
    
    const gridHTML = `
      <div class="timeline-grid">
        ${this._weeks.map((week, weekIndex) => 
          week.map(day => {
            if (!day) {
              return `<div class="timeline-cell empty"></div>`;
            }
            const color = this.getColor(day.value);
            const dateFormatted = day.date.toLocaleDateString('default', { 
              weekday: 'short', 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            });
            return `
              <div class="timeline-cell" 
                   style="background: ${color}"
                   data-date="${day.dateStr}"
                   data-value="${day.value}"
                   data-formatted="${dateFormatted}">
              </div>
            `;
          }).join('')
        ).join('')}
      </div>
    `;
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          --cell-empty: #ebedf0;
          --cell-level-1: ${this.getColorLevel(1)};
          --cell-level-2: ${this.getColorLevel(2)};
          --cell-level-3: ${this.getColorLevel(3)};
          --cell-level-4: ${this.getColorLevel(4)};
          --cell-border: #d1d5da;
          --label-color: #586069;
        }
        
        .timeline-container {
          padding: 20px;
          background: white;
          border-radius: 6px;
        }
        
        .timeline-container.fixed-size.orient-horizontal {
          max-width: 800px;
          overflow-x: auto;
          overflow-y: hidden;
        }
        
        .timeline-container.fixed-size.orient-vertical {
          max-height: 600px;
          overflow-y: auto;
          overflow-x: hidden;
        }
        
        .grid-wrapper {
          position: relative;
          display: inline-block;
        }
        
        .month-labels {
          position: relative;
        }
        
        .orient-horizontal .month-labels {
          height: 20px;
          margin-bottom: 8px;
        }
        
        .orient-vertical .month-labels {
          width: 40px;
          margin-left: 8px;
          margin-bottom: 0;
          height: 100%;
        }
        
        .month-label {
          position: absolute;
          font-size: 11px;
          color: var(--label-color);
          font-weight: 500;
          transform: translateX(-50%);
        }
        
        .orient-horizontal .month-label {
          /* Center horizontally */
          transform: translateX(-50%);
        }
        
        .orient-vertical .month-label {
          /* Center vertically */
          transform: translateY(-50%);
          ${this._verticalMonthLabels ? 'writing-mode: vertical-lr; transform: translateY(-50%) rotate(180deg);' : 'left: 4px;'}
        }
        
        .grid-container {
          display: flex;
          align-items: flex-start;
        }
        
        .orient-horizontal .grid-container {
          flex-direction: row;
        }
        
        .orient-vertical .grid-container {
          flex-direction: row;
        }
        
        .day-labels {
          display: flex;
        }
        
        .orient-horizontal .day-labels {
          flex-direction: column;
          margin-right: 8px;
        }
        
        .orient-vertical .day-labels {
          flex-direction: row;
          margin-bottom: 8px;
          position: absolute;
          top: -20px;
          left: 0;
        }
        
        .grid-with-labels {
          position: relative;
          padding-top: 20px;
        }
        
        .orient-horizontal .grid-with-labels {
          padding-top: 0;
        }
        
        .day-label {
          font-size: 10px;
          color: var(--label-color);
          text-align: right;
        }
        
        .orient-horizontal .day-label {
          height: ${cellTotal}px;
          line-height: ${cellTotal}px;
          padding-right: 4px;
        }
        
        .orient-vertical .day-label {
          width: ${cellTotal}px;
          text-align: center;
          padding-top: 2px;
        }
        
        .timeline-grid {
          display: grid;
          gap: ${this._cellGap}px;
        }
        
        .orient-horizontal .timeline-grid {
          grid-template-columns: repeat(${this._weeks.length}, ${this._cellSize}px);
          grid-template-rows: repeat(7, ${this._cellSize}px);
          grid-auto-flow: column;
        }
        
        .orient-vertical .timeline-grid {
          grid-template-columns: repeat(7, ${this._cellSize}px);
          grid-template-rows: repeat(${this._weeks.length}, ${this._cellSize}px);
          grid-auto-flow: row;
        }
        
        .timeline-cell {
          width: ${this._cellSize}px;
          height: ${this._cellSize}px;
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.1s ease;
          position: relative;
        }
        
        .timeline-cell:hover {
          outline: 2px solid rgba(0, 0, 0, 0.3);
          outline-offset: -1px;
          transform: scale(1.1);
          z-index: 10;
        }
        
        .timeline-cell.empty {
          background: transparent;
          cursor: default;
        }
        
        .timeline-cell.empty:hover {
          outline: none;
          transform: none;
        }
        
        .tooltip {
          position: fixed;
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 12px;
          pointer-events: none;
          z-index: 1000;
          white-space: nowrap;
          display: none;
        }
        
        .tooltip.visible {
          display: block;
        }
        
        .legend {
          display: flex;
          align-items: center;
          margin-top: 16px;
          font-size: 11px;
          color: var(--label-color);
          gap: 4px;
        }
        
        .legend-cell {
          width: 10px;
          height: 10px;
          border-radius: 2px;
          margin: 0 2px;
        }
      </style>
      <div class="timeline-container ${containerClass} ${orientationClass}">
        <div class="grid-wrapper">
          ${isHorizontal ? monthLabelsContainer : ''}
          <div class="grid-container">
            ${isHorizontal ? dayLabelsHTML : ''}
            <div class="grid-with-labels">
              ${!isHorizontal ? dayLabelsHTML : ''}
              ${gridHTML}
            </div>
            ${!isHorizontal ? monthLabelsContainer : ''}
          </div>
        </div>
        ${this._showLegend ? `
        <div class="legend">
          <span>Less</span>
          <div class="legend-cell" style="background: var(--cell-empty)"></div>
          <div class="legend-cell" style="background: var(--cell-level-1)"></div>
          <div class="legend-cell" style="background: var(--cell-level-2)"></div>
          <div class="legend-cell" style="background: var(--cell-level-3)"></div>
          <div class="legend-cell" style="background: var(--cell-level-4)"></div>
          <span>More</span>
        </div>
        ` : ''}
      </div>
      <div class="tooltip" id="tooltip"></div>
    `;
    
    this.attachEventListeners();
    
    console.log('✅ [WEEKWIDE-TIMELINE] Render complete');
  }
  
  /**
   * Attach event listeners
   */
  attachEventListeners() {
    const cells = this.shadowRoot.querySelectorAll('.timeline-cell:not(.empty)');
    const tooltip = this.shadowRoot.getElementById('tooltip');
    
    cells.forEach(cell => {
      cell.addEventListener('click', () => {
        const date = cell.dataset.date;
        const value = parseInt(cell.dataset.value, 10);
        this.handleCellClick({ dateStr: date, value, date: new Date(date) });
      });
      
      cell.addEventListener('mouseenter', (e) => {
        const formatted = cell.dataset.formatted;
        const value = cell.dataset.value;
        tooltip.textContent = `${formatted}: ${value} contribution${value !== '1' ? 's' : ''}`;
        tooltip.classList.add('visible');
        this.positionTooltip(e, tooltip);
      });
      
      cell.addEventListener('mousemove', (e) => {
        this.positionTooltip(e, tooltip);
      });
      
      cell.addEventListener('mouseleave', () => {
        tooltip.classList.remove('visible');
      });
    });
  }
  
  /**
   * Position tooltip near cursor
   */
  positionTooltip(e, tooltip) {
    const x = e.clientX + 10;
    const y = e.clientY - 30;
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
  }
}

console.log('🔧 [WEEKWIDE-TIMELINE] Defining custom element...');
customElements.define('weekwide-timeline', WeekwideTimelineWC);
console.log('✅ [WEEKWIDE-TIMELINE] Custom element registered');

export default WeekwideTimelineWC;