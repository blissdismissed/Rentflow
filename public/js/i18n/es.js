window.TRANSLATIONS = window.TRANSLATIONS || {}
window.TRANSLATIONS.es = {
  // Nav / global
  nav_deals: 'DealFlow',
  nav_dashboard: 'Panel',
  nav_logout: 'Cerrar sesión',
  language: 'Idioma',

  // Page title
  page_title: 'DealFlow',
  page_subtitle: 'Diligencia debida inmobiliaria',

  // Actions
  btn_add_deal: 'Agregar Deal',
  btn_import_csv: 'Importar CSV',
  btn_export_csv: 'Exportar CSV',
  btn_save: 'Guardar',
  btn_cancel: 'Cancelar',
  btn_delete: 'Eliminar',
  btn_add_note: 'Agregar Nota',
  btn_back: '← Volver a la lista',
  btn_quick_add: 'Agregar Rápido',

  // Filters / sort
  filter_all: 'Todos los estados',
  filter_municipio: 'Todos los municipios',
  filter_financing: 'Todo financiamiento',
  filter_cash_only: 'Solo efectivo',
  filter_financeable: 'Financiable',
  sort_label: 'Ordenar por',
  sort_price: 'Precio',
  sort_dscr: 'DSCR',
  sort_status: 'Estado',
  sort_light: 'Semáforo',
  sort_date: 'Fecha agregada',

  // Traffic light
  light_verde: 'Verde',
  light_amarillo: 'Amarillo',
  light_rojo: 'Rojo',
  light_na: 'N/D',

  // Deal fields
  field_nombre: 'Nombre de la Propiedad',
  field_clasificadoId: 'ID del Clasificado',
  field_barrio: 'Barrio',
  field_municipio: 'Municipio',
  field_urlFuente: 'URL de Fuente',
  field_precio: 'Precio de Compra ($)',
  field_unidades: 'Unidades',
  field_cuartosBanos: 'Cuartos/Baños',
  field_rentaMensual: 'Renta Mensual Estimada ($)',
  field_rentaAnual: 'Renta Anual Declarada ($)',
  field_presupuestoRenovacion: 'Presupuesto de Renovación ($)',
  field_arv: 'ARV ($)',
  field_soloEfectivo: 'Solo Efectivo',
  field_requierePrueba: 'Requiere Prueba de Fondos',
  field_financingNotes: 'Notas de Financiamiento',
  field_contadores: 'Contadores Separados',
  field_titulo: 'Estado del Título',
  field_condicion: 'Condición',
  field_ocupado: 'Actualmente Ocupado',
  field_agente: 'Agente / FSBO',
  field_contacto: 'Contacto',
  field_estado: 'Estado de Seguimiento',
  field_fechaContacto: 'Fecha de Contacto',
  field_taxesInsurance: 'Impuestos + Seguro Mensual ($)',
  field_hoa: 'HOA Mensual ($)',

  // Status options
  status_not_contacted: 'No contactado',
  status_awaiting_response: 'Esperando respuesta',
  status_viewing_scheduled: 'Visita programada',
  status_under_contract: 'Bajo contrato',
  status_passed: 'Descartado',
  status_dead: 'Muerto',

  // Title status options
  titulo_verified: 'Verificado',
  titulo_pending: 'Pendiente',
  titulo_unknown: 'Por verificar',

  // Calculated fields
  calc_dscr: 'DSCR',
  calc_cashflow: 'Flujo de Caja Mensual',
  calc_rent_to_price: 'Renta / Precio',
  calc_reno_arv: 'Reno / ARV',
  calc_piti: 'PITI Estimado',
  calc_na: 'N/D',

  // PITI settings
  settings_title: 'Parámetros PITI',
  settings_down: 'Pago Inicial %',
  settings_rate: 'Tasa de Interés %',
  settings_term: 'Plazo del Préstamo (años)',
  settings_taxes: 'Impuestos + Seguro Mensual ($, predeterminado global)',
  settings_save: 'Guardar',
  settings_saved: 'Guardado',

  // Notes
  notes_title: 'Registro de Comunicaciones',
  notes_placeholder: 'Agregar nota (resumen de llamada, información aprendida, próximos pasos…)',
  notes_empty: 'No hay notas aún.',

  // Import
  import_title: 'Importar CSV',
  import_instructions: 'Selecciona un archivo CSV. Las columnas se detectan automáticamente (encabezados en español o inglés). Las propiedades con el mismo ID de clasificado se omitirán.',
  import_choose: 'Elegir archivo',
  import_preview: 'Vista previa',
  import_confirm: 'Importar',
  import_success: '{created} deal(s) importado(s), {skipped} omitido(s) (ya existen).',
  import_error: 'Error al importar. Verifica que el archivo sea un CSV válido.',
  import_no_file: 'Por favor selecciona un archivo primero.',

  // Export
  export_success: 'CSV descargado.',

  // Quick add
  quick_add_title: 'Agregar Deal Rápido',
  quick_add_name: 'Nombre de la Propiedad *',
  quick_add_price: 'Precio ($)',
  quick_add_units: 'Unidades',
  quick_add_url: 'URL de Fuente',

  // Empty states
  empty_deals: 'Sin deals aún. Agrega uno o importa un CSV.',
  empty_filtered: 'No hay deals que coincidan con los filtros actuales.',

  // Errors
  error_nombre_required: 'El nombre de la propiedad es requerido.',
  error_generic: 'Algo salió mal. Por favor intenta de nuevo.',
  error_load: 'Error al cargar deals.',

  // Confirm
  confirm_delete_deal: '¿Eliminar este deal y todas sus notas? Esta acción no se puede deshacer.',
  confirm_delete_note: '¿Eliminar esta nota?',

  // Units
  unit_per_month: '/mes',
  unit_percent: '%',
  yes: 'Sí',
  no: 'No',
  unknown: 'Por verificar',
}
