const { DataTypes, Model } = require('sequelize')
const { sequelize } = require('../config/database')

class Deal extends Model {}

Deal.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },

    // Identification
    nombre: { type: DataTypes.STRING(255), allowNull: false },
    clasificadoId: { type: DataTypes.STRING(100), allowNull: true },
    barrio: { type: DataTypes.STRING(255), allowNull: true },
    municipio: { type: DataTypes.STRING(255), allowNull: true },
    urlFuente: { type: DataTypes.TEXT, allowNull: true },

    // Financials
    precio: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    unidades: { type: DataTypes.INTEGER, allowNull: true },
    cuartosBanos: { type: DataTypes.STRING(100), allowNull: true },
    rentaMensualEstimada: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    rentaAnualDeclarada: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    presupuestoRenovacion: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    arv: { type: DataTypes.DECIMAL(12, 2), allowNull: true },

    // Financing fit
    soloEfectivo: { type: DataTypes.BOOLEAN, defaultValue: false },
    requierePruebaFondos: { type: DataTypes.BOOLEAN, defaultValue: false },
    financingNotes: { type: DataTypes.TEXT, allowNull: true },

    // Physical / legal
    contadoresSeparados: { type: DataTypes.STRING(100), allowNull: true },
    tituloVerificado: { type: DataTypes.STRING(50), allowNull: true },
    condicion: { type: DataTypes.TEXT, allowNull: true },
    ocupadoActualmente: { type: DataTypes.STRING(100), allowNull: true },

    // Contact & process
    agenteOFsbo: { type: DataTypes.STRING(255), allowNull: true },
    contacto: { type: DataTypes.STRING(255), allowNull: true },
    estadoSeguimiento: {
      type: DataTypes.STRING(50),
      defaultValue: 'not_contacted',
      comment: 'not_contacted | awaiting_response | viewing_scheduled | under_contract | passed | dead'
    },
    fechaContacto: { type: DataTypes.DATEONLY, allowNull: true },

    // Per-property PITI overrides (null = use global default)
    taxesInsuranceMonthly: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    hoaMonthly: { type: DataTypes.DECIMAL(10, 2), allowNull: true }
  },
  {
    sequelize,
    modelName: 'Deal',
    tableName: 'deals',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['userId', 'clasificadoId'] }
    ]
  }
)

module.exports = Deal
