// ── Workers / Medewerkers ─────────────────────────────────────────────────────
export const workersSeed = [
  {
    id: 1,
    name: 'Jan de Vries',
    role: 'Uitvoerder',
    hourlyRate: 55.00,
    overtimeRate: 82.50,
    phone: '+31 6 12 34 56 78',
    email: 'j.devries@marsbouw.nl',
    status: 'actief',
    color: '#1A3E6F',
  },
  {
    id: 2,
    name: 'Piet Bakker',
    role: 'Elektricien',
    hourlyRate: 52.00,
    overtimeRate: 78.00,
    phone: '+31 6 23 45 67 89',
    email: 'p.bakker@marsbouw.nl',
    status: 'actief',
    color: '#2D6BB5',
  },
  {
    id: 3,
    name: 'Kees Smit',
    role: 'Dakdekker',
    hourlyRate: 48.00,
    overtimeRate: 72.00,
    phone: '+31 6 34 56 78 90',
    email: 'k.smit@marsbouw.nl',
    status: 'actief',
    color: '#2E7D32',
  },
  {
    id: 4,
    name: 'Ali Karim',
    role: 'Tegelzetter',
    hourlyRate: 46.00,
    overtimeRate: 69.00,
    phone: '+31 6 45 67 89 01',
    email: 'a.karim@marsbouw.nl',
    status: 'actief',
    color: '#E65100',
  },
  {
    id: 5,
    name: 'Hassan Bouri',
    role: 'Schilder',
    hourlyRate: 44.00,
    overtimeRate: 66.00,
    phone: '+31 6 56 78 90 12',
    email: 'h.bouri@marsbouw.nl',
    status: 'actief',
    color: '#7B1FA2',
  },
]

