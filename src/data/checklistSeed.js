export const checklistTemplates = [
  {
    id: 1,
    type: 'badkamer',
    name_nl: 'Renovatie Badkamer',
    name_en: 'Bathroom Renovation',
    icon: '🚿',
    color: '#1565C0',
    phases: [
      {
        id: 1, name_nl: 'Voorbereiding', name_en: 'Preparation',
        items: [
          { id: 1,  text_nl: 'Werkgebied afzetten en beschermen', text_en: 'Cordon off and protect work area', critical: true },
          { id: 2,  text_nl: 'Water afsluiten', text_en: 'Shut off water supply', critical: true },
          { id: 3,  text_nl: 'Elektra afsluiten / spanningsvrij maken', text_en: 'Turn off electricity', critical: true },
          { id: 4,  text_nl: 'Foto\'s maken voor aanvang (voor-situatie)', text_en: 'Take before photos', critical: false },
          { id: 5,  text_nl: 'Materialen en gereedschap aanwezig', text_en: 'Materials and tools on site', critical: false },
        ]
      },
      {
        id: 2, name_nl: 'Sloopwerk', name_en: 'Demolition',
        items: [
          { id: 6,  text_nl: 'Bestaande tegels verwijderd', text_en: 'Existing tiles removed', critical: false },
          { id: 7,  text_nl: 'Sanitair gedemonteerd en afgevoerd', text_en: 'Sanitary fixtures removed', critical: false },
          { id: 8,  text_nl: 'Oude leidingen verwijderd', text_en: 'Old pipes removed', critical: false },
          { id: 9,  text_nl: 'Wanden voorbereid (vlak, schoon, droog)', text_en: 'Walls prepared (flat, clean, dry)', critical: true },
          { id: 10, text_nl: 'Vloer vlak gestort of gefreesd', text_en: 'Floor levelled', critical: true },
        ]
      },
      {
        id: 3, name_nl: 'Installatie', name_en: 'Installation',
        items: [
          { id: 11, text_nl: 'Nieuwe leidingen aangelegd (water)', text_en: 'New water pipes installed', critical: true },
          { id: 12, text_nl: 'Afvoerleidingen correct gemonteerd', text_en: 'Drain pipes correctly installed', critical: true },
          { id: 13, text_nl: 'Waterdruktest uitgevoerd — geen lekkages', text_en: 'Pressure test done — no leaks', critical: true },
          { id: 14, text_nl: 'Elektrische installatie badkamer (groep)', text_en: 'Electrical installation (circuit)', critical: true },
          { id: 15, text_nl: 'Vloerverwarming aangelegd (indien van toepassing)', text_en: 'Underfloor heating installed (if applicable)', critical: false },
        ]
      },
      {
        id: 4, name_nl: 'Afwerking', name_en: 'Finishing',
        items: [
          { id: 16, text_nl: 'Vloertegels gelegd — voegen gedicht', text_en: 'Floor tiles laid and grouted', critical: false },
          { id: 17, text_nl: 'Wandtegels gelegd — voegen gedicht', text_en: 'Wall tiles laid and grouted', critical: false },
          { id: 18, text_nl: 'Sanitair geplaatst en aangesloten', text_en: 'Sanitary fixtures installed', critical: false },
          { id: 19, text_nl: 'Siloconenkit rondom aangebracht', text_en: 'Silicone sealant applied', critical: false },
          { id: 20, text_nl: 'Ventilatie gecontroleerd en aangesloten', text_en: 'Ventilation checked and connected', critical: true },
        ]
      },
      {
        id: 5, name_nl: 'Oplevering', name_en: 'Handover',
        items: [
          { id: 21, text_nl: 'Eindschoonmaak uitgevoerd', text_en: 'Final cleaning done', critical: false },
          { id: 22, text_nl: 'Alle functies getest (water, elektra)', text_en: 'All functions tested (water, electricity)', critical: true },
          { id: 23, text_nl: 'Geen lekkages of gebreken geconstateerd', text_en: 'No leaks or defects found', critical: true },
          { id: 24, text_nl: 'Foto\'s na-situatie gemaakt', text_en: 'After photos taken', critical: false },
          { id: 25, text_nl: 'Opdrachtgever akkoord en handtekening', text_en: 'Client approval and signature', critical: true },
        ]
      },
    ]
  },
  {
    id: 2,
    type: 'aanbouw',
    name_nl: 'Aanbouw / Uitbouw',
    name_en: 'Extension / Addition',
    icon: '🏗️',
    color: '#E65100',
    phases: [
      {
        id: 1, name_nl: 'Vergunningen & Voorbereiding', name_en: 'Permits & Preparation',
        items: [
          { id: 1, text_nl: 'Omgevingsvergunning aanwezig en goedgekeurd', text_en: 'Building permit obtained and approved', critical: true },
          { id: 2, text_nl: 'Constructietekening aanwezig', text_en: 'Construction drawing available', critical: true },
          { id: 3, text_nl: 'Nutsbedrijven geïnformeerd (KLIC-melding)', text_en: 'Utilities informed (KLIC notification)', critical: true },
          { id: 4, text_nl: 'Bouwplaats ingericht en beveiligd', text_en: 'Construction site set up and secured', critical: false },
        ]
      },
      {
        id: 2, name_nl: 'Fundering & Constructie', name_en: 'Foundation & Structure',
        items: [
          { id: 5, text_nl: 'Fundering uitgegraven op juiste diepte', text_en: 'Foundation excavated to correct depth', critical: true },
          { id: 6, text_nl: 'Funderingsplaat gestort en uitgehard', text_en: 'Foundation slab poured and cured', critical: true },
          { id: 7, text_nl: 'Muren gemetseld conform tekening', text_en: 'Walls built according to drawing', critical: true },
          { id: 8, text_nl: 'Lateien correct geplaatst', text_en: 'Lintels correctly placed', critical: true },
          { id: 9, text_nl: 'Dakkonstruktie gemonteerd en waterdicht', text_en: 'Roof structure assembled and watertight', critical: true },
        ]
      },
      {
        id: 3, name_nl: 'Installaties', name_en: 'Services',
        items: [
          { id: 10, text_nl: 'Elektrische ruwbouw aangelegd', text_en: 'Electrical rough-in installed', critical: false },
          { id: 11, text_nl: 'Loodgieterswerk ruwbouw aangelegd', text_en: 'Plumbing rough-in installed', critical: false },
          { id: 12, text_nl: 'Isolatie aangebracht (dak, wanden, vloer)', text_en: 'Insulation installed (roof, walls, floor)', critical: true },
        ]
      },
      {
        id: 4, name_nl: 'Afwerking & Oplevering', name_en: 'Finishing & Handover',
        items: [
          { id: 13, text_nl: 'Binnenafwerking stucwerk / gipsplaat', text_en: 'Interior finishing plaster / drywall', critical: false },
          { id: 14, text_nl: 'Vloer aangebracht', text_en: 'Flooring installed', critical: false },
          { id: 15, text_nl: 'Kozijnen en deuren geplaatst', text_en: 'Window frames and doors installed', critical: false },
          { id: 16, text_nl: 'Buitenafwerking correct', text_en: 'External finishing correct', critical: true },
          { id: 17, text_nl: 'Eindcontrole constructeur (indien vereist)', text_en: 'Structural engineer final check (if required)', critical: false },
          { id: 18, text_nl: 'Opdrachtgever akkoord', text_en: 'Client approval', critical: true },
        ]
      },
    ]
  },
  {
    id: 3,
    type: 'dakwerk',
    name_nl: 'Dakwerk / Dakrenovatie',
    name_en: 'Roofing / Roof Renovation',
    icon: '🏠',
    color: '#2E7D32',
    phases: [
      {
        id: 1, name_nl: 'Inspectie & Voorbereiding', name_en: 'Inspection & Preparation',
        items: [
          { id: 1, text_nl: 'Dakconditie volledig geïnspecteerd', text_en: 'Roof condition fully inspected', critical: true },
          { id: 2, text_nl: 'Asbest check uitgevoerd', text_en: 'Asbestos check performed', critical: true },
          { id: 3, text_nl: 'Steiger of dakrandbeveiliging aangebracht', text_en: 'Scaffolding or roof edge protection installed', critical: true },
          { id: 4, text_nl: 'Dakgoten geïnspecteerd', text_en: 'Gutters inspected', critical: false },
          { id: 5, text_nl: 'Voor-foto\'s gemaakt', text_en: 'Before photos taken', critical: false },
        ]
      },
      {
        id: 2, name_nl: 'Uitvoering', name_en: 'Execution',
        items: [
          { id: 6,  text_nl: 'Oud dakmateriaal verwijderd en afgevoerd', text_en: 'Old roofing removed and disposed', critical: false },
          { id: 7,  text_nl: 'Dakconstructie gecontroleerd op gebreken', text_en: 'Roof structure checked for defects', critical: true },
          { id: 8,  text_nl: 'Isolatie aangebracht (correct dikte)', text_en: 'Insulation installed (correct thickness)', critical: true },
          { id: 9,  text_nl: 'Nieuwe dakbedekking aangebracht', text_en: 'New roofing material applied', critical: true },
          { id: 10, text_nl: 'Dakdoorvoeren waterdicht afgewerkt', text_en: 'Roof penetrations sealed watertight', critical: true },
          { id: 11, text_nl: 'Dakgoten vervangen of gereinigd', text_en: 'Gutters replaced or cleaned', critical: false },
          { id: 12, text_nl: 'Hemelwaterafvoer gecontroleerd', text_en: 'Rainwater drainage checked', critical: true },
        ]
      },
      {
        id: 3, name_nl: 'Oplevering', name_en: 'Handover',
        items: [
          { id: 13, text_nl: 'Waterdichtheid gecontroleerd', text_en: 'Watertightness verified', critical: true },
          { id: 14, text_nl: 'Werkplaats gereinigd', text_en: 'Work site cleaned', critical: false },
          { id: 15, text_nl: 'Na-foto\'s gemaakt', text_en: 'After photos taken', critical: false },
          { id: 16, text_nl: 'Garantiebewijs meegegeven', text_en: 'Warranty certificate provided', critical: false },
          { id: 17, text_nl: 'Opdrachtgever akkoord', text_en: 'Client approval', critical: true },
        ]
      },
    ]
  },
  {
    id: 4,
    type: 'schilderwerk',
    name_nl: 'Schilderwerk',
    name_en: 'Painting',
    icon: '🎨',
    color: '#7B1FA2',
    phases: [
      {
        id: 1, name_nl: 'Voorbereiding', name_en: 'Preparation',
        items: [
          { id: 1, text_nl: 'Ondergrond gereinigd en ontvet', text_en: 'Surface cleaned and degreased', critical: true },
          { id: 2, text_nl: 'Scheuren en gaten gedicht', text_en: 'Cracks and holes filled', critical: true },
          { id: 3, text_nl: 'Afplakken en beschermen', text_en: 'Masking and protection applied', critical: false },
          { id: 4, text_nl: 'Verftint goedgekeurd door opdrachtgever', text_en: 'Paint color approved by client', critical: true },
        ]
      },
      {
        id: 2, name_nl: 'Uitvoering', name_en: 'Execution',
        items: [
          { id: 5, text_nl: 'Voorstrijk / primer aangebracht', text_en: 'Primer coat applied', critical: true },
          { id: 6, text_nl: '1e verflaag aangebracht', text_en: '1st coat of paint applied', critical: false },
          { id: 7, text_nl: '2e verflaag aangebracht', text_en: '2nd coat of paint applied', critical: false },
          { id: 8, text_nl: 'Eindresultaat egaal en zonder strepen', text_en: 'Final result even and streak-free', critical: true },
        ]
      },
      {
        id: 3, name_nl: 'Oplevering', name_en: 'Handover',
        items: [
          { id: 9,  text_nl: 'Afplakmateriaal verwijderd', text_en: 'Masking material removed', critical: false },
          { id: 10, text_nl: 'Restverfblikken meegegeven aan opdrachtgever', text_en: 'Leftover paint given to client', critical: false },
          { id: 11, text_nl: 'Opdrachtgever tevreden en akkoord', text_en: 'Client satisfied and approved', critical: true },
        ]
      },
    ]
  },
]

