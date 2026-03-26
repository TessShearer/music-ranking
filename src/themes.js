// src/themes.js
// All theme definitions live here. Only the theme ID needs to be stored in the database per user.
// light_one  = primary background color
// light_two  = secondary background color
// dark_one   = primary text / foreground color
// dark_two   = accent / button color
// header     = path to header banner image (served from /public)
// image      = path to theme icon image (served from /public)

export const themes = {
  0: {
    id: 0,
    name: 'Default',
    light_one: '#ffffff',
    light_two: '#f5f5f5',
    dark_one:  '#212529',
    dark_two:  '#495057',
    header: null,
    image: '/themes/note.png',
  },
  1: {
    id: 1,
    name: 'Reputation',
    light_one: '#222222',
    light_two: '#424242',
    dark_one:  '#f5f5f5',
    dark_two:  '#d4af37',
    header: '/themes/rep_header.jpg',
    image: '/themes/rep.png',
  },
  2: {
    id: 2,
    name: 'Lover',
    light_one: '#f7e6ef',
    light_two: '#f7dce6',
    dark_one:  '#7a1e5e',
    dark_two:  '#91c3e6',
    header: '/themes/lover_header.jpg',
    image: '/themes/lover.png',
  },
  3: {
    id: 3,
    name: 'Love Sux',
    light_one: '#faf6f6',
    light_two: '#e4e0e0',
    dark_one:  '#1a1a1a',
    dark_two:  '#c41230',
    header: '/themes/love_sux_header.jpg',
    header_position: 'top',
    image: '/themes/lovesux.png',
  },
  4: {
    id: 4,
    name: 'Good Kid M.A.A.D. City',
    light_one: '#f0ede4',
    light_two: '#e5e0d4',
    dark_one:  '#4a4035',
    dark_two:  '#7a6a5a',
    header: '/themes/gkmc_header.webp',
    image: '/themes/KendrickGKMC.jpg',
  },
}

export function getTheme(id) {
  return themes[id] ?? themes[0]
}
