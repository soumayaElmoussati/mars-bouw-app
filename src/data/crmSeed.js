import { clientsSeed } from './clientsSeed'
import { projectsSeed } from './projectsSeed'
import { offertesSeed, factuurSeed } from './financeSeed'

export const crmNotesSeed = [
  { id:1, clientId:1, date:'2024-08-15', type:'gesprek',  author:'Jan de Vries', content:'Eerste gesprek over renovatie. Klant wil uitgebreid renoveren voor heropening in december.', followUp:'2024-08-22', followUpDone:true },
  { id:2, clientId:1, date:'2024-08-22', type:'email',    author:'Jan de Vries', content:'Offerte verstuurd per e-mail. Klant vraagt om aanpassing verlichting keuken (+4 spots).', followUp:null, followUpDone:false },
  { id:3, clientId:1, date:'2024-09-01', type:'telefoon', author:'Jan de Vries', content:'Offerte goedgekeurd. Start werkzaamheden bevestigd voor 2 september.', followUp:'2024-09-10', followUpDone:true },
  { id:4, clientId:1, date:'2024-09-12', type:'probleem', author:'Jan de Vries', content:'Asbest aangetroffen – klant geïnformeerd. Extra kosten besproken.', followUp:'2024-09-15', followUpDone:false },
  { id:5, clientId:2, date:'2024-10-01', type:'gesprek',  author:'Jan de Vries', content:'Eerste kennismaking uitbouw. Klant heeft constructietekening bij architect laten maken.', followUp:'2024-10-08', followUpDone:false },
  { id:6, clientId:4, date:'2024-09-05', type:'vergadering', author:'Jan de Vries', content:'Kick-off meeting hotel. 24 kamers in 2 fases renoveren. Planning besproken.', followUp:'2024-10-01', followUpDone:true },
  { id:7, clientId:4, date:'2024-10-18', type:'probleem', author:'Jan de Vries', content:'Airco leverancier heeft vertraging van 6 weken gemeld. Klant geïnformeerd. Alternatief leverancier onderzocht.', followUp:'2024-10-25', followUpDone:false },
]

export const crmContactsSeed = [
  { id:1, clientId:1, name:'Mohamed El Amrani', role:'Eigenaar / Opdrachtgever', phone:'+31 20 123 4567', email:'info@goudentulp.nl', primary:true },
  { id:2, clientId:1, name:'Fatima El Amrani',  role:'Manager restaurant',        phone:'+31 6 98765432',  email:'fatima@goudentulp.nl', primary:false },
  { id:3, clientId:4, name:'Sara de Boer',       role:'Directeur',                phone:'+31 20 555 0100', email:'s.deboer@amstelzicht.nl', primary:true },
  { id:4, clientId:4, name:'Peter Kuijpers',     role:'Technisch beheerder',      phone:'+31 6 12345678',  email:'p.kuijpers@amstelzicht.nl', primary:false },
]