// ── Time entries ──────────────────────────────────────────────────────────────
export const timeEntriesSeed = [
  // Week 1 – Sep 2024
  { id:1,  workerId:1, projectId:1, projectName:'Renovatie Restaurant De Gouden Tulp', date:'2024-09-02', startTime:'07:30', endTime:'16:00', breakMinutes:30, workType:'normaal', description:'Sloopwerk begane grond', status:'goedgekeurd', approvedBy:'Jan de Vries' },
  { id:2,  workerId:2, projectId:1, projectName:'Renovatie Restaurant De Gouden Tulp', date:'2024-09-02', startTime:'08:00', endTime:'17:00', breakMinutes:30, workType:'normaal', description:'Inspectie elektrische installatie', status:'goedgekeurd', approvedBy:'Jan de Vries' },
  { id:3,  workerId:1, projectId:1, projectName:'Renovatie Restaurant De Gouden Tulp', date:'2024-09-03', startTime:'07:30', endTime:'17:30', breakMinutes:30, workType:'normaal', description:'Sloopwerk vervolg', status:'goedgekeurd', approvedBy:'Jan de Vries' },
  { id:4,  workerId:3, projectId:3, projectName:'Dakrenovatie Basisschool De Regenboog', date:'2024-09-03', startTime:'07:00', endTime:'16:00', breakMinutes:30, workType:'normaal', description:'Oud dak verwijderen', status:'goedgekeurd', approvedBy:'Jan de Vries' },
  { id:5,  workerId:1, projectId:1, projectName:'Renovatie Restaurant De Gouden Tulp', date:'2024-09-04', startTime:'07:30', endTime:'18:00', breakMinutes:30, workType:'overwerk', description:'Asbestverwijdering start', status:'goedgekeurd', approvedBy:'Jan de Vries' },
  { id:6,  workerId:2, projectId:1, projectName:'Renovatie Restaurant De Gouden Tulp', date:'2024-09-05', startTime:'08:00', endTime:'17:00', breakMinutes:30, workType:'normaal', description:'Leidingen inmeten en bestellen', status:'goedgekeurd', approvedBy:'Jan de Vries' },
  { id:7,  workerId:3, projectId:3, projectName:'Dakrenovatie Basisschool De Regenboog', date:'2024-09-05', startTime:'07:00', endTime:'15:30', breakMinutes:30, workType:'normaal', description:'Isolatie aanbrengen laag 1', status:'goedgekeurd', approvedBy:'Jan de Vries' },
  // Week 2
  { id:8,  workerId:1, projectId:1, projectName:'Renovatie Restaurant De Gouden Tulp', date:'2024-09-09', startTime:'07:30', endTime:'16:30', breakMinutes:30, workType:'normaal', description:'Nieuwe leidingen aanleggen', status:'goedgekeurd', approvedBy:'Jan de Vries' },
  { id:9,  workerId:2, projectId:1, projectName:'Renovatie Restaurant De Gouden Tulp', date:'2024-09-09', startTime:'08:00', endTime:'17:30', breakMinutes:30, workType:'normaal', description:'Elektrakabels trekken', status:'goedgekeurd', approvedBy:'Jan de Vries' },
  { id:10, workerId:4, projectId:4, projectName:'Hotel Amstelzicht BV', date:'2024-09-10', startTime:'08:00', endTime:'17:00', breakMinutes:30, workType:'normaal', description:'Badkamer opbreken kamers 301-303', status:'goedgekeurd', approvedBy:'Jan de Vries' },
  { id:11, workerId:1, projectId:4, projectName:'Hotel Amstelzicht BV', date:'2024-09-10', startTime:'07:30', endTime:'16:30', breakMinutes:30, workType:'normaal', description:'Sloopwerk kamers 304-306', status:'goedgekeurd', approvedBy:'Jan de Vries' },
  { id:12, workerId:2, projectId:1, projectName:'Renovatie Restaurant De Gouden Tulp', date:'2024-09-11', startTime:'08:00', endTime:'18:30', breakMinutes:30, workType:'overwerk', description:'Verdeelkast plaatsen – spoed', status:'goedgekeurd', approvedBy:'Jan de Vries' },
  { id:13, workerId:3, projectId:3, projectName:'Dakrenovatie Basisschool De Regenboog', date:'2024-09-11', startTime:'07:00', endTime:'16:00', breakMinutes:30, workType:'normaal', description:'Dakbedekking leggen', status:'goedgekeurd', approvedBy:'Jan de Vries' },
  { id:14, workerId:5, projectId:2, projectName:'Uitbouw achterzijde woning Visser', date:'2024-09-12', startTime:'08:30', endTime:'16:30', breakMinutes:30, workType:'normaal', description:'Muren voorbereiden schilderwerk', status:'goedgekeurd', approvedBy:'Jan de Vries' },
  { id:15, workerId:4, projectId:4, projectName:'Hotel Amstelzicht BV', date:'2024-09-12', startTime:'08:00', endTime:'17:00', breakMinutes:30, workType:'normaal', description:'Tegelwerk badkamer 301', status:'goedgekeurd', approvedBy:'Jan de Vries' },
  // Week 3
  { id:16, workerId:1, projectId:1, projectName:'Renovatie Restaurant De Gouden Tulp', date:'2024-09-16', startTime:'07:30', endTime:'16:30', breakMinutes:30, workType:'normaal', description:'Elektra afronden keuken', status:'goedgekeurd', approvedBy:'Jan de Vries' },
  { id:17, workerId:2, projectId:1, projectName:'Renovatie Restaurant De Gouden Tulp', date:'2024-09-16', startTime:'08:00', endTime:'17:00', breakMinutes:30, workType:'normaal', description:'Stopcontacten plaatsen', status:'goedgekeurd', approvedBy:'Jan de Vries' },
  { id:18, workerId:4, projectId:4, projectName:'Hotel Amstelzicht BV', date:'2024-09-17', startTime:'08:00', endTime:'17:30', breakMinutes:30, workType:'normaal', description:'Tegelwerk badkamer 302-303', status:'wacht_goedkeuring', approvedBy:null },
  { id:19, workerId:5, projectId:2, projectName:'Uitbouw achterzijde woning Visser', date:'2024-09-17', startTime:'08:30', endTime:'15:30', breakMinutes:30, workType:'normaal', description:'Schilderwerk buitenzijde', status:'wacht_goedkeuring', approvedBy:null },
  { id:20, workerId:1, projectId:4, projectName:'Hotel Amstelzicht BV', date:'2024-09-18', startTime:'07:30', endTime:'17:00', breakMinutes:30, workType:'normaal', description:'Coördinatie teams kamers 3e verdieping', status:'wacht_goedkeuring', approvedBy:null },
  { id:21, workerId:3, projectId:3, projectName:'Dakrenovatie Basisschool De Regenboog', date:'2024-09-18', startTime:'07:00', endTime:'15:00', breakMinutes:30, workType:'normaal', description:'Dakgoten en afvoer plaatsen', status:'wacht_goedkeuring', approvedBy:null },
  { id:22, workerId:2, projectId:1, projectName:'Renovatie Restaurant De Gouden Tulp', date:'2024-09-19', startTime:'08:00', endTime:'16:00', breakMinutes:30, workType:'normaal', description:'Lichtpunten aansluiten', status:'concept', approvedBy:null },
  { id:23, workerId:1, projectId:1, projectName:'Renovatie Restaurant De Gouden Tulp', date:'2024-09-20', startTime:'07:30', endTime:'16:00', breakMinutes:30, workType:'normaal', description:'Algehele inspectie en afronding fase 1', status:'concept', approvedBy:null },
]

// ── Helper to compute hours & cost ───────────────────────────────────────────
export function computeEntry(entry, workers) {
  const worker = workers.find(w => w.id === entry.workerId)
  if (!entry.startTime || !entry.endTime || !worker) return { ...entry, hours: 0, cost: 0 }

  const [sh, sm] = entry.startTime.split(':').map(Number)
  const [eh, em] = entry.endTime.split(':').map(Number)
  const totalMins = (eh * 60 + em) - (sh * 60 + sm) - (entry.breakMinutes || 0)
  const hours = Math.max(0, totalMins / 60)
  const rate  = entry.workType === 'overwerk' ? worker.overtimeRate : worker.hourlyRate
  const cost  = hours * rate

  return { ...entry, hours: +hours.toFixed(2), cost: +cost.toFixed(2), workerName: worker.name, workerRole: worker.role, hourlyRate: rate }
}