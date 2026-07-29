window.TRANSLATIONS = window.TRANSLATIONS || {}
window.TRANSLATIONS.en = {
  // Nav / global
  nav_deals: 'DealFlow',
  nav_dashboard: 'Dashboard',
  nav_logout: 'Log out',
  language: 'Language',

  // Page title
  page_title: 'DealFlow',
  page_subtitle: 'Real estate due diligence',

  // Actions
  btn_add_deal: 'Add Deal',
  btn_import_csv: 'Import CSV',
  btn_export_csv: 'Export CSV',
  btn_save: 'Save',
  btn_cancel: 'Cancel',
  btn_delete: 'Delete',
  btn_add_note: 'Add Note',
  btn_back: '← Back to list',
  btn_quick_add: 'Quick Add',

  // Filters / sort
  filter_all: 'All statuses',
  filter_municipio: 'All municipalities',
  filter_financing: 'All financing',
  filter_cash_only: 'Cash only',
  filter_financeable: 'Financeable',
  sort_label: 'Sort by',
  sort_price: 'Price',
  sort_dscr: 'DSCR',
  sort_status: 'Status',
  sort_light: 'Traffic light',
  sort_date: 'Date added',

  // Traffic light
  light_verde: 'Green',
  light_amarillo: 'Yellow',
  light_rojo: 'Red',
  light_na: 'N/A',

  // Deal fields
  field_nombre: 'Property Name',
  field_clasificadoId: 'Listing ID',
  field_barrio: 'Neighborhood',
  field_municipio: 'Municipality',
  field_urlFuente: 'Source URL',
  field_precio: 'Purchase Price ($)',
  field_unidades: 'Units',
  field_cuartosBanos: 'Bed/Bath',
  field_rentaMensual: 'Est. Monthly Rent ($)',
  field_rentaAnual: 'Declared Annual Rent ($)',
  field_presupuestoRenovacion: 'Renovation Budget ($)',
  field_arv: 'ARV ($)',
  field_soloEfectivo: 'Cash Only',
  field_requierePrueba: 'Proof of Funds Required',
  field_financingNotes: 'Financing Notes',
  field_contadores: 'Separate Meters',
  field_titulo: 'Title Status',
  field_condicion: 'Condition',
  field_ocupado: 'Currently Occupied',
  field_agente: 'Agent / FSBO',
  field_contacto: 'Contact',
  field_estado: 'Status',
  field_fechaContacto: 'Contact Date',
  field_taxesInsurance: 'Monthly Taxes + Insurance ($)',
  field_hoa: 'Monthly HOA ($)',

  // Status options
  status_not_contacted: 'Not contacted',
  status_awaiting_response: 'Awaiting response',
  status_viewing_scheduled: 'Viewing scheduled',
  status_under_contract: 'Under contract',
  status_passed: 'Passed',
  status_dead: 'Dead',

  // Title status options
  titulo_verified: 'Verified',
  titulo_pending: 'Pending',
  titulo_unknown: 'Unknown',

  // Calculated fields
  calc_dscr: 'DSCR',
  calc_cashflow: 'Monthly Cash Flow',
  calc_rent_to_price: 'Rent-to-Price',
  calc_reno_arv: 'Reno-to-ARV',
  calc_piti: 'Est. PITI',
  calc_na: 'N/A',

  // PITI settings
  settings_title: 'PITI Calculator Defaults',
  settings_down: 'Down Payment %',
  settings_rate: 'Interest Rate %',
  settings_term: 'Loan Term (years)',
  settings_taxes: 'Monthly Taxes + Insurance ($, global default)',
  settings_save: 'Save Defaults',
  settings_saved: 'Saved',

  // Notes
  notes_title: 'Communication Log',
  notes_placeholder: 'Enter note (call summary, info learned, next steps…)',
  notes_empty: 'No notes yet.',

  // Import
  import_title: 'Import CSV',
  import_instructions: 'Select a CSV file. Columns will be auto-detected (Spanish or English headers). Existing properties with the same listing ID will be skipped.',
  import_choose: 'Choose file',
  import_preview: 'Preview',
  import_confirm: 'Import',
  import_success: '{created} deal(s) imported, {skipped} skipped (already exist).',
  import_error: 'Import failed. Check that the file is a valid CSV.',
  import_no_file: 'Please select a file first.',

  // Export
  export_success: 'CSV downloaded.',

  // Quick add
  quick_add_title: 'Quick Add Deal',
  quick_add_name: 'Property Name *',
  quick_add_price: 'Price ($)',
  quick_add_units: 'Units',
  quick_add_url: 'Source URL',

  // Empty states
  empty_deals: 'No deals yet. Add one or import a CSV.',
  empty_filtered: 'No deals match the current filters.',

  // Errors
  error_nombre_required: 'Property name is required.',
  error_generic: 'Something went wrong. Please try again.',
  error_load: 'Failed to load deals.',

  // Confirm
  confirm_delete_deal: 'Delete this deal and all its notes? This cannot be undone.',
  confirm_delete_note: 'Delete this note?',

  // Units
  unit_per_month: '/mo',
  unit_percent: '%',
  yes: 'Yes',
  no: 'No',
  unknown: 'Unknown',
}
