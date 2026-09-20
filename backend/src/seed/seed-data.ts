import { Types } from 'mongoose';
import { ArrivalMethod } from '../browsing/arrival-method.js';
import type { BrowseOutcome } from '../browsing/browse-outcome.js';

const personIds = {
  mira: '650000000000000000000001',
  theo: '650000000000000000000002',
  lena: '650000000000000000000003',
  omar: '650000000000000000000004',
} as const;

const siteIds = {
  lantern: '660000000000000000000001',
  moss: '660000000000000000000002',
  river: '660000000000000000000003',
  workshop: '660000000000000000000004',
  archive: '660000000000000000000005',
  observatory: '660000000000000000000006',
  atlas: '660000000000000000000007',
  kitchen: '660000000000000000000008',
  garden: '660000000000000000000009',
  radio: '66000000000000000000000a',
} as const;

export const SIX_SITE_TRAIL = [
  'lantern.zz',
  'moss.zz',
  'river.zz',
  'workshop.zz',
  'archive.zz',
  'observatory.zz',
] as const;

export interface SeedData {
  people: SeedPerson[];
  sites: SeedSite[];
  visits: SeedVisit[];
}

interface SeedPerson {
  _id: Types.ObjectId;
  name: string;
  createdAt: Date;
}

interface SeedSite {
  _id: Types.ObjectId;
  address: string;
  title: string;
  html: string;
  searchText: string;
  authorId: Types.ObjectId;
  publishedAt: Date;
}

interface SeedVisit {
  _id: Types.ObjectId;
  personId: Types.ObjectId;
  address: string;
  siteId: Types.ObjectId | null;
  method: ArrivalMethod;
  outcome: BrowseOutcome;
  visitedAt: Date;
}