export const checklistInstancesSeed = [
  {
    id: 1,
    templateId: 1,
    templateType: 'badkamer',
    projectId: null,
    projectName: 'Renovatie Badkamer – Lea Klarenbeek',
    clientName: 'Lea Klarenbeek',
    startedAt: '2024-09-03',
    completedAt: null,
    status: 'bezig',
    checks: {
      1: true, 2: true, 3: true, 4: true, 5: true,
      6: true, 7: true, 8: false, 9: false, 10: false,
      11: false, 12: false, 13: false, 14: false, 15: false,
      16: false, 17: false, 18: false, 19: false, 20: false,
      21: false, 22: false, 23: false, 24: false, 25: false,
    },
    notes: {},
  },
  {
    id: 2,
    templateId: 3,
    templateType: 'dakwerk',
    projectId: 3,
    projectName: 'Dakrenovatie Basisschool De Regenboog',
    clientName: 'Basisschool De Regenboog',
    startedAt: '2024-07-01',
    completedAt: '2024-08-31',
    status: 'afgerond',
    checks: {
      1:true,2:true,3:true,4:true,5:true,
      6:true,7:true,8:true,9:true,10:true,11:true,12:true,
      13:true,14:true,15:true,16:true,17:true,
    },
    notes: { 2: 'Geen asbest aangetroffen.' },
  },
]