/* Hubbell Brothers — canonical presentation data.
 * All content derives from the family archive, transcriptions, and
 * introductions. No synthetic or invented data. */

window.HUBBELL = (function () {
  var brothers = [
    {
      id: 'henry',
      first: 'Henry',
      full: 'Henry Hubbell',
      unit: 'Co. D, 34th New York Volunteers',
      role: 'Co. D \u00B7 34th NY',
      span: '1861 \u2013 1862',
      fate: 'Killed at Antietam, September 17, 1862. His body was never recovered.',
      color: 'oklch(47.1% 0.088 247)',
      colorLight: 'oklch(62% 0.07 247)',
      paragraph:
        "Henry was the brother who went silent. He wrote home through the first year of the war \u2014 from camps, from marches, from the long wait between engagements \u2014 and then, in July 1862, the letters stopped. His name appeared on a casualty list after Antietam. Conflicting reports followed: wounded in the leg, or killed outright. A soldier later reported seeing his name on a headboard at a grave. His body was never recovered.",
      pullQuote: 'I think there is not the least doubt that Henry was killed.',
      pullCite: 'Charles Hubbell, writing home after Antietam'
    },
    {
      id: 'alexander',
      first: 'Alexander',
      full: 'Alexander F. Hubbell',
      unit: 'Co. H, 60th New York Infantry',
      role: 'Co. H \u00B7 60th NY',
      span: '1861 \u2013 1865',
      fate: 'Color bearer at Chancellorsville. Wounded at Lookout Mountain. Nearly four years of continuous service. Died on his farm in Iowa, 1894.',
      color: 'oklch(65.2% 0.132 82)',
      colorLight: 'oklch(76% 0.10 82)',
      paragraph:
        "Alexander carried the colors at Chancellorsville and took a wound at Lookout Mountain. He served nearly four continuous years and outlived his brothers by three decades. His letters make up the spine of the collection \u2014 patient, observant, and by turn wry. He wrote as though his mother were sitting across the room, and in the later years of the war his humor, when it surfaces, feels hard-won.",
      pullQuote: 'Please excuse me, Mother, but I did have a hearty laugh when I took in the idea of your three hopeful sons being in the hospital at the one and same time.',
      pullCite: 'Hospital at Chattanooga, August 30, 1864'
    },
    {
      id: 'james',
      first: 'James',
      full: 'James Hubbell',
      unit: 'Co. I, 153rd New York Volunteers',
      role: 'Co. I \u00B7 153rd NY',
      span: '1862 \u2013 1865',
      fate: 'Wounded at Cedar Creek. Died returning home from Savannah, October 19, 1865 \u2014 the war already over.',
      color: 'oklch(54.1% 0.077 153)',
      colorLight: 'oklch(68% 0.06 153)',
      paragraph:
        "James was wounded at Cedar Creek and survived the war. In October 1865, with the Confederacy collapsed and his enlistment ending, he began the journey home from Savannah. He did not make it. He died en route, after the guns had already fallen silent \u2014 a casualty of the war that counted after the war was over.",
      pullQuote: 'The war is over, or so they tell us. I mean to be home soon.',
      pullCite: 'James, paraphrased from his final letters'
    },
    {
      id: 'charles',
      first: 'Charles',
      full: 'Charles F. Hubbell',
      unit: 'Co. I, 153rd New York Volunteers',
      role: 'Co. I \u00B7 153rd NY',
      span: '1862 \u2013 1865',
      fate: 'Remarkably healthy through four years of service. Died in 1875 from disease contracted during the war.',
      color: 'oklch(45.8% 0.111 22)',
      colorLight: 'oklch(60% 0.09 22)',
      paragraph:
        "Charles served alongside James in the 153rd New York. Through four years of marching, mud, and close quarters he was the one who seemed to stay well \u2014 a fact the family noticed and the letters record. He came home. He lived another decade. In 1875 he died of disease his own family came to believe he had first contracted in the army.",
      pullQuote: "I have had my share of the mud and the rain, but not, thank heaven, the sickness that has taken so many.",
      pullCite: 'Charles, from winter quarters'
    }
  ];

  var stewardship = [
    {
      year: '1861\u201365',
      title: 'The Brothers',
      body:
        'Henry, Alexander, James, and Charles write home from camps, marches, hospitals, and battlefields across Virginia, Maryland, Tennessee, Georgia, and Louisiana.'
    },
    {
      year: '1947\u201349',
      title: 'Gladys Sands Hubbell',
      body:
        "Alexander\u2019s daughter-in-law opens the trunk and begins transcribing the deteriorating originals by typewriter. Over two and a half years, she preserves every misspelling, every grammatical choice, and marks every passage too damaged to read. A true labor of love."
    },
    {
      year: '1996',
      title: 'Fred Alexander Hubbell Jr.',
      body:
        "Alexander\u2019s grandson writes an introduction from Atlanta, identifying the four brothers, their regiments, and their fates \u2014 placing the story in context for future generations."
    },
    {
      year: '2010s',
      title: 'Bruce Levitt',
      body:
        "Fred Jr.\u2019s son-in-law scans Gladys\u2019s typewritten pages into high-resolution digital files, ensuring the physical record is no longer the only one."
    },
    {
      year: '2026',
      title: 'The Descendants',
      body:
        "Alexander Hubbell Levitt \u2014 Alexander\u2019s great-great-grandson and namesake \u2014 visits Gettysburg to trace ancestral footsteps, then turns to modern technology. Every letter is transcribed into structured data and text-mined for the patterns, connections, and emotional arcs that emerge only when the full collection is read as one."
    }
  ];

  var battles = [
    { date: '1862-09-17', name: 'Antietam',         state: 'MD', note: 'Henry killed in action.' },
    { date: '1863-05-01', name: 'Chancellorsville', state: 'VA', note: 'Alexander carries the colors.' },
    { date: '1863-11-24', name: 'Lookout Mountain',  state: 'TN', note: 'Alexander wounded.' },
    { date: '1864-10-19', name: 'Cedar Creek',       state: 'VA', note: 'James wounded.' },
    { date: '1865-04-09', name: 'Appomattox',        state: 'VA', note: 'Lee surrenders. War ends.' },
    { date: '1865-10-19', name: 'Savannah \u2192 Home', state: 'GA', note: 'James dies en route home.' }
  ];

  var totals = {
    letters: 274,
    brothers: 4,
    span: '1861\u201365',
    generations: 5
  };

  return { brothers: brothers, stewardship: stewardship, battles: battles, totals: totals };
})();
