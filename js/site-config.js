/**
 * LUNA Lab — site-wide links (single source of truth)
 *
 * Links that appear on several pages (nav/footer/body) are listed here once.
 * Any <a data-link="KEY"> on any page gets its href from this table when the
 * page loads, so a changed URL only needs to be edited here.
 * (The href written in the HTML is only a fallback for visitors without JS.)
 *
 * Paper links live in data/publications.json; people's links in data/members.json.
 */
window.LUNA_LINKS = {
  piHomepage:     'https://yuejiang-nj.github.io/',
  piEmail:        'mailto:yue.jiang@utah.edu',
  labGithub:      'https://github.com/YueJiang-nj',
  interestForm:   'https://forms.gle/C7Nkma4qETisPi3m6',
  phdAdmissions:  'https://www.cs.utah.edu/graduate/admissions/',
  raiPostdoc:     'https://rai.utah.edu/opportunities/postdoctoral-fellows/',
  hccGroup:       'https://hci.utah.edu/',
  schoolOfComputing: 'https://www.cs.utah.edu/',
  universityOfUtah:  'https://www.utah.edu/',
};
