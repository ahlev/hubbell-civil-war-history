/* ─── Cinematic Play Mode for Map That Moves ─── */
/* Self-contained IIFE — injects CSS, UI, and animation loop */

window.CinematicPlayer = (function () {
  'use strict';

  /* ── Configuration ── */
  const SPEEDS = {
    slow:   { ms: 200, step: 1, label: 'Slow' },
    normal: { ms: 80,  step: 1, label: 'Normal' },
    fast:   { ms: 30,  step: 3, label: 'Fast' }
  };
  const DEFAULT_SPEED = 'normal';

  /* ── Waypoints ── */
  // day = integer offset from START_DATE (June 15, 1861). Day 0 = June 15.
  const WAYPOINTS = [
    // ── 1861 — The Beginning ──
    {
      id: 'henry-musters',
      day: 0,
      title: 'Henry Musters In',
      body: 'Henry Hubbell is the first of four brothers to step forward. He joins the 34th New York Volunteer Infantry at Albany — among the earliest regiments to answer Lincoln\'s call after Fort Sumter. He is twenty-three years old, a farmer\'s son from St. Lawrence County. By nightfall he wears Union blue.',
      quote: null,
      quoteCite: null,
      letterId: 'LTR-1861-06-06-001',
      brothers: ['henry'],
      fly: { lat: 42.65, lon: -73.75, zoom: 8 },
      pause: 8000,
      category: 'enlist'
    },
    {
      id: 'james-west-point',
      day: 18,
      title: 'James Enters West Point',
      body: 'Two weeks after Henry musters in as a private, his younger brother James reports to the United States Military Academy at West Point. James will spend a year training as an officer while Henry marches south. Two brothers in the war, two very different paths — one through the barracks, one through the academy.',
      quote: null,
      quoteCite: null,
      letterId: 'LTR-1861-08-06-001',
      brothers: ['james'],
      fly: { lat: 41.39, lon: -73.95, zoom: 9 },
      pause: 7000,
      category: 'enlist'
    },
    {
      id: 'bull-run',
      day: 36,
      title: 'The Guns of Bull Run',
      body: 'Henry is stationed near Washington when the first major battle erupts at Manassas. He doesn\'t fight — but he hears it. The thunder of artillery rolls across twenty-eight miles of Virginia countryside. The Union rout sends panicked civilians and soldiers streaming back into the capital. Henry writes home, his first brush with the reality of what this war will become.',
      quote: 'Can here cannons firing not over twenty-eight miles from here.',
      quoteCite: 'Henry, July 21, 1861',
      letterId: 'LTR-1861-07-21-001',
      brothers: ['henry'],
      fly: { lat: 38.81, lon: -77.52, zoom: 9 },
      pause: 10000,
      category: 'battle'
    },
    {
      id: 'alexander-enlists',
      day: 92,
      title: 'Alexander Enlists',
      body: 'Three months after Henry, the second Hubbell brother answers the call. Alexander musters into the 60th New York at Ogdensburg, on the Canadian border. He is younger, sharper-tongued, and a better writer than Henry. His first letter home crackles with the shock of barracks life — the noise, the strangers, the sudden loss of everything familiar.',
      quote: 'Here I am safe and sound in the barracks. Ah! what a bedlam!',
      quoteCite: 'Alexander, September 20, 1861',
      letterId: 'LTR-1861-09-20-001',
      brothers: ['alexander'],
      fly: { lat: 44.69, lon: -75.49, zoom: 8 },
      pause: 8000,
      category: 'enlist'
    },
    // ── 1862 — The Crucible ──
    {
      id: 'winter-potomac',
      day: 170,
      title: 'Winter on the Potomac',
      body: 'Henry\'s 34th New York spends the winter at Seneca Mills on the Potomac, picketing the river crossing in freezing mud. Months of drilling, boredom, and homesickness. Henry writes of camp life, of longing for his mother\'s cooking, of watching the Confederates across the water. The army waits for spring and a plan that never seems to come.',
      quote: null,
      quoteCite: null,
      letterId: 'LTR-1861-11-30-001',
      brothers: ['henry'],
      fly: { lat: 39.07, lon: -77.34, zoom: 9 },
      pause: 7000,
      category: 'turning_point'
    },
    {
      id: 'peninsula-opens',
      day: 295,
      title: 'The Peninsula Campaign',
      body: 'McClellan\'s grand plan: bypass the Confederate army and take Richmond by sea. Henry\'s regiment ships south to the Virginia Peninsula and besieges Yorktown — the same ground where Washington won the Revolution eighty years before. For Henry, the war finally moves. Weeks of muddy siege trenches, but the sense that something decisive is coming.',
      quote: null,
      quoteCite: null,
      letterId: 'LTR-1862-04-06-001',
      brothers: ['henry'],
      fly: { lat: 37.24, lon: -76.51, zoom: 9 },
      pause: 8000,
      category: 'battle'
    },
    {
      id: 'fair-oaks',
      day: 351,
      title: 'Fair Oaks',
      body: 'Henry sees real combat for the first time. The Battle of Fair Oaks — a bloody, confused draw in the swamps east of Richmond. Confederate General Johnston is wounded; Robert E. Lee takes command. For Henry, the abstract idea of war becomes the sound of musketry and the sight of friends falling. Nothing in his letters from St. Lawrence County prepared him for this.',
      quote: null,
      quoteCite: null,
      letterId: 'LTR-1862-05-31-001',
      brothers: ['henry'],
      fly: { lat: 37.51, lon: -77.31, zoom: 10 },
      pause: 8000,
      category: 'battle'
    },
    {
      id: 'seven-days',
      day: 376,
      title: 'The Seven Days',
      body: 'Lee attacks. For seven straight days the Union army fights and retreats toward the James River, abandoning the drive on Richmond. Henry\'s regiment is in the thick of it — Mechanicsville, Gaines\' Mill, Malvern Hill. These are Henry\'s last active campaign letters. The chaos of retreat, the exhaustion, the growing sense that this war will not be short.',
      quote: null,
      quoteCite: null,
      letterId: 'LTR-1862-06-22-001',
      brothers: ['henry'],
      fly: { lat: 37.39, lon: -77.25, zoom: 9 },
      pause: 8000,
      category: 'battle'
    },
    {
      id: 'charles-enlists',
      day: 449,
      title: 'Charles Enlists',
      body: 'September 1862. A third Hubbell brother joins the war. Charles musters into the 153rd New York at Plattsburgh Barracks. He is near-sighted — the army doctor nearly rejects him — but an advocate convinces the examiner, and Charles passes. Within a week he is promoted to 1st Corporal. His first letter home is vivid and blunt: the barracks, the hard cases, the swearing.',
      quote: 'Nearly every man swears. There are a good many hard cases.',
      quoteCite: 'Charles to his mother, September 9, 1862',
      letterId: 'LTR-1862-09-09-001',
      brothers: ['charles'],
      fly: { lat: 44.70, lon: -73.45, zoom: 9 },
      pause: 8000,
      category: 'enlist'
    },
    {
      id: 'antietam',
      day: 460,
      title: 'The Bloodiest Day',
      body: 'September 17, 1862. Antietam Creek, Maryland. The single bloodiest day in American history — 23,000 casualties before nightfall. Henry\'s 34th New York charges across the cornfield. Henry Hubbell is killed. He is twenty-four. The family will not learn for weeks, then months of agonized uncertainty, conflicting reports, desperate letters to anyone who might have seen him fall.',
      quote: 'I think there is not the least doubt that Henry was killed.',
      quoteCite: 'Charles, writing to the family after Antietam',
      letterId: 'LTR-1862-09-19-001',
      brothers: ['henry', 'alexander'],
      fly: { lat: 39.47, lon: -77.74, zoom: 10 },
      pause: 14000,
      category: 'death'
    },
    {
      id: 'reunion-letter',
      day: 523,
      title: 'The Reunion Letter',
      body: 'Alexander writes what may be the most haunting letter in the entire collection. Two months after Antietam, he puts to paper a memory — a moonlit night before the battle when he found Henry alive in camp. The brothers embraced. They didn\'t know it was the last time. Alexander writes this knowing Henry is already dead. The letter trembles between memory and elegy.',
      quote: 'A large bearded man stepped out from one of the tents. It was Henry.',
      quoteCite: 'Alexander, November 19, 1862',
      letterId: 'LTR-1862-11-19-001',
      brothers: ['alexander', 'henry'],
      fly: { lat: 39.47, lon: -77.74, zoom: 10 },
      pause: 14000,
      category: 'turning_point'
    },
    {
      id: 'fredericksburg',
      day: 547,
      title: 'Fredericksburg',
      body: 'December 1862. Burnside orders wave after wave of Union troops across the Rappahannock and up Marye\'s Heights into withering Confederate fire. Alexander\'s 60th New York is in the field. The slaughter is senseless and total. The war enters its darkest winter — Henry dead, Fredericksburg lost, no end in sight.',
      quote: null,
      quoteCite: null,
      letterId: 'LTR-1862-12-09-002',
      brothers: ['alexander'],
      fly: { lat: 38.30, lon: -77.47, zoom: 10 },
      pause: 8000,
      category: 'battle'
    },
    // ── 1863 — The Turning ──
    {
      id: 'headboard',
      day: 671,
      title: 'The Headboard',
      body: 'Spring 1863, and Alexander still clings to hope. Months after Antietam, the family writes letters to hospitals, to officers, to anyone who served beside Henry. No one can confirm they saw him dead on the field. The ambiguity is a kind of torture — grief suspended, unable to close. Alexander asks about a headboard marking Henry\'s grave. None has been found.',
      quote: 'It is singular that we can hear of no one who saw him dead upon the field.',
      quoteCite: 'Alexander, April 16, 1863',
      letterId: 'LTR-1863-04-16-001',
      brothers: ['alexander'],
      fly: { lat: 39.47, lon: -77.74, zoom: 10 },
      pause: 12000,
      category: 'turning_point'
    },
    {
      id: 'chancellorsville',
      day: 686,
      title: 'Chancellorsville',
      body: 'Lee\'s masterpiece. Hooker\'s grand flanking maneuver collapses when Stonewall Jackson\'s corps tears through the Union right. Alexander\'s 60th New York is engaged in the fighting. The regiment suffers seventy-three casualties. Another Union defeat in Virginia, another retreat across the Rappahannock. But Alexander survives.',
      quote: null,
      quoteCite: null,
      letterId: 'LTR-1863-05-06-001',
      brothers: ['alexander'],
      fly: { lat: 38.31, lon: -77.63, zoom: 10 },
      pause: 7000,
      category: 'battle'
    },
    {
      id: 'gettysburg',
      day: 750,
      title: 'Gettysburg',
      body: 'Alexander writes on Independence Day, July 4, 1863, while the army buries the dead from three days of carnage at Gettysburg. He is alive. He thanks God. Then the army marches south — toward Maryland, toward the place where Henry fell ten months ago. Alexander may be walking toward his brother\'s unmarked grave.',
      quote: 'God has again in his great kindness preserved my life.',
      quoteCite: 'Alexander, July 4, 1863',
      letterId: 'LTR-1863-07-04-001',
      brothers: ['alexander'],
      fly: { lat: 39.81, lon: -77.23, zoom: 10 },
      pause: 12000,
      category: 'battle'
    },
    {
      id: 'war-shifts-west',
      day: 850,
      title: 'The War Shifts West',
      body: 'October 1863. Alexander\'s XI Corps has boarded trains for Tennessee — a thousand miles of railroad, the longest troop movement of the war. The map zooms out. This war is no longer a Virginia affair. Alexander has left the fields where Henry died and moved into an entirely different theater. The scale of the conflict becomes staggering.',
      quote: null,
      quoteCite: null,
      letterId: 'LTR-1863-10-11-001',
      brothers: ['alexander'],
      fly: { lat: 36.5, lon: -82.0, zoom: 6 },
      pause: 8000,
      category: 'turning_point'
    },
    {
      id: 'wauhatchie',
      day: 866,
      title: 'Wauhatchie',
      body: 'A night battle in the Tennessee mountains, October 28. Alexander fights in the dark — moonlight, muzzle flashes, confusion. Lieutenant Colonel Greene is wounded beside him. General Geary\'s own son is killed. The chaos of combat at night is unlike anything Alexander has experienced. He writes of it with the controlled detail of a man learning to survive.',
      quote: null,
      quoteCite: null,
      letterId: 'LTR-1863-10-31-001',
      brothers: ['alexander'],
      fly: { lat: 35.02, lon: -85.37, zoom: 10 },
      pause: 7000,
      category: 'battle'
    },
    {
      id: 'lookout-mountain',
      day: 893,
      title: 'Lookout Mountain',
      body: 'November 24, 1863 — the "Battle Above the Clouds." Alexander storms Lookout Mountain outside Chattanooga and is wounded. A minie ball or shell fragment, close enough to kill. He survives, but the wound will mark him for the rest of his life. He writes home with characteristic understatement.',
      quote: 'I was wounded at the storming of Lookout Mountain. Rather a close call for my life.',
      quoteCite: 'Alexander, December 1, 1863',
      letterId: 'LTR-1863-12-01-001',
      brothers: ['alexander'],
      fly: { lat: 35.01, lon: -85.34, zoom: 11 },
      pause: 10000,
      category: 'battle'
    },
    // ── 1864 — The Grind ──
    {
      id: 'brothers-apart',
      day: 1012,
      title: 'A Thousand Miles Apart',
      body: 'Look at the map. Charles and James are deep in Louisiana with the 153rd New York, marching up the Red River toward Sabine Cross Roads. Alexander is in northern Alabama, regrouping with Sherman\'s forces at Stevenson. Three surviving Hubbell brothers — two in the bayou, one in the Tennessee Valley — scattered across the breadth of the Confederacy. The war has become continental.',
      quote: null,
      quoteCite: null,
      letterId: 'LTR-1864-03-21-001',
      brothers: ['charles', 'alexander', 'james'],
      fly: { lat: 33.0, lon: -87.0, zoom: 5 },
      pause: 9000,
      category: 'turning_point'
    },
    {
      id: 'sabine-cross-roads',
      day: 1028,
      title: 'Sabine Cross Roads',
      body: 'April 8, 1864. Charles\'s 153rd New York is bloodied in western Louisiana. The Red River Campaign — Banks\'s attempt to seize Confederate cotton country — is a disaster. The regiment is ambushed at Sabine Cross Roads and badly mauled. Charles survives, but the experience hardens him. The 153rd will never fully recover its strength.',
      quote: null,
      quoteCite: null,
      letterId: 'LTR-1864-04-15-001',
      brothers: ['charles'],
      fly: { lat: 31.79, lon: -93.56, zoom: 9 },
      pause: 7000,
      category: 'battle'
    },
    {
      id: 'eve-of-atlanta',
      day: 1048,
      title: 'Eve of Atlanta',
      body: 'Alexander senses the war reaching its climax. Sherman\'s armies — a hundred thousand men — are pressing south through the Georgia mountains toward Atlanta. The letters from this period pulse with grim determination. Alexander knows this campaign will decide the war, and possibly the November election. Lincoln\'s presidency hangs on Atlanta\'s fall.',
      quote: 'It is the death struggle of this mighty rebellion.',
      quoteCite: 'Alexander, April 28, 1864',
      letterId: 'LTR-1864-04-28-001',
      brothers: ['alexander'],
      fly: { lat: 34.75, lon: -84.39, zoom: 8 },
      pause: 10000,
      category: 'turning_point'
    },
    {
      id: 'atlanta-campaign',
      day: 1131,
      title: 'The Gates of Atlanta',
      body: 'July 1864. Alexander is in the trenches outside Atlanta. Weeks of relentless fighting — daily skirmishing, sharpshooters, artillery exchanges. The armies entrench and maneuver. Men die every day for a few hundred yards of Georgia red clay. Alexander has been in the field for nearly three years. The city must fall.',
      quote: null,
      quoteCite: null,
      letterId: 'LTR-1864-07-24-001',
      brothers: ['alexander'],
      fly: { lat: 33.75, lon: -84.39, zoom: 10 },
      pause: 8000,
      category: 'battle'
    },
    {
      id: 'three-brothers-hospital',
      day: 1172,
      title: 'Three Brothers in Hospital',
      body: 'August 1864. Alexander, Charles, and James are all wounded or ill simultaneously — three Hubbell brothers in hospital at the same time, scattered across different states. Alexander is outside Atlanta, Charles at Harpers Ferry, James in Baltimore. Alexander writes home to their mother with dark humor, refusing to let the absurdity of it break him.',
      quote: 'Please excuse me, Mother, but I did have a hearty laugh\u2026',
      quoteCite: 'Alexander to his mother, August 30, 1864',
      letterId: 'LTR-1864-08-30-001',
      brothers: ['alexander', 'charles', 'james'],
      fly: { lat: 37.0, lon: -80.0, zoom: 5 },
      pause: 10000,
      category: 'turning_point'
    },
    {
      id: 'cedar-creek',
      day: 1223,
      title: 'Cedar Creek',
      body: 'October 19, 1864. Before dawn, Jubal Early\'s Confederates attack the sleeping Union camp at Cedar Creek in the Shenandoah Valley. James\'s company is overrun in the chaos. James is wounded. His company is decimated — most of the men he trained with are killed or captured. Sheridan\'s famous ride rallies the army, but for James the damage is done. Remember this date.',
      quote: 'James exclaimed, "The Rebs are here!"',
      quoteCite: 'Witness account, October 22, 1864',
      letterId: 'LTR-1864-10-22-001',
      brothers: ['james'],
      fly: { lat: 39.03, lon: -78.36, zoom: 10 },
      pause: 12000,
      category: 'battle'
    },
    {
      id: 'nashville',
      day: 1280,
      title: 'Nashville',
      body: 'December 15, 1864. Alexander\'s last major battle. George Thomas — the "Rock of Chickamauga" — destroys Hood\'s Confederate Army of Tennessee at Nashville. It is the most complete Union victory of the war. The western Confederacy is shattered. Alexander has fought from Virginia to Tennessee to Georgia and back. Three years in the field.',
      quote: null,
      quoteCite: null,
      letterId: 'LTR-1864-12-12-001',
      brothers: ['alexander'],
      fly: { lat: 36.17, lon: -86.78, zoom: 10 },
      pause: 8000,
      category: 'battle'
    },
    // ── 1865 — The End ──
    {
      id: 'lee-surrenders',
      day: 1394,
      title: 'Lee Surrenders',
      body: 'April 9, 1865. Appomattox Court House, Virginia. Robert E. Lee surrenders the Army of Northern Virginia to Ulysses S. Grant. After four years of war — 620,000 dead, a nation torn apart and stitched back together with blood — the guns fall silent. Alexander is still in the field at Chattanooga when the news arrives.',
      quote: 'After four years of unparalleled struggling we stand a free and united nation.',
      quoteCite: 'Alexander, April 1865',
      letterId: null,
      brothers: ['alexander'],
      fly: { lat: 37.38, lon: -78.80, zoom: 7 },
      pause: 12000,
      category: 'turning_point'
    },
    {
      id: 'grand-review',
      day: 1438,
      title: 'The Grand Review',
      body: 'May 23\u201324, 1865. Two hundred thousand soldiers march through Washington one final time — down Pennsylvania Avenue, past the reviewing stand, past the Capitol dome that was still under construction when they enlisted. The armies that saved the Union parade in the spring sunshine, then dissolve. Men who have not been civilians for years put down their rifles and walk home.',
      quote: null,
      quoteCite: null,
      letterId: 'LTR-1865-06-12-001',
      brothers: ['alexander'],
      fly: { lat: 38.89, lon: -77.01, zoom: 10 },
      pause: 10000,
      category: 'homecoming'
    },
    {
      id: 'james-dies',
      day: 1505,
      title: 'The Cost',
      body: 'The war is over. Alexander has mustered out at Ogdensburg and gone home. Charles is still in Savannah, waiting for discharge. And James — James never makes it back. On October 19, 1865, exactly one year to the day after Cedar Creek shattered his company and left him wounded, James Hubbell dies en route home. No letter survives from his last days. Of four Hubbell brothers who served, two do not return. Henry fell at Antietam. James fell to what came after. The silence in the archive where their voices should be is the loudest thing in it.',
      quote: null,
      quoteCite: null,
      letterId: null,
      brothers: ['alexander', 'charles', 'james'],
      fly: { lat: 38.0, lon: -78.0, zoom: 5 },
      pause: 18000,
      category: 'death'
    }
  ];

  /* ── State ── */
  let _playing = false;
  let _paused = false;        // paused at waypoint (card showing)
  let _cardFrozen = false;    // card timer frozen by user (Space/pause button)
  let _letterOpen = false;    // letter overlay is open — freeze timer
  let _speed = DEFAULT_SPEED;
  let _interval = null;
  let _wpIndex = 0;           // next waypoint to check
  let _resumeTimer = null;    // auto-resume timeout
  let _resumeStart = 0;       // timestamp when resume timer started
  let _resumeRemaining = 0;   // ms remaining when paused for letter
  let _cardEl = null;         // narrative card DOM
  let _playBtnEl = null;      // play button injected into slider-row
  let _speedBtnEl = null;     // speed label next to play button
  let _flyingToWaypoint = false; // true during waypoint flyTo (suppress auto-viewport)

  /* ── CSS Injection ── */
  function _injectCSS() {
    const style = document.createElement('style');
    style.textContent = `
/* ── Play button — matches existing .step-btn style ── */
.cine-play-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid var(--rule);
  background: #FAFAFA;
  color: var(--ink);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s, border-color 0.15s, transform 0.1s;
  user-select: none;
}
.cine-play-btn:hover { background: #F0ECE7; border-color: #CCC; }
.cine-play-btn:active { transform: scale(0.92); }
.cine-play-btn svg { width: 16px; height: 16px; fill: currentColor; stroke: none; }
.cine-speed-label {
  font-family: var(--font-body, 'Inter', sans-serif);
  font-size: 0.6rem;
  font-weight: 600;
  color: var(--ink-3, #999);
  cursor: pointer;
  user-select: none;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex-shrink: 0;
  min-width: 28px;
  text-align: center;
}
.cine-speed-label:hover { color: var(--ink, #222); }

/* ── Smooth marker transitions during cinematic play ── */
.cine-smooth-markers .leaflet-marker-icon {
  transition: transform 0.3s ease-out;
}

/* ── Narrative Card — bottom-left, out of map center ── */
.cine-card {
  position: absolute;
  bottom: 24px;
  left: 20px;
  z-index: 1200;
  max-width: 380px;
  width: calc(100% - 40px);
  background: rgba(36, 36, 36, 0.94);
  color: #F5F0E8;
  border-radius: 8px;
  padding: 18px 22px 14px;
  font-family: var(--font-body, 'Inter', sans-serif);
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.4s, transform 0.4s;
  pointer-events: none;
  max-height: calc(100% - 100px);
  overflow-y: auto;
}
.cine-card.visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}
.cine-card-category {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #B8860B;
  margin-bottom: 6px;
}
.cine-card-category.death { color: #C75050; }
.cine-card-category.enlist { color: #5A9BD5; }
.cine-card-category.homecoming { color: #6BAF6B; }
.cine-card-category.turning_point { color: #D4A843; }
.cine-card-category.silence { color: #999; }
.cine-card-title {
  font-family: var(--font-display, 'Source Serif 4', serif);
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 8px;
  line-height: 1.25;
}
.cine-card-body {
  font-size: 0.85rem;
  line-height: 1.55;
  margin-bottom: 10px;
  color: #D8D0C4;
}
.cine-card-quote {
  font-family: var(--font-display, 'Source Serif 4', serif);
  font-style: italic;
  font-size: 0.9rem;
  line-height: 1.5;
  padding: 8px 14px;
  border-left: 3px solid rgba(184,134,11,0.5);
  margin-bottom: 6px;
  color: #EDE6D6;
}
.cine-card-cite {
  font-size: 0.72rem;
  color: #998C7C;
  text-align: right;
  margin-bottom: 12px;
}
.cine-card-close {
  position: absolute;
  top: 8px;
  right: 12px;
  background: none;
  border: none;
  color: #998C7C;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}
.cine-card-close:hover { color: #F5F0E8; }
.cine-resume-bar {
  height: 3px;
  background: rgba(255,255,255,0.15);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 10px;
}
.cine-resume-fill {
  height: 100%;
  width: 100%;
  background: rgba(184,134,11,0.7);
  transform-origin: left;
}
.cine-card-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}
.cine-btn {
  padding: 5px 14px;
  border-radius: 4px;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.08);
  color: #F5F0E8;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}
.cine-btn:hover { background: rgba(255,255,255,0.15); }
.cine-btn-letter {
  margin-left: auto;
  border-color: rgba(184,134,11,0.4);
  color: #D4A843;
}
.cine-btn-letter:hover { background: rgba(184,134,11,0.15); }

/* ── Brother Pulse Animation ── */
@keyframes cine-pulse {
  0%   { box-shadow: 0 0 0 0 var(--pulse-color, rgba(184,134,11,0.6)); }
  50%  { box-shadow: 0 0 0 12px var(--pulse-color, rgba(184,134,11,0)); }
  100% { box-shadow: 0 0 0 0 var(--pulse-color, rgba(184,134,11,0)); }
}
.cine-pulsing .node-pin {
  animation: cine-pulse 1.2s ease-out 3;
}

/* ── Mobile ── */
@media (max-width: 768px) {
  .cine-card { max-width: calc(100% - 24px); left: 12px; bottom: 16px; padding: 14px 16px 12px; }
  .cine-card-title { font-size: 1.05rem; }
  .cine-card-body { font-size: 0.8rem; }
  .cine-play-btn { width: 34px; height: 34px; }
  .cine-speed-label { font-size: 0.55rem; }
}
@media (max-width: 600px) {
  .cine-play-btn { width: 30px; height: 30px; }
  .cine-speed-label { display: none; }
  .cine-card { left: 8px; bottom: 10px; padding: 12px 12px 10px; max-width: calc(100% - 16px); }
}
`;
    document.head.appendChild(style);
  }

  /* ── UI: Inject play button into existing slider-row ── */
  function _injectPlayButton() {
    var sliderRow = document.querySelector('.slider-row');
    if (!sliderRow) return;

    // Play button — insert before the step-back button
    _playBtnEl = document.createElement('button');
    _playBtnEl.className = 'cine-play-btn step-btn';
    _playBtnEl.id = 'cinePlayBtn';
    _playBtnEl.title = 'Play cinematic mode (Space)';
    _playBtnEl.setAttribute('aria-label', 'Play cinematic mode');
    _playBtnEl.innerHTML = '<svg viewBox="0 0 24 24"><polygon points="8,5 19,12 8,19" fill="currentColor"/></svg>';
    sliderRow.insertBefore(_playBtnEl, sliderRow.firstChild);

    // Speed label — insert after play button, cycles on click
    _speedBtnEl = document.createElement('span');
    _speedBtnEl.className = 'cine-speed-label';
    _speedBtnEl.textContent = SPEEDS[_speed].label;
    _speedBtnEl.title = 'Click to change speed';
    _playBtnEl.after(_speedBtnEl);

    // Event listeners
    _playBtnEl.addEventListener('click', toggle);
    _speedBtnEl.addEventListener('click', _cycleSpeed);
  }

  /* ── UI: Narrative Card ── */
  function _buildCard() {
    const mapContainer = document.getElementById('mapContainer');
    if (!mapContainer) return;

    _cardEl = document.createElement('div');
    _cardEl.className = 'cine-card';
    _cardEl.innerHTML = `
      <button class="cine-card-close" title="Close">&times;</button>
      <div class="cine-card-category"></div>
      <div class="cine-card-title"></div>
      <div class="cine-card-body"></div>
      <div class="cine-card-quote" style="display:none"></div>
      <div class="cine-card-cite" style="display:none"></div>
      <div class="cine-resume-bar"><div class="cine-resume-fill"></div></div>
      <div class="cine-card-actions">
        <button class="cine-btn cine-btn-pause">Pause</button>
        <button class="cine-btn cine-btn-continue">Continue</button>
        <button class="cine-btn cine-btn-letter" style="display:none">Read the letter &rarr;</button>
      </div>
    `;
    mapContainer.appendChild(_cardEl);

    // Close button — same as continue
    _cardEl.querySelector('.cine-card-close').addEventListener('click', function () {
      _hideCard();
      _resumeAfterWaypoint();
    });

    // Pause button — freezes auto-resume timer, toggles to Resume
    _cardEl.querySelector('.cine-btn-pause').addEventListener('click', function () {
      var btn = this;
      if (btn.textContent === 'Pause') {
        _cardFrozen = true;
        _freezeResumeTimer();
        btn.textContent = 'Resume';
        _updatePlayBtn(false);
      } else {
        _cardFrozen = false;
        _unfreezeResumeTimer();
        btn.textContent = 'Pause';
        _updatePlayBtn(true);
      }
    });

    // Continue button — skip waypoint and advance
    _cardEl.querySelector('.cine-btn-continue').addEventListener('click', function () {
      _hideCard();
      // Reset pause button text for next waypoint
      var pauseBtn = _cardEl.querySelector('.cine-btn-pause');
      if (pauseBtn) pauseBtn.textContent = 'Pause';
      _resumeAfterWaypoint();
    });
  }

  /* ── Play / Pause / Stop ── */
  function toggle() {
    if (!_playing) {
      // Not playing → start from current slider position
      play();
    } else if (_paused) {
      // Waypoint card is showing → toggle its timer
      if (_cardFrozen) {
        _cardFrozen = false;
        _unfreezeResumeTimer();
        var pauseBtn = _cardEl ? _cardEl.querySelector('.cine-btn-pause') : null;
        if (pauseBtn) pauseBtn.textContent = 'Pause';
        _updatePlayBtn(true);
      } else {
        _cardFrozen = true;
        _freezeResumeTimer();
        var pauseBtn = _cardEl ? _cardEl.querySelector('.cine-btn-pause') : null;
        if (pauseBtn) pauseBtn.textContent = 'Resume';
        _updatePlayBtn(false);
      }
    } else {
      // Ticking (no card) → full stop
      stop();
    }
  }

  function play() {
    if (_playing) return;

    // Start from current slider position
    var startDay = (typeof currentDay !== 'undefined') ? currentDay : 0;
    var td = (typeof TOTAL_DAYS !== 'undefined') ? TOTAL_DAYS : 1508;

    // If at the very end, reset to beginning (replay)
    if (startDay >= td) {
      startDay = 0;
      rangeEndDay = 0;
      currentDay = 0;
      if (typeof updateToDate === 'function') updateToDate(0);
    }

    _playing = true;
    _paused = false;
    _letterOpen = false;

    // Find first waypoint at or after the current slider position
    _recalcWaypoints(startDay);

    // Hide existing narrative caption
    var caption = document.getElementById('narrativeCaption');
    if (caption) caption.classList.remove('visible');

    // Enable smooth marker transitions
    var mapContainer = document.getElementById('mapContainer');
    if (mapContainer) mapContainer.classList.add('cine-smooth-markers');

    _updatePlayBtn(true);
    _fadeCta();
    _startInterval();
  }

  function stop() {
    _playing = false;
    _paused = false;
    _letterOpen = false;
    _flyingToWaypoint = false;
    _clearTimers();
    _hideCard();
    _updatePlayBtn(false);
    _syncUrl();

    // Remove smooth marker transitions
    var mapContainer = document.getElementById('mapContainer');
    if (mapContainer) mapContainer.classList.remove('cine-smooth-markers');

    // Restore normal narrative caption
    if (typeof updateNarrative === 'function' && typeof currentDay !== 'undefined') {
      var d = typeof dayToDate === 'function' ? dayToDate(currentDay) : null;
      if (d && typeof dateStr === 'function') updateNarrative(dateStr(d));
    }
  }

  function _startInterval() {
    _clearTimers();
    var s = SPEEDS[_speed];
    _interval = setInterval(_tick, s.ms);
  }

  function _clearTimers() {
    if (_interval) { clearInterval(_interval); _interval = null; }
    if (_resumeTimer) { clearTimeout(_resumeTimer); _resumeTimer = null; }
  }

  /* ── Tick ── */
  function _tick() {
    var step = SPEEDS[_speed].step;
    var cd = (typeof currentDay !== 'undefined') ? currentDay : 0;
    var td = (typeof TOTAL_DAYS !== 'undefined') ? TOTAL_DAYS : 1508;
    var next = Math.min(cd + step, td);

    // Advance timeline — sync slider and currentDay
    rangeEndDay = next;
    currentDay = next;
    if (typeof updateToDate === 'function') updateToDate(next);
    _updateSeasonIcon();

    // Check waypoints
    if (_wpIndex < WAYPOINTS.length) {
      var wp = WAYPOINTS[_wpIndex];
      if (next >= wp.day) {
        _wpIndex++;
        _showWaypoint(wp);
        return;
      }
    }

    // End of war
    if (next >= td) {
      _showEnd();
    }
  }

  /* ── Waypoint Display ── */
  function _showWaypoint(wp) {
    _paused = true;
    _flyingToWaypoint = true;
    clearInterval(_interval);
    _interval = null;

    // Fly map to show waypoint location + the relevant brothers' actual positions
    if (wp.fly && typeof map !== 'undefined' && map) {
      var points = [[wp.fly.lat, wp.fly.lon]];

      // Find the actual positions of the specified brothers at this moment
      if (typeof DATA !== 'undefined' && DATA && DATA.movements && wp.brothers) {
        var cd = (typeof currentDay !== 'undefined') ? currentDay : 0;
        var cds = (typeof dayToDate === 'function' && typeof dateStr === 'function')
          ? dateStr(dayToDate(cd)) : null;
        if (cds) {
          wp.brothers.forEach(function (bro) {
            // Henry's memorial after Antietam
            if (bro === 'henry' && cds >= '1862-09-17') {
              points.push([39.4747, -77.7447]);
              return;
            }
            var moves = DATA.movements.filter(function (m) {
              return m.brother === bro && m.date <= cds;
            });
            if (moves.length > 0) {
              var cur = moves[moves.length - 1];
              points.push([cur.lat, cur.lon]);
            }
          });
        }
      }

      // Cancel any in-progress tick animation before waypoint fly
      map.stop();

      if (points.length === 1) {
        // Only the waypoint coords — simple flyTo
        map.flyTo(points[0], wp.fly.zoom || 9, { duration: 2.0, easeLinearity: 0.25 });
      } else {
        // Fit bounds to include waypoint + all relevant brothers
        var bounds = L.latLngBounds(points).pad(0.15);
        var minZoom = wp.fly.zoom || 9;
        map.flyToBounds(bounds, { duration: 2.0, easeLinearity: 0.25, maxZoom: minZoom, padding: [40, 40] });
      }
      setTimeout(function () { _flyingToWaypoint = false; }, 2200);
    } else {
      _flyingToWaypoint = false;
    }

    // Pulse brothers
    _pulseBrothers(wp.brothers);

    // Fill card
    var catEl = _cardEl.querySelector('.cine-card-category');
    catEl.textContent = _categoryLabel(wp.category);
    catEl.className = 'cine-card-category ' + wp.category;

    _cardEl.querySelector('.cine-card-title').textContent = wp.title;
    _cardEl.querySelector('.cine-card-body').textContent = wp.body;

    var quoteEl = _cardEl.querySelector('.cine-card-quote');
    var citeEl = _cardEl.querySelector('.cine-card-cite');
    if (wp.quote) {
      quoteEl.textContent = '\u201C' + wp.quote + '\u201D';
      quoteEl.style.display = '';
      citeEl.textContent = wp.quoteCite ? '\u2014 ' + wp.quoteCite : '';
      citeEl.style.display = wp.quoteCite ? '' : 'none';
    } else {
      quoteEl.style.display = 'none';
      citeEl.style.display = 'none';
    }

    // Letter button — opening pauses the auto-resume timer
    var letterBtn = _cardEl.querySelector('.cine-btn-letter');
    if (wp.letterId) {
      letterBtn.style.display = '';
      letterBtn.onclick = function () {
        _openLetterDuringPlay(wp.letterId);
      };
    } else {
      letterBtn.style.display = 'none';
      letterBtn.onclick = null;
    }

    // Auto-resume bar
    var pauseDur = wp.pause || 8000;
    _startResumeTimer(pauseDur);

    // Show card
    _cardEl.classList.add('visible');

    _syncUrl();
  }

  /* ── Resume Timer Management ── */
  function _startResumeTimer(duration) {
    _resumeRemaining = duration;
    _resumeStart = Date.now();

    var resumeFill = _cardEl.querySelector('.cine-resume-fill');
    resumeFill.style.transition = 'none';
    resumeFill.style.width = '100%';
    resumeFill.offsetWidth; // force reflow
    resumeFill.style.transition = 'width ' + (duration / 1000) + 's linear';
    resumeFill.style.width = '0%';

    if (_resumeTimer) clearTimeout(_resumeTimer);
    _resumeTimer = setTimeout(function () {
      _resumeTimer = null;
      _hideCard();
      _resumeAfterWaypoint();
    }, duration);
  }

  function _freezeResumeTimer() {
    if (_resumeTimer) {
      clearTimeout(_resumeTimer);
      _resumeTimer = null;
    }
    var elapsed = Date.now() - _resumeStart;
    _resumeRemaining = Math.max(0, _resumeRemaining - elapsed);

    var resumeFill = _cardEl ? _cardEl.querySelector('.cine-resume-fill') : null;
    if (resumeFill) {
      var currentWidth = resumeFill.getBoundingClientRect().width;
      var trackWidth = resumeFill.parentElement.getBoundingClientRect().width;
      var pct = trackWidth > 0 ? (currentWidth / trackWidth * 100) : 0;
      resumeFill.style.transition = 'none';
      resumeFill.style.width = pct + '%';
    }
  }

  function _unfreezeResumeTimer() {
    if (_resumeRemaining <= 0) {
      _hideCard();
      _resumeAfterWaypoint();
      return;
    }
    _resumeStart = Date.now();

    var resumeFill = _cardEl ? _cardEl.querySelector('.cine-resume-fill') : null;
    if (resumeFill) {
      resumeFill.offsetWidth; // force reflow
      resumeFill.style.transition = 'width ' + (_resumeRemaining / 1000) + 's linear';
      resumeFill.style.width = '0%';
    }

    _resumeTimer = setTimeout(function () {
      _resumeTimer = null;
      _hideCard();
      _resumeAfterWaypoint();
    }, _resumeRemaining);
  }

  /* ── Letter Overlay During Play ── */
  function _openLetterDuringPlay(letterId) {
    _letterOpen = true;
    _freezeResumeTimer();

    if (window.HubbellReader) {
      _mapCurrentLetterId = letterId;
      if (typeof _mapSyncUrl === 'function') _mapSyncUrl();

      HubbellReader.open(letterId, {
        onClose: function () {
          _mapCurrentLetterId = null;
          if (typeof _mapSyncUrl === 'function') _mapSyncUrl();
          _letterOpen = false;
          if (_playing && _paused) {
            _unfreezeResumeTimer();
          }
        }
      });
    }
  }

  function _hideCard() {
    _cardFrozen = false;
    if (_cardEl) {
      _cardEl.classList.remove('visible');
      // Reset pause button for next waypoint
      var pauseBtn = _cardEl.querySelector('.cine-btn-pause');
      if (pauseBtn) pauseBtn.textContent = 'Pause';
    }
    if (_resumeTimer) { clearTimeout(_resumeTimer); _resumeTimer = null; }
    _flyingToWaypoint = false;
    _clearPulse();
  }

  function _resumeAfterWaypoint() {
    if (!_playing) return;
    _paused = false;
    _flyingToWaypoint = false;
    _updatePlayBtn(true);
    _startInterval();
  }

  function _showEnd() {
    stop();
    var btn = document.getElementById('cinePlayBtn');
    if (btn) {
      btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" fill="currentColor"/></svg>';
      btn.title = 'Replay cinematic mode';
    }
  }

  /* ── Waypoint Index Recalculation ── */
  // Sets _wpIndex to the first waypoint at or after the given day.
  // Waypoints already passed (day < given) are skipped.
  function _recalcWaypoints(day) {
    _wpIndex = WAYPOINTS.length; // default: all waypoints passed
    for (var i = 0; i < WAYPOINTS.length; i++) {
      if (WAYPOINTS[i].day >= day) { _wpIndex = i; break; }
    }
  }

  /* ── Slider Repositioning During Play ── */
  function _repositionDuringPlay(newDay) {
    // User dragged the slider — reposition playback to this day
    _hideCard();
    _clearTimers();
    _flyingToWaypoint = false;
    _recalcWaypoints(newDay);

    // Resume ticking from new position
    _paused = false;
    _updatePlayBtn(true);
    _startInterval();
  }

  /* ── Brother Pulse ── */
  var BROTHER_COLORS = {
    henry: '45,95,138',
    alexander: '184,134,11',
    james: '74,124,89',
    charles: '139,58,58',
    mother: '123,94,167'
  };

  function _pulseBrothers(brothers) {
    if (!brothers || !brothers.length) return;
    brothers.forEach(function (b) {
      var nodes = document.querySelectorAll('[data-brother="' + b + '"]');
      nodes.forEach(function (node) {
        node.style.setProperty('--pulse-color', 'rgba(' + (BROTHER_COLORS[b] || '184,134,11') + ',0.6)');
        node.classList.add('cine-pulsing');
      });
    });
  }

  function _clearPulse() {
    document.querySelectorAll('.cine-pulsing').forEach(function (el) {
      el.classList.remove('cine-pulsing');
    });
  }

  /* ── UI Helpers ── */
  function _updatePlayBtn(showPause) {
    var btn = document.getElementById('cinePlayBtn');
    if (!btn) return;
    if (showPause) {
      btn.innerHTML = '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" fill="currentColor"/><rect x="14" y="4" width="4" height="16" fill="currentColor"/></svg>';
      btn.title = 'Pause (Space)';
    } else {
      btn.innerHTML = '<svg viewBox="0 0 24 24"><polygon points="8,5 19,12 8,19" fill="currentColor"/></svg>';
      btn.title = _playing ? 'Resume (Space)' : 'Play cinematic mode (Space)';
    }
  }

  var SPEED_ORDER = ['slow', 'normal', 'fast'];
  function _cycleSpeed() {
    var idx = SPEED_ORDER.indexOf(_speed);
    _speed = SPEED_ORDER[(idx + 1) % SPEED_ORDER.length];
    if (_speedBtnEl) _speedBtnEl.textContent = SPEEDS[_speed].label;
    if (_playing && !_paused && _interval) {
      _startInterval();
    }
  }

  /* ─��� Season Icon ── */
  // Subtle period-appropriate season indicators next to the date display
  var SEASONS = [
    { name: 'winter',  icon: '\u2744', color: '#7BA7C9', start: 0, end: 2 },    // ❄ Dec-Feb
    { name: 'spring',  icon: '\u2740', color: '#7BAF6B', start: 3, end: 5 },    // ❀ Mar-May
    { name: 'summer',  icon: '\u2600', color: '#D4A843', start: 6, end: 8 },    // ��� Jun-Aug
    { name: 'autumn',  icon: '\u2767', color: '#B8703B', start: 9, end: 11 }    // ❧ Sep-Nov
  ];
  var _lastSeason = null;
  var _seasonEl = null;

  function _updateSeasonIcon() {
    var dateEl = document.getElementById('dateDisplay');
    if (!dateEl) return;

    // Get current month from the displayed date
    var cd = (typeof currentDay !== 'undefined') ? currentDay : 0;
    if (typeof dayToDate !== 'function') return;
    var d = dayToDate(cd);
    var month = d.getMonth();

    var season = SEASONS.find(function (s) {
      return s.start <= s.end
        ? (month >= s.start && month <= s.end)
        : (month >= s.start || month <= s.end);
    });
    if (!season || season.name === _lastSeason) return;
    _lastSeason = season.name;

    // Create or update the icon span
    if (!_seasonEl) {
      _seasonEl = document.createElement('span');
      _seasonEl.className = 'cine-season';
      _seasonEl.style.cssText = 'margin-right:6px;font-size:1em;transition:color 0.5s,opacity 0.5s;opacity:0.85;';
      dateEl.prepend(_seasonEl);
    }
    _seasonEl.textContent = season.icon + ' ';
    _seasonEl.style.color = season.color;
  }

  function _fadeCta() {
    if (typeof fadeCta === 'function') fadeCta();
  }

  function _syncUrl() {
    if (typeof _mapSyncUrl === 'function') _mapSyncUrl({ replace: true });
  }

  function _categoryLabel(cat) {
    var labels = {
      battle: 'Battle',
      death: 'Death',
      enlist: 'Enlistment',
      turning_point: 'Turning Point',
      silence: 'Silence',
      homecoming: 'Homecoming'
    };
    return labels[cat] || cat;
  }

  /* ── Slider Interaction During Play ── */
  var _sliderDragging = false;

  function _watchSlider() {
    var rangeEnd = document.getElementById('rangeEnd');
    if (!rangeEnd) return;

    // On drag start: pause ticking so the user has full control
    function onDragStart() {
      if (!_playing) return;
      _sliderDragging = true;
      if (_interval) { clearInterval(_interval); _interval = null; }
      // If at a waypoint, dismiss the card
      if (_paused) {
        _hideCard();
        _paused = false;
      }
    }

    // On drag end: reposition and resume playback from new position
    function onDragEnd() {
      if (!_playing || !_sliderDragging) return;
      _sliderDragging = false;
      _repositionDuringPlay((typeof currentDay !== 'undefined') ? currentDay : 0);
    }

    rangeEnd.addEventListener('mousedown', onDragStart);
    rangeEnd.addEventListener('touchstart', onDragStart, { passive: true });
    rangeEnd.addEventListener('change', onDragEnd);
  }

  /* ── Init ── */
  function init() {
    _injectCSS();
    _injectPlayButton();
    _buildCard();
    _watchSlider();
  }

  /* ── Public API ── */
  return {
    init: init,
    toggle: toggle,
    play: play,
    stop: stop,
    isPlaying: function () { return _playing; },
    isPaused: function () { return _paused; },
    isFlyingToWaypoint: function () { return _flyingToWaypoint; },
    updateSeasonIcon: _updateSeasonIcon
  };

})();