export function createSeedData(): SeedData {
  const people = [
    person(personIds.mira, 'Mira Chen', '2026-01-10T08:00:00.000Z'),
    person(personIds.theo, 'Theo Okafor', '2026-01-10T08:05:00.000Z'),
    person(personIds.lena, 'Lena Ortiz', '2026-01-10T08:10:00.000Z'),
    person(personIds.omar, 'Omar Haddad', '2026-01-10T08:15:00.000Z'),
  ];

  const sites = [
    site({
      id: siteIds.lantern,
      address: 'lantern.zz',
      title: 'The Lantern Index',
      authorId: personIds.mira,
      publishedAt: '2026-01-11T10:00:00.000Z',
      body: `
        <h1>The Lantern Index</h1>
        <p>Every evening, the keepers light one window for each unfinished story in the district. The lamps are not warnings; they are invitations to continue a thought that someone else had to leave behind.</p>
        <p>This index begins with a field notebook about patient green things. Walk onward to <a href="moss.zz">the moss library</a>, compare the night sky at <a href="observatory.zz">the observatory</a>, or try the deliberately broken road to <a href="lost-lantern.zz">a lantern that was never catalogued</a>.</p>
      `,
      searchText:
        'Every evening the keepers light one window for each unfinished story in the district. The lamps are invitations to continue a thought someone else left behind. This index begins with a field notebook about patient green things.',
    }),
    site({
      id: siteIds.moss,
      address: 'moss.zz',
      title: 'A Library of Moss',
      authorId: personIds.theo,
      publishedAt: '2026-01-11T10:06:00.000Z',
      body: `
        <h1>A Library of Moss</h1>
        <p>The shelves here are fallen branches, and each velvet colony records rain in a different shade of green. Visitors are asked to read with their fingertips and return every stone to the exact patch of shade where it was found.</p>
        <p>The damp footpath continues toward <a href="river.zz">the river that remembers</a>. Those who prefer a familiar lamp can return to <a href="lantern.zz">the Lantern Index</a>.</p>
      `,
      searchText:
        'The shelves are fallen branches and each velvet colony records rain in a different shade of green. Visitors read with their fingertips and return every stone to its patch of shade. The damp footpath continues toward the river.',
    }),
    site({
      id: siteIds.river,
      address: 'river.zz',
      title: 'The River That Remembers',
      authorId: personIds.lena,
      publishedAt: '2026-01-11T10:12:00.000Z',
      body: `
        <h1>The River That Remembers</h1>
        <p>At dawn the ferryman lowers a copper needle into the current and plays yesterday's weather through a wooden horn. Floods sound like low brass, while a dry summer produces a thin note that carries for miles.</p>
        <p>Follow the bank to <a href="workshop.zz">the workshop of useful mistakes</a>, or inspect an unmapped tributary at <a href="undertow.zz">undertow.zz</a>.</p>
      `,
      searchText:
        "At dawn the ferryman lowers a copper needle into the current and plays yesterday's weather through a wooden horn. Floods sound like low brass while a dry summer produces a thin note. Follow the bank to the workshop of useful mistakes.",
    }),
    site({
      id: siteIds.workshop,
      address: 'workshop.zz',
      title: 'The Workshop of Useful Mistakes',
      authorId: personIds.omar,
      publishedAt: '2026-01-11T10:18:00.000Z',
      body: `
        <h1>The Workshop of Useful Mistakes</h1>
        <p>Nothing in this room works as first intended. A crooked ruler measures coastlines, a cracked bell calls only moths, and a backward clock reminds its owner which moments deserve another look.</p>
        <p>The best failures are documented before repair. Their notes are stored in <a href="archive.zz">the archive of small weather</a>.</p>
      `,
      searchText:
        'Nothing in this room works as first intended. A crooked ruler measures coastlines, a cracked bell calls moths, and a backward clock marks moments worth another look. The best failures are documented before repair.',
    }),
    site({
      id: siteIds.archive,
      address: 'archive.zz',
      title: 'Archive of Small Weather',
      authorId: personIds.mira,
      publishedAt: '2026-01-11T10:24:00.000Z',
      body: `
        <h1>Archive of Small Weather</h1>
        <p>Glass drawers preserve the breeze beneath a closing door, the brief fog above a teacup, and the private thunder heard when an attic trunk is moved. Each specimen is labelled with a place and a remembered mood.</p>
        <p>The rooftop stairs lead to <a href="observatory.zz">the patient observatory</a>, where larger patterns become visible.</p>
      `,
      searchText:
        'Glass drawers preserve the breeze beneath a closing door, the brief fog above a teacup, and the private thunder heard when an attic trunk is moved. Each specimen is labelled with a place and a remembered mood.',
    }),
    site({
      id: siteIds.observatory,
      address: 'observatory.zz',
      title: 'The Patient Observatory',
      authorId: personIds.theo,
      publishedAt: '2026-01-11T10:30:00.000Z',
      body: `
        <h1>The Patient Observatory</h1>
        <p>The telescope is aimed not at distant stars but at the gaps between them. Astronomers here believe silence has a shape, and they chart it slowly enough that a single map may occupy several generations.</p>
        <p>Compare their measurements with <a href="atlas.zz">the atlas of quiet places</a>, or begin the circuit again at <a href="lantern.zz">the Lantern Index</a>.</p>
      `,
      searchText:
        'The telescope is aimed at the gaps between distant stars. Astronomers believe silence has a shape and chart it slowly enough that a single map may occupy several generations. Compare their measurements with the atlas of quiet places.',
    }),
    site({
      id: siteIds.atlas,
      address: 'atlas.zz',
      title: 'Atlas of Quiet Places',
      authorId: personIds.lena,
      publishedAt: '2026-01-11T10:36:00.000Z',
      body: `
        <h1>Atlas of Quiet Places</h1>
        <p>This atlas marks the pause after snowfall, the center of an empty theatre, and the shaded side of a sundial. Its cartographers use pale ink so no label becomes louder than the place it describes.</p>
        <p>A pencilled annotation recommends the steady work at <a href="kitchen.zz">the midnight kitchen</a>.</p>
      `,
      searchText:
        'This atlas marks the pause after snowfall, the center of an empty theatre, and the shaded side of a sundial. Cartographers use pale ink so no label becomes louder than the place it describes.',
    }),
    site({
      id: siteIds.kitchen,
      address: 'kitchen.zz',
      title: 'The Midnight Kitchen',
      authorId: personIds.omar,
      publishedAt: '2026-01-11T10:42:00.000Z',
      body: `
        <h1>The Midnight Kitchen</h1>
        <p>After the city sleeps, the ovens bake bread for tomorrow's difficult conversations. Cardamom loaves are reserved for apologies, rye is served with brave questions, and every recipe leaves room for an unexpected guest.</p>
        <p>Fresh scraps become compost in <a href="garden.zz">the garden of second chances</a>.</p>
      `,
      searchText:
        "After the city sleeps the ovens bake bread for tomorrow's difficult conversations. Cardamom loaves are reserved for apologies, rye is served with brave questions, and every recipe leaves room for an unexpected guest.",
    }),
    site({
      id: siteIds.garden,
      address: 'garden.zz',
      title: 'Garden of Second Chances',
      authorId: personIds.mira,
      publishedAt: '2026-01-11T10:48:00.000Z',
      body: `
        <h1>Garden of Second Chances</h1>
        <p>Bent nails support tomato vines and chipped cups shelter seedlings. The gardeners never ask what an object used to be; they ask only what shade, structure, or nourishment it can offer now.</p>
        <p>A weatherproof receiver in the greenhouse is tuned to <a href="radio.zz">the slow radio station</a>.</p>
      `,
      searchText:
        'Bent nails support tomato vines and chipped cups shelter seedlings. The gardeners never ask what an object used to be; they ask what shade, structure, or nourishment it can offer now. A weatherproof receiver waits in the greenhouse.',
    }),
    site({
      id: siteIds.radio,
      address: 'radio.zz',
      title: 'The Slow Radio Station',
      authorId: personIds.theo,
      publishedAt: '2026-01-11T10:54:00.000Z',
      body: `
        <h1>The Slow Radio Station</h1>
        <p>Broadcasts travel at the speed of walking. Reporters carry recorded birdsong, market chatter, and harbour bells from village to village, so every bulletin arrives seasoned by the road.</p>
        <p>Send a reply through <a href="lantern.zz">the Lantern Index</a>, or listen for the silent frequency at <a href="static.zz">static.zz</a>.</p>
      `,
      searchText:
        'Broadcasts travel at the speed of walking. Reporters carry recorded birdsong, market chatter, and harbour bells from village to village, so every bulletin arrives seasoned by the road.',
    }),
  ];

  const visits = [
    visit(
      1,
      personIds.mira,
      'lantern.zz',
      siteIds.lantern,
      ArrivalMethod.Typed,
      '09:00',
    ),
    visit(
      2,
      personIds.omar,
      'garden.zz',
      siteIds.garden,
      ArrivalMethod.Typed,
      '09:00',
    ),
    visit(
      3,
      personIds.theo,
      'observatory.zz',
      siteIds.observatory,
      ArrivalMethod.Typed,
      '09:05',
    ),
    visit(
      4,
      personIds.mira,
      'moss.zz',
      siteIds.moss,
      ArrivalMethod.Link,
      '09:04',
    ),
    visit(
      5,
      personIds.mira,
      'river.zz',
      siteIds.river,
      ArrivalMethod.Link,
      '09:08',
    ),
    visit(
      6,
      personIds.lena,
      'radio.zz',
      siteIds.radio,
      ArrivalMethod.Search,
      '09:10',
    ),
    visit(
      7,
      personIds.mira,
      'workshop.zz',
      siteIds.workshop,
      ArrivalMethod.Link,
      '09:12',
    ),
    visit(
      8,
      personIds.theo,
      'lantern.zz',
      siteIds.lantern,
      ArrivalMethod.Link,
      '09:15',
    ),
    visit(
      9,
      personIds.mira,
      'archive.zz',
      siteIds.archive,
      ArrivalMethod.Link,
      '09:16',
    ),
    visit(
      10,
      personIds.mira,
      'observatory.zz',
      siteIds.observatory,
      ArrivalMethod.Link,
      '09:20',
    ),
    visit(
      11,
      personIds.omar,
      'radio.zz',
      siteIds.radio,
      ArrivalMethod.Link,
      '09:20',
    ),
    visit(
      12,
      personIds.mira,
      'atlas.zz',
      siteIds.atlas,
      ArrivalMethod.Link,
      '09:24',
    ),
    visit(
      13,
      personIds.theo,
      'moss.zz',
      siteIds.moss,
      ArrivalMethod.Link,
      '09:25',
    ),
    visit(
      14,
      personIds.mira,
      'kitchen.zz',
      siteIds.kitchen,
      ArrivalMethod.Link,
      '09:28',
    ),
    visit(
      15,
      personIds.lena,
      'lantern.zz',
      siteIds.lantern,
      ArrivalMethod.Link,
      '09:30',
    ),
    visit(
      16,
      personIds.mira,
      'garden.zz',
      siteIds.garden,
      ArrivalMethod.Link,
      '09:32',
    ),
    visit(
      17,
      personIds.theo,
      'river.zz',
      siteIds.river,
      ArrivalMethod.Link,
      '09:35',
    ),
    visit(
      18,
      personIds.mira,
      'kitchen.zz',
      siteIds.kitchen,
      ArrivalMethod.Back,
      '09:36',
    ),
    visit(
      19,
      personIds.mira,
      'garden.zz',
      siteIds.garden,
      ArrivalMethod.Forward,
      '09:40',
    ),
    visit(20, personIds.omar, 'static.zz', null, ArrivalMethod.Link, '09:40'),
    visit(
      21,
      personIds.mira,
      'lost-lantern.zz',
      null,
      ArrivalMethod.Link,
      '09:44',
    ),
    visit(22, personIds.theo, 'undertow.zz', null, ArrivalMethod.Link, '09:45'),
    visit(
      23,
      personIds.lena,
      'radio.zz',
      siteIds.radio,
      ArrivalMethod.History,
      '09:50',
    ),
    visit(
      24,
      personIds.omar,
      'atlas.zz',
      siteIds.atlas,
      ArrivalMethod.Publish,
      '10:00',
    ),
  ];

  return { people, sites, visits };
}

function person(id: string, name: string, createdAt: string): SeedPerson {
  return {
    _id: new Types.ObjectId(id),
    name,
    createdAt: new Date(createdAt),
  };
}

function site(input: {
  id: string;
  address: string;
  title: string;
  body: string;
  searchText: string;
  authorId: string;
  publishedAt: string;
}): SeedSite {
  return {
    _id: new Types.ObjectId(input.id),
    address: input.address,
    title: input.title,
    html: `<article>${input.body.trim()}</article>`,
    searchText: input.searchText,
    authorId: new Types.ObjectId(input.authorId),
    publishedAt: new Date(input.publishedAt),
  };
}

function visit(
  sequence: number,
  personId: string,
  address: string,
  siteId: string | null,
  method: ArrivalMethod,
  time: string,
): SeedVisit {
  return {
    _id: new Types.ObjectId(
      `6700000000000000000000${sequence.toString(16).padStart(2, '0')}`,
    ),
    personId: new Types.ObjectId(personId),
    address,
    siteId: siteId === null ? null : new Types.ObjectId(siteId),
    method,
    outcome: siteId === null ? 'not_found' : 'found',
    visitedAt: new Date(`2026-01-15T${time}:00.000Z`),
  };
}